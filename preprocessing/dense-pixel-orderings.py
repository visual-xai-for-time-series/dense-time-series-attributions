#!/usr/bin/env python

import os
import sys
import dill
import time
import random
import argparse

import numpy as np
import pandas as pd

import json
from json import JSONEncoder

from tqdm import tqdm

import torch
import torch.nn as nn

from torch.utils.data import Dataset, DataLoader

from sklearn.preprocessing import OneHotEncoder

from sktime.datasets import load_UCR_UEA_dataset

from logger import logger


random_seed = 13

torch.manual_seed(random_seed)
random.seed(random_seed)
np.random.seed(random_seed)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

logger.info('')
logger.info(f'Found: {device}')
logger.info('')

from models import *
from distance_functions import *
from measures import *
from helpers import *


class TimeSeriesDataset(Dataset):

    def __init__(self, X, y):
        self.X = X
        self.y = y

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        inputs = self.X[idx]
        label = self.y[idx]

        return inputs, label


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        return JSONEncoder.default(self, obj)


def main():
    overall_time = time.process_time()

    parser = argparse.ArgumentParser(description='Calculate orderings for a model for a selected dataset.')

    # Add arguments
    parser.add_argument('--dataset', '-d', type=str, required=True,
                        default='FordA', help='Specify the dataset (e.g., FordA)')
    parser.add_argument('--model', '-m', type=str, required=True, 
                        choices=['cnn', 'resnet'], 
                        help='Specify the model type (choose from: cnn, resnet)')
    parser.add_argument('--model_path', '-mp', type=str, default='data/', 
                        help='Path to save/load the model (default: data/)')
    parser.add_argument('--results_path', '-rp', type=str, default='results/', 
                        help='Path to save the results (default: results/)')

    logger.info('Setting the stage')

    # Parse the arguments
    args = parser.parse_args()

    dataset = args.dataset
    model_type = args.model
    base_data_path = args.model_path
    results_path = args.results_path

    ######## Set directories

    model_base_name = f'{model_type.lower()}-{dataset.lower()}'
    model_file = f'{model_base_name}.pt'

    model_path = os.path.join(base_data_path, model_file)

    extracted_data_path = os.path.join(base_data_path, 'extracted')

    os.makedirs(base_data_path, exist_ok=True)
    os.makedirs(extracted_data_path, exist_ok=True)

    results_path = os.path.join(results_path, f'{model_base_name}')
    os.makedirs(results_path, exist_ok=True)

    ######## Get the data

    logger.info(f'Getting the data: {dataset}')

    X_train, y_train = load_UCR_UEA_dataset(name=dataset, split='train', return_type='numpyflat')
    X_test, y_test = load_UCR_UEA_dataset(name=dataset, split='test', return_type='numpyflat')

    logger.info(f'Length training data: {len(X_train)} labels: {len(y_train)} test data: {len(X_test)} labels: {len(y_test)}')

    encoder = OneHotEncoder(categories='auto', sparse_output=False)

    y_train_ohe = encoder.fit_transform(np.expand_dims(y_train, axis=-1))
    y_test_ohe = encoder.transform(np.expand_dims(y_test, axis=-1))

    y_train_norm = y_train_ohe.argmax(axis=-1)
    y_test_norm = y_test_ohe.argmax(axis=-1)

    labels_nr = len(encoder.categories_[0])

    dataset_train = TimeSeriesDataset(X_train, y_train_ohe)
    dataset_test = TimeSeriesDataset(X_test, y_test_ohe)

    dataloader_train = DataLoader(dataset_train, batch_size=120, shuffle=False)
    dataloader_train_not_shuffled = DataLoader(dataset_train, batch_size=120, shuffle=False)
    dataloader_test = DataLoader(dataset_test, batch_size=120, shuffle=False)

    ######## Load model

    logger.info(f'Loading the model: {model_type} in {model_path}')

    model = torch.load(model_path, map_location=device)
    model.eval()

    ######## Get model accuracy on data

    preds = []
    labels = []
    for x in dataloader_train_not_shuffled:
        input_, label_ = x
        input_ = input_.reshape(input_.shape[0], 1, -1)
        input_ = input_.float().to(device)
        label_ = label_.float().to(device)

        pred_ = model(input_)
        preds.extend(pred_)
        labels.extend(label_)

    preds = torch.stack(preds)
    labels = torch.stack(labels)
    pred_train_acc_ = np.round((preds.argmax(dim=-1) == labels.argmax(dim=-1)).int().sum().float().item() / len(preds), 4)
    logger.info(f'Prediction Accuracy Train: {pred_train_acc_}')

    y_train_pred = preds.cpu().detach().numpy().round(3)
    
    model.eval()

    preds = []
    labels = []
    for x in dataloader_test:
        input_, label_ = x
        input_ = input_.reshape(input_.shape[0], 1, -1)
        input_ = input_.float().to(device)
        label_ = label_.float().to(device)

        pred_ = model(input_)
        preds.extend(pred_)
        labels.extend(label_)

    preds = torch.stack(preds)
    labels = torch.stack(labels)
    pred_test_acc_ = np.round((preds.argmax(dim=-1) == labels.argmax(dim=-1)).int().sum().float().item() / len(preds), 4)
    logger.info(f'Prediction Accuracy Test: {pred_test_acc_}')

    y_test_pred = preds.cpu().detach().numpy().round(3)

    ######## Get activations

    logger.info('Getting the activation')

    activations_path = os.path.join(extracted_data_path, f'{model_base_name.lower()}-activations.pkl')
    if os.path.exists(activations_path):
        with open(activations_path, 'rb') as file:
            activations = dill.load(file)
    else:
        activations = {}
        def get_activation(name):
            def hook(model, input, output):
                if name not in activations:
                    activations[name] = []
                output_transformed = output
                if model_type == 'resnet':
                    output_transformed = torch.amax(output, dim=1)
                data = output_transformed.detach().cpu().numpy().tolist()
                activations[name].extend(data)
            return hook

        model.eval()

        found_layers = get_possible_layers(model)
        logger.info(f'Found following layers: {found_layers}')
        layer_to_look_at = found_layers[-1]
        logger.info(f'Selected layer: {layer_to_look_at}')
        fc1_handle = layer_to_look_at.register_forward_hook(get_activation('train-layers'))
        # fc1_handle = model.layers.register_forward_hook(get_activation('train-layers'))

        for idx, (inputs, labels) in enumerate(dataloader_train_not_shuffled):
            inputs = inputs.reshape(inputs.shape[0], 1, -1)
            inputs = inputs.float().to(device)
            labels = labels.float().to(device)
        
            preds = model(inputs)

        fc1_handle.remove()

        fc1_handle = layer_to_look_at.register_forward_hook(get_activation('test-layers'))
        # fc1_handle = model.layers.register_forward_hook(get_activation('test-layers'))

        for idx, (inputs, labels) in enumerate(dataloader_test):
            inputs = inputs.reshape(inputs.shape[0], 1, -1)
            inputs = inputs.float().to(device)
            labels = labels.float().to(device)
        
            preds = model(inputs)
        
        fc1_handle.remove()

        with open(activations_path, 'wb') as file:
            dill.dump(activations, file)

    activations_train = np.array(activations['train-layers'])
    activations_test = np.array(activations['test-layers'])
    logger.info(f'Length of train activations: {activations_train.shape}')
    logger.info(f'Length of test activations: {activations_test.shape}')

    ######## Get attributions

    logger.info('Getting the attributions')

    from captum.attr import GradientShap, DeepLiftShap, LRP
    from captum.attr import IntegratedGradients, ShapleyValueSampling
    from captum.attr import Saliency, InputXGradient, DeepLift
    
    sample, label = dataset_train[0]
    shape = sample.reshape(1, -1).shape

    torch.manual_seed(random_seed)
    baselines = torch.from_numpy(np.array([dataset_train[torch.randint(len(dataset_train), (1,))][0] for _ in range(10)])).reshape(-1, *shape).float().to(device)

    attributions_path = os.path.join(extracted_data_path, f'{model_base_name.lower()}-attributions.pkl')
    if os.path.exists(attributions_path):
        with open(attributions_path, 'rb') as file:
            attributions = dill.load(file)

        attribution_techniques = [[x, None] for x in attributions['train'].keys()]
    else:
        model.eval()

        attribution_techniques = [
            ['LRP', LRP, {}],
            ['Saliency', Saliency, {}],
            ['InputXGradient', InputXGradient, {}],
            ['DeepLift', DeepLift, {}],
            ['DeepLiftShap', DeepLiftShap, {'baselines': baselines}],
            ['IntegratedGradients', IntegratedGradients, {}],
            ['GradientShap', GradientShap, {'baselines': baselines}],
            ['ShapleyValueSampling', ShapleyValueSampling, {}],
            # ['Occlusion', Occlusion, {'sliding_window_shapes': (1, 5)}],
        ]
        attribution_techniques_dict = {k: [v, vv] for k, v, vv in attribution_techniques}

        attributions = {'train': {}, 'test': {}}
        
        for at in attribution_techniques:
        
            at_name, at_function, at_kwargs = at
            attribute_tec = at_function(model)

            logger.info(f'Calculate: {at_name}')
            logger.info(f'Start with train')

            attributions_tmp = []
            for x in dataloader_train_not_shuffled:
                input_, label_ = x
                input_ = input_.reshape(input_.shape[0], 1, -1)
                input_ = input_.float().to(device)
                label_ = label_.float().to(device)
        
                try:
                    attribution = attribute_tec.attribute(input_.reshape(-1, *shape).float().to(device), target=torch.argmax(label_, axis=1), **at_kwargs)
                    attributions_tmp.extend(attribution)
                except Exception as e:
                    logger.info(f'[E] Exception: {e}')
                    break
        
            if len(attributions_tmp) > 0:
                attributions_tmp = torch.stack(attributions_tmp)
                attributions['train'][at_name] = attributions_tmp.detach().cpu().reshape(-1, shape[-1]).numpy()
            del attributions_tmp

            logger.info(f'Start with test')
            
            attributions_tmp = []
            for x in dataloader_test:
                input_, label_ = x
                input_ = input_.reshape(input_.shape[0], 1, -1)
                input_ = input_.float().to(device)
                label_ = label_.float().to(device)
        
                try:
                    attribution = attribute_tec.attribute(input_.reshape(-1, *shape).float().to(device), target=torch.argmax(label_, axis=1), **at_kwargs)
                    attributions_tmp.extend(attribution)
                except Exception as e:
                    logger.info(f'[E] Exception: {e}')
                    break
        
            if len(attributions_tmp) > 0:
                attributions_tmp = torch.stack(attributions_tmp)
                attributions['test'][at_name] = attributions_tmp.detach().cpu().reshape(-1, shape[-1]).numpy()
            del attributions_tmp

        with open(attributions_path, 'wb') as file:
            dill.dump(attributions, file)

    A_train = attributions['train']
    A_test = attributions['test']

    logger.info(f'Length of train attributions: {len(A_train)} - {A_train.keys()}')
    logger.info(f'Length of test attributions: {len(A_test)} - {A_test.keys()}')

    ######## Run experiment

    logger.info('Preparing the data one last time')

    start_time = time.process_time()

    data_to_sort_train = [
        ['Raw Data', X_train],
        ['Activations', activations_train],
        ['Labels', y_train_ohe],
        ['Predictions', y_train_pred],
        *[[k, A_train[k]] for k in A_train.keys()],
    ]

    histograms = [[f'{d[0]} Histogram', create_hist(d[1])] for d in data_to_sort_train if len(create_hist(d[1])) > 10]
    data_to_sort_train.extend(histograms)

    data_to_sort_test = [
        ['Raw Data', X_test],
        ['Activations', activations_test],
        ['Labels', y_test_ohe],
        ['Predictions', y_test_pred],
        *[[k, A_test[k]] for k in A_test.keys()],
    ]

    histograms = [[f'{d[0]} Histogram', create_hist(d[1])] for d in data_to_sort_test if len(create_hist(d[1])) > 10]
    data_to_sort_test.extend(histograms)

    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    logger.info(f'Time needed {rounded_time} seconds')

    logger.info('Running the experiment')
    
    results_file_path = os.path.join(results_path, f'{model_base_name.lower()}-results.pkl')
    results = check_savepoint(results_file_path)

    if results is None or results is False:
        results = {
            'train': {},
            'test': {},
        }

    data_to_experiment_on = {
        'train': data_to_sort_train,
        'test': data_to_sort_test,
    }

    start_time = time.process_time()
    for k in data_to_experiment_on:
        stage = k
        data_to_sort = data_to_experiment_on[k]
        logger.info(f'{stage}')

        for data in data_to_sort:
            name, d = data
            logger.info(f'{name}: {d.shape}')

            name_for_file = name.lower().replace(' ', '-')
            temp_results_path = os.path.join(results_path, f'{model_base_name.lower()}-{stage}-{name_for_file}')

            if name not in results[k]:
                reordering = calculate_reordering_for_data(data, temp_results_path)
                results[k].update(reordering)
        logger.info('')

    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    logger.info(f'Time needed {rounded_time} seconds')
    logger.info('')

    save_savepoint(results, os.path.join(results_path, f'{model_base_name.lower()}-results.pkl'))

    ######## Calculate interestingness

    logger.info('Calculating the interestingness')

    interestingness_path = os.path.join(results_path, f'{model_base_name.lower()}-interestingness.pkl')

    interestingness_results = check_savepoint(interestingness_path)
    if not interestingness_results:
        def check_in_attributions(k):
            for at, _ in attribution_techniques:
                if at in k:
                    return True
            return False

        interestingness_results = {}
        start_time = time.process_time()
        for stage, part_results in results.items():

            logger.info(f'------- {stage} -------')
            data_to_sort = data_to_experiment_on[stage]
            data_to_sort = {d[0]: d[1] for d in data_to_sort}

            interestingness_results[stage] = {'attributions': {}}

            for j, v in part_results.items():
                logger.info(f'{j} - {data_to_sort[j].shape}')

                if data_to_sort[j].shape[-1] < 30:
                    continue

                v_d = sorted(v, key=lambda x: x[1][0])

                ordering_interestingness = {}
                for x in v_d:
                    name, _, ordering = x
                    tmp_data = data_to_sort[j][ordering]
                    tmp_interestingness, tmp_binarized_data = interestingness_measure(tmp_data)
                    interestingness_idc = data_to_interestingness_idx(tmp_binarized_data, tmp_interestingness)

                    ordering_interestingness[str_to_key(name)] = interestingness_idc

                    logger.info(f'Found {len(interestingness_idc)} for {name}')

                if check_in_attributions(j):
                    interestingness_results[str_to_key(stage)]['attributions'][str_to_key(j)] = ordering_interestingness
                else:
                    interestingness_results[str_to_key(stage)][str_to_key(j)] = ordering_interestingness
            logger.info('')

        save_savepoint(interestingness_results, interestingness_path)

        end_time = time.process_time()
        rounded_time = np.round(end_time - start_time, 10)
        logger.info(f'Time needed {rounded_time} seconds')
        logger.info('')

    ######## Generate JSON

    logger.info('Generating the JSON')

    data_to_json = {'data': {}, 'orderings': {}, 'interestingness': {}}

    for k, v in data_to_experiment_on.items():
        data_to_json['data'][k] = {'attributions': {}}
        for d in v:
            if check_in_attributions(d[0]):
                data_to_json['data'][k]['attributions'][str_to_key(d[0])] = d[1]
            else:
                data_to_json['data'][k][str_to_key(d[0])] = d[1]

    for k, v in results.items():
        k = str_to_key(k)

        logger.info(k)
        logger.info('')

        data_to_json['orderings'][k] = {'attributions': {}}

        part_results = v
        for j, v in part_results.items():
            logger.info(j)
            v_d = sorted(v, key=lambda x: x[1][0])

            v_d = {str_to_key(d[0]): {'score': flatten(d[1]), 'ordering': d[2]} for d in v_d}
            if check_in_attributions(j):
                data_to_json['orderings'][k]['attributions'][str_to_key(j)] = v_d
            else:
                data_to_json['orderings'][k][str_to_key(j)] = v_d
        logger.info('')

    if interestingness_results:
        data_to_json['interestingness'] = interestingness_results

    def print_nested_dict(data):
        if isinstance(data, dict):
            for k, v in data.items():
                return f'[{k}] -> {print_nested_dict(v)}'
        elif isinstance(data, list):
            return np.array(data).shape
        elif isinstance(data, np.ndarray):
            return data.shape
        elif isinstance(data, tuple):
            return flatten(data)
        return f'[{data}]'

    for k in data_to_json.keys():
        for l in data_to_json[k].keys():
            for m in data_to_json[k][l].keys():
                if isinstance(data_to_json[k][l][m], dict):
                    for n in data_to_json[k][l][m].keys():
                        if isinstance(data_to_json[k][l][m][n], dict):
                            for o in data_to_json[k][l][m][n].keys():
                                if isinstance(data_to_json[k][l][m][n][o], dict):
                                    logger.info(f'{data_to_json[k][l][m][n][o].keys()}')
                                    d = np.array(data_to_json[k][l][m][n][o]['ordering']).shape
                                elif isinstance(data_to_json[k][l][m][n][o], list):
                                    d = np.array(data_to_json[k][l][m][n][o]).shape
                                elif isinstance(data_to_json[k][l][m][n][o], np.ndarray):
                                    d = data_to_json[k][l][m][n][o].shape
                                else:
                                    d = None
                                logger.info(f'{k} -> {l} -> {m} -> {n} -> {o}: {d}')
                else:
                    if isinstance(data_to_json[k][l][m], dict):
                        logger.info(f'{data_to_json[k][l][m][n].keys()}')
                        d = np.array(data_to_json[k][l][m]['ordering']).shape
                    elif isinstance(data_to_json[k][l][m], list):
                        d = np.array(data_to_json[k][l][m]).shape
                    elif isinstance(data_to_json[k][l][m], np.ndarray):
                        d = data_to_json[k][l][m].shape
                    else:
                        d = None
                    logger.info(f'{k} -> {l} -> {m}: {d}')

    json_data = json.dumps(data_to_json, cls=NumpyArrayEncoder)
    json_path = os.path.join(results_path, f'{model_base_name.lower()}-results.json')
    with open(json_path, 'w') as f:
        f.write(json_data)

    logger.info(f'All done at {json_path}!')
    end_time = time.process_time()
    rounded_time = np.round(end_time - overall_time, 10)
    logger.info(f'Time needed {rounded_time} seconds')


if __name__ == '__main__':
    main()

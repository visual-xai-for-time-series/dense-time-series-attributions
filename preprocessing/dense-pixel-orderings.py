#!/usr/bin/env python

import os
import sys
import dill
import time
import random
import argparse

import numpy as np
import pandas as pd

from tqdm import tqdm

import torch
import torch.nn as nn

from torch.utils.data import Dataset, DataLoader

from sklearn.preprocessing import OneHotEncoder

from sktime.datasets import load_UCR_UEA_dataset

random_seed = 13

torch.manual_seed(random_seed)
random.seed(random_seed)
np.random.seed(random_seed)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

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


def main():
    parser = argparse.ArgumentParser(description='Calculate orderings for a model for a selected dataset.')

    # Add arguments
    parser.add_argument('--dataset', '-d', type=str, required=True,
                        default='FordA', help='Specify the dataset (e.g., FordA)')
    parser.add_argument('--model', '-m', type=str, required=True, 
                        choices=['cnn', 'resnet'], 
                        help='Specify the model type (choose from: cnn, resnet)')
    parser.add_argument('--model_path', type=str, default='data/', 
                        help='Path to save/load the model (default: data/)')
    parser.add_argument('--results_path', type=str, default='results/', 
                        help='Path to save the results (default: results/)')

    print('Setting the stage')

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

    print('Getting the data')

    X_train, y_train = load_UCR_UEA_dataset(name=dataset, split='train', return_type='numpyflat')
    X_test, y_test = load_UCR_UEA_dataset(name=dataset, split='test', return_type='numpyflat')

    print(f'Length training data: {len(X_train)} labels: {len(y_train)} test data: {len(X_test)} labels: {len(y_test)}')

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

    print('Loading the model')

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
    print('Prediction Accuracy Train', np.round((preds.argmax(dim=-1) == labels.argmax(dim=-1)).int().sum().float().item() / len(preds), 4))

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
    print('Prediction Accuracy Test', np.round((preds.argmax(dim=-1) == labels.argmax(dim=-1)).int().sum().float().item() / len(preds), 4))

    y_test_pred = preds.cpu().detach().numpy().round(3)

    ######## Get activations

    print('Getting the activation')

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
                output_transformed = torch.amax(output, dim=1)
                data = output_transformed.detach().cpu().numpy().tolist()
                activations[name].extend(data)
            return hook

        model.eval()

        fc1_handle = model.layers.register_forward_hook(get_activation('train-layers'))

        for idx, (inputs, labels) in enumerate(dataloader_train_not_shuffled):
            inputs = inputs.reshape(inputs.shape[0], 1, -1)
            inputs = inputs.float().to(device)
            labels = labels.float().to(device)
        
            preds = model(inputs)

        fc1_handle.remove()

        fc1_handle = model.layers.register_forward_hook(get_activation('test-layers'))

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
    print(f'Length of train activations: {len(activations_train)}')
    print(f'Length of test activations: {len(activations_test)}')

    ######## Get attributions

    print('Getting the attributions')

    from captum.attr import GradientShap, IntegratedGradients, ShapleyValueSampling, Saliency, DeepLift
    
    sample, label = dataset_train[0]
    shape = sample.reshape(1, -1).shape

    attributions_path = os.path.join(extracted_data_path, f'{model_base_name.lower()}-attributions.pkl')
    if os.path.exists(attributions_path):
        with open(attributions_path, 'rb') as file:
            attributions = dill.load(file)
    else:
        model.eval()
        
        attribution_techniques = [
            ['Saliency', Saliency],
            ['DeepLift', DeepLift],
            ['IntegratedGradients', IntegratedGradients],
            ['ShapleyValueSampling', ShapleyValueSampling],
        ]

        attributions = {'train': {}, 'test': {}}
        
        for at in attribution_techniques:
        
            at_name, at_function = at
            attribute_tec = at_function(model)

            print(f'Calculcate: {at_name}')
            print(f'Start with train')

            attributions_tmp = []
            print("Length of train dataloader", len(dataloader_train_not_shuffled))
            for i, x in enumerate(dataloader_train_not_shuffled):
                input_, label_ = x
                input_ = input_.reshape(input_.shape[0], 1, -1)
                input_ = input_.float().to(device)
                label_ = label_.float().to(device)
        
                attribution = attribute_tec.attribute(input_.reshape(-1, *shape).float().to(device), target=torch.argmax(label_, axis=1))
                attributions_tmp.extend(attribution)

                print(f'Batch {i}')
        
            attributions_tmp = torch.stack(attributions_tmp)
            attributions['train'][at_name] = attributions_tmp.detach().cpu().reshape(-1, shape[-1]).numpy()
            del attributions_tmp

            print(f'Start with test')
            
            attributions_tmp = []
            for x in dataloader_test:
                input_, label_ = x
                input_ = input_.reshape(input_.shape[0], 1, -1)
                input_ = input_.float().to(device)
                label_ = label_.float().to(device)
        
                attribution = attribute_tec.attribute(input_.reshape(-1, *shape).float().to(device), target=torch.argmax(label_, axis=1))
                attributions_tmp.extend(attribution)
        
            attributions_tmp = torch.stack(attributions_tmp)
            attributions['test'][at_name] = attributions_tmp.detach().cpu().reshape(-1, shape[-1]).numpy()
            del attributions_tmp

        with open(attributions_path, 'wb') as file:
            dill.dump(attributions, file)

    A_train = attributions['train']
    A_test = attributions['test']

    print(f'Length of train attributions: {len(A_train)} - {A_train.keys()}')
    print(f'Length of test attributions: {len(A_test)} - {A_test.keys()}')

    ######## Run experiment

    print('Preparing the data one last time')

    start_time = time.process_time()

    data_to_sort_train = [
        ['Raw Data', X_train],
        ['Activations', activations_train],
    #     ['Labels', y_train],
        ['Predictions', y_train_pred],
        *[[k, A_train[k]] for k in A_train.keys()],
    ]

    histograms = [[f'{d[0]} Histogram', create_hist(d[1])] for d in data_to_sort_train if len(create_hist(d[1])) > 10]
    data_to_sort_train.extend(histograms)

    data_to_sort_test = [
        ['Raw Data', X_test],
        ['Activations', activations_test],
    #     ['Labels', y_test],
        ['Predictions', y_test_pred],
        *[[k, A_test[k]] for k in A_test.keys()],
    ]

    histograms = [[f'{d[0]} Histogram', create_hist(d[1])] for d in data_to_sort_test if len(create_hist(d[1])) > 10]
    data_to_sort_test.extend(histograms)

    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds')

    print('Running the experiment')
    
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
        print(stage)

        for data in data_to_sort:
            data_name = data[0]
            print(data_name)
            
            name_for_file = data_name.lower().replace(' ', '-')
            temp_results_path = os.path.join(results_path, f'{model_base_name.lower()}-{stage}-{name_for_file}')

            if data_name not in results[k]:
                reordering = calculate_reordering_for_data(data, temp_results_path)
                results[k].update(reordering)
        print()

    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds')
    print()

    with open(os.path.join(results_path, f'{model_base_name.lower()}-results.pkl'), 'wb') as file:
        dill.dump(results, file)


if __name__ == '__main__':
    main()

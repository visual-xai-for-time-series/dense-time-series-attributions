import os

import dill
import time

import numpy as np

import torch.nn as nn

from orderings import * 
from measures import *


def create_hist(data, with_range=False):
    data_hist = []

    e = data[0]
    if (isinstance(e, list) or isinstance(e, np.ndarray)) and len(e) > 10:

        if with_range:
            min_ = np.amin(data)
            max_ = np.amax(data)
            range_ = (min_, max_)
        else:
            range_ = None

        for e in data:
            hist, _ = np.histogram(e, bins=max(10, int(len(e) / 10)), range=range_)
            data_hist.append(hist)

    if len(data_hist) > 0:
        return np.array(data_hist)
    return data_hist


def calculate_reordering_for_data(data, chk_pt_path):
    results = {}

    name, data = data
    if name not in results:
        results[name] = []

    start_time = time.process_time()

    # Base
    data_tmp = data.copy()
    sorted_ind = np.arange(data_tmp.shape[0])
    dist = calculate_scores(data_tmp[sorted_ind])
    name_r = 'Base Distances'
    print(f'{name_r:50}', dist)
    results[name].append(['Base', dist, sorted_ind])

    # Naive Sorting
    data_tmp = data.copy()
    savepoint_path = f'{chk_pt_path}-naive.pkl'
    saved = check_savepoint(savepoint_path)
    if not saved:
        name_r, sorted_ind = naive_sorting(data_tmp)
        dist = calculate_scores(data_tmp[sorted_ind])
        save_savepoint([name_r, dist, sorted_ind], savepoint_path)
    else:
        name_r, _, sorted_ind = saved
        dist = calculate_scores(data_tmp[sorted_ind])
    print(f'{name_r:50}', dist)
    results[name].append([name_r, dist, sorted_ind])
    del data_tmp

    # Feature Sorting
    data_tmp = data.copy()
    savepoint_path = f'{chk_pt_path}-feature.pkl'
    saved = check_savepoint(savepoint_path)
    if not saved:
        multiple_results = feature_sorting(data_tmp)
        save_savepoint(multiple_results, savepoint_path)
    else:
        multiple_results = saved
    for r in multiple_results:
        name_r, sorted_ind = r
        dist = calculate_scores(data_tmp[sorted_ind])
        print(f'{name_r:50}', dist)
        results[name].append([name_r, dist, sorted_ind])
    del data_tmp

    # Projection
    data_tmp = data.copy()
    savepoint_path = f'{chk_pt_path}-projection.pkl'
    saved = check_savepoint(savepoint_path)
    if not saved:
        multiple_results = projection_sorting(data_tmp)
        save_savepoint(multiple_results, savepoint_path)
    else:
        multiple_results = saved
    for r in multiple_results:
        name_r, sorted_ind = r
        dist = calculate_scores(data_tmp[sorted_ind])
        print(f'{name_r:50}', dist)
        results[name].append([name_r, dist, sorted_ind])
    del data_tmp

    # Clustering
    data_tmp = data.copy()
    savepoint_path = f'{chk_pt_path}-clustering.pkl'
    saved = check_savepoint(savepoint_path)
    if not saved:
        multiple_results = clustering_sorting(data_tmp)
        save_savepoint(multiple_results, savepoint_path)
    else:
        multiple_results = saved
    for r in multiple_results:
        name_r, sorted_ind = r
        dist = calculate_scores(data_tmp[sorted_ind])
        print(f'{name_r:50}', dist)
        results[name].append([name_r, dist, sorted_ind])
    del data_tmp

    # Reduced clustering
    data_tmp = data.copy()
    savepoint_path = f'{chk_pt_path}-reduced-clustering.pkl'
    saved = check_savepoint(savepoint_path)
    if not saved:
        multiple_results = reduced_clustering_sorting(data_tmp)
        save_savepoint(multiple_results, savepoint_path)
    else:
        multiple_results = saved
    for r in multiple_results:
        name_r, sorted_ind = r
        dist = calculate_scores(data_tmp[sorted_ind])
        print(f'{name_r:50}', dist)
        results[name].append([name_r, dist, sorted_ind])
    del data_tmp

    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds')
    print()

    return results


def check_savepoint(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'rb') as file:
            ret = dill.load(file)
        return ret
    else:
        return False


def save_savepoint(data, file_path):
    if os.path.exists(file_path):
        return False
    else:
        with open(file_path, 'wb') as file:
            dill.dump(data, file)
        return True


def get_possible_layers(model):
    possible_layers = []
    for layer in model.children():
        if isinstance(layer, (nn.Linear, nn.Conv1d, nn.Conv2d, nn.ConvTranspose2d)):
            possible_layers.append(layer)
        elif isinstance(layer, nn.Sequential):
            possible_layers.extend(get_possible_layers(layer))
        elif isinstance(layer, nn.Module):
            possible_layers.extend(get_possible_layers(layer))
    return possible_layers


######## Helper Functions


def str_to_key(in_str):
    return in_str.lower().replace(' ', '_')


def flatten(data):
    result = []
    for item in data:
        if isinstance(item, list):
            result.extend(flatten(item))
        elif isinstance(item, tuple):
            result.extend(flatten(item))
        elif isinstance(item, np.ndarray):
            result.extend(item.flatten().tolist())
        else:
            result.append(item)
    return result


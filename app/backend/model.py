import os
import json
import time

import dataclasses

import numpy as np

import urllib.request

from typing import Optional, Any

from pydantic import BaseModel, validator
from pydantic.tools import parse_obj_as


files = [
    # ('https://data.time-series-xai.dbvis.de/davots/old/cnn-forda.json', 'cnn-forda.json'),
    # ('https://data.time-series-xai.dbvis.de/davots/old/resnet-forda-results.json', 'resnet-forda.json')
    ('https://data.time-series-xai.dbvis.de/davots/cnn-forda-results.json', 'cnn-forda.json'),
    ('https://data.time-series-xai.dbvis.de/davots/resnet-forda-results.json', 'resnet-forda.json'),
    ('https://data.time-series-xai.dbvis.de/davots/cnn-fordb-results.json', 'cnn-fordb.json'),
    ('https://data.time-series-xai.dbvis.de/davots/resnet-fordb-results.json', 'resnet-fordb.json'),
    ('https://data.time-series-xai.dbvis.de/davots/cnn-ecg5000-results.json', 'cnn-ecg5000.json'),
    ('https://data.time-series-xai.dbvis.de/davots/resnet-ecg5000-results.json', 'resnet-ecg5000.json'),
]


default_file = 'resnet-forda'


def get_default_file_name():
    return default_file


def list_to_np(x):
    return np.array(x)


def dict_to_np(x):
    if isinstance(x, dict):
        return {q: dict_to_np(p) for q, p in x.items()}
    elif isinstance(x, list):
        return list_to_np(x)
    else:
        return {}


def nothing(x):
    return x


class StageData(BaseModel):
    raw_data: np.ndarray
    activations: np.ndarray
    attributions: dict[str, np.ndarray]

    raw_data_histogram: Optional[np.ndarray]
    activations_histogram: Optional[np.ndarray]
    attributions_histogram: Optional[np.ndarray]

    labels: Optional[np.ndarray]
    predictions: Optional[np.ndarray]

    class Config:
        arbitrary_types_allowed = True

    _raw_data = validator('raw_data', pre=True, allow_reuse=True)(list_to_np)
    _activations = validator('activations', pre=True, allow_reuse=True)(list_to_np)
    _attributions = validator('attributions', pre=True, allow_reuse=True)(dict_to_np)

    _raw_data_histogram = validator('raw_data_histogram', pre=True, allow_reuse=True)(list_to_np)
    _activations_histogram = validator('activations_histogram', pre=True, allow_reuse=True)(list_to_np)
    _attributions_histogram = validator('attributions_histogram', pre=True, allow_reuse=True)(list_to_np)

    _labels = validator('labels', pre=True, allow_reuse=True)(list_to_np)
    _predictions = validator('predictions', pre=True, allow_reuse=True)(list_to_np)


    def get_default(self):
        if self.raw_data is not None:
            return 'raw_data', self.raw_data
        if self.activations is not None:
            return 'activations', self.activations
        return None


    def get_default_attribution(self):
        base = list(self.attributions.keys())[0]
        return base, self.attributions[base]


    def get_attributions(self):
        return [x for x in self.attributions.keys() if '_histogram' not in x]


class BaseData(BaseModel):
    train: Optional[StageData]
    test: Optional[StageData]
    validation: Optional[StageData]


    def get_default(self):
        if self.train is not None:
            return 'train', self.train
        if self.test is not None:
            return 'test', self.test
        if self.validation is not None:
            return 'validation', self.validation
        return None
    
    
    def get_set(self):
        ret = []
        if self.train is not None:
            ret.append('train')
        if self.test is not None:
            ret.append('test')
        if self.validation is not None:
            ret.append('validation')
        return ret
    
    
    def get(self, name):
        if name == 'train':
            return self.train
        if name == 'test':
            return self.test
        if name == 'validation':
            return self.validation
        return None


class OrderingData(BaseModel):
    raw_data: dict[str, dict[str, np.ndarray]]
    activations: dict[str, dict[str, np.ndarray]]
    attributions: dict[str, dict[str, dict[str, np.ndarray]]]

    raw_data_histogram: Optional[dict[str, dict[str, np.ndarray]]] = {}
    activations_histogram: Optional[dict[str, dict[str, np.ndarray]]] = {}
    attributions_histogram: Optional[dict[str, dict[str, dict[str, np.ndarray]]]] = {}

    labels: Optional[dict[str, dict[str, np.ndarray]]] = {}
    predictions: Optional[dict[str, dict[str, np.ndarray]]] = {}

    class Config:
        arbitrary_types_allowed = True

    _raw_data = validator('raw_data', pre=True, allow_reuse=True)(dict_to_np)
    _activations = validator('activations', pre=True, allow_reuse=True)(dict_to_np)
    _attributions = validator('attributions', pre=True, allow_reuse=True)(dict_to_np)

    _raw_data_histogram = validator('raw_data_histogram', pre=True, allow_reuse=True)(dict_to_np)
    _activations_histogram = validator('activations_histogram', pre=True, allow_reuse=True)(dict_to_np)
    _attributions_histogram = validator('attributions_histogram', pre=True, allow_reuse=True)(dict_to_np)

    _labels = validator('labels', pre=True, allow_reuse=True)(dict_to_np)
    _predictions = validator('predictions', pre=True, allow_reuse=True)(dict_to_np)


    def get_default(self, base_data):
        
        def get_best_score(data):
            return sorted([[k, v['score'][0]] for k, v in data.items()], key=lambda x: x[1])[0][0]

        if base_data == 'raw_data':
            m = get_best_score(self.raw_data)
            # m = list(self.raw_data.keys())[0]
            return m, self.raw_data[m]
        if base_data == 'activations':
            m = get_best_score(self.activations)
            # m = list(self.activations.keys())[0]
            return m, self.activations[m]
        if base_data == 'raw_data_histogram':
            m = get_best_score(self.raw_data_histogram)
            # m = list(self.raw_data_histogram.keys())[0]
            return m, self.raw_data_histogram[m]
        if base_data == 'activations_histogram':
            m = get_best_score(self.activations_histogram)
            # m = list(self.activations_histogram.keys())[0]
            return m, self.activations_histogram[m]
        return None


    def get_default_orderings(self):
        return {
            'raw_data': list(self.raw_data.keys()),
            'activations': list(self.activations.keys()),
            'raw_data_histogram': list(self.raw_data_histogram.keys()),
            'activations_histogram': list(self.activations_histogram.keys()),
            'labels': list(self.labels.keys()),
            'predictions': list(self.predictions.keys()),
            'attributions': {k: list(v.keys()) for k, v in self.attributions.items()},
        }


    def get_orderings(self, base_data, method, attribution=None):
        if base_data == 'raw':
            return self.raw[method]
        if base_data == 'activations':
            return self.activations[method]
        if base_data == 'raw_histogram':
            return self.raw_histogram[method]
        if base_data == 'activations_histogram':
            return self.activations_histogram[method]
        if base_data == 'labels':
            return self.labels[method]
        if base_data == 'predictions':
            return self.predictions[method]
        if base_data == 'attributions':
            return self.attributions[attribution][method]
        if base_data == 'attributions_histogram':
            return self.attributions[f'{attribution}_histogram'][method]
        return None


class Orderings(BaseModel):
    train: Optional[OrderingData]
    test: Optional[OrderingData]
    validation: Optional[OrderingData]


    def get_default(self):
        if self.train is not None:
            return 'train', self.train
        if self.test is not None:
            return 'test', self.test
        if self.validation is not None:
            return 'validation', self.validation
        return None


    def get(self, name):
        if name == 'train':
            return self.train
        if name == 'test':
            return self.test
        if name == 'validation':
            return self.validation
        return None


class InterestingnessData(BaseModel):
    raw_data: dict[str, Any]
    activations: dict[str, Any]
    attributions: dict[str, Any]

    raw_data_histogram: Optional[dict[str, Any]] = {}
    activations_histogram: Optional[dict[str, Any]] = {}
    attributions_histogram: Optional[dict[str, Any]] = {}

    labels: Optional[dict[str, Any]] = {}
    predictions: Optional[dict[str, Any]] = {}

    class Config:
        arbitrary_types_allowed = True

    _raw_data = validator('raw_data', pre=True, allow_reuse=True)(nothing)
    _activations = validator('activations', pre=True, allow_reuse=True)(nothing)
    _attributions = validator('attributions', pre=True, allow_reuse=True)(nothing)

    _raw_data_histogram = validator('raw_data_histogram', pre=True, allow_reuse=True)(nothing)
    _activations_histogram = validator('activations_histogram', pre=True, allow_reuse=True)(nothing)
    _attributions_histogram = validator('attributions_histogram', pre=True, allow_reuse=True)(nothing)

    _labels = validator('labels', pre=True, allow_reuse=True)(nothing)
    _predictions = validator('predictions', pre=True, allow_reuse=True)(nothing)


    def get_default(self, base_data):
        if base_data == 'raw_data':
            m = list(self.raw_data.keys())[0]
            return m, self.raw_data[m]
        if base_data == 'activations':
            m = list(self.activations.keys())[0]
            return m, self.activations[m]
        if base_data == 'raw_data_histogram':
            m = list(self.raw_data_histogram.keys())[0]
            return m, self.raw_data_histogram[m]
        if base_data == 'activations_histogram':
            m = list(self.activations_histogram.keys())[0]
            return m, self.activations_histogram[m]
        return None


    def get_default_interestingness(self):
        return {
            'raw_data': list(self.raw_data.keys()),
            'activations': list(self.activations.keys()),
            'raw_data_histogram': list(self.raw_data_histogram.keys()),
            'activations_histogram': list(self.activations_histogram.keys()),
            'labels': list(self.labels.keys()),
            'predictions': list(self.predictions.keys()),
            'attributions': {k: list(v.keys()) for k, v in self.attributions.items()},
        }


    def get_interestingness(self, base_data, method, attribution=None):
        if base_data == 'raw':
            return self.raw[method]
        if base_data == 'activations':
            return self.activations[method]
        if base_data == 'raw_histogram':
            return self.raw_histogram[method]
        if base_data == 'activations_histogram':
            return self.activations_histogram[method]
        if base_data == 'labels' and method in self.labels:
            return self.labels[method]
        if base_data == 'predictions' and method in self.predictions:
            return self.predictions[method]
        if base_data == 'attributions':
            return self.attributions[attribution][method]
        if base_data == 'attributions_histogram':
            return self.attributions[f'{attribution}_histogram'][method]
        return None


class Interestingness(BaseModel):
    train: Optional[InterestingnessData]
    test: Optional[InterestingnessData]
    validation: Optional[InterestingnessData]


    def get_default(self):
        if self.train is not None:
            return 'train', self.train
        if self.test is not None:
            return 'test', self.test
        if self.validation is not None:
            return 'validation', self.validation
        return None


    def get(self, name):
        if name == 'train':
            return self.train
        if name == 'test':
            return self.test
        if name == 'validation':
            return self.validation
        return None


class Base(BaseModel):
    data: BaseData
    orderings: Orderings
    interestingness: Optional[Interestingness]


def convert_keys_to_lower(dictionary):
    if isinstance(dictionary, dict):
        return {key.lower(): convert_keys_to_lower(value) for key, value in dictionary.items()}
    elif isinstance(dictionary, list):
        return [convert_keys_to_lower(item) for item in dictionary]
    else:
        return dictionary


def download_json(url, file_path):
    directory = os.path.dirname(file_path)

    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f'Directory {directory} created.')

    if os.path.exists(file_path):
        print(f'File {file_path} already exists. Skipping download.')
        return

    try:
        with urllib.request.urlopen(url) as response:
            json_content = json.loads(response.read().decode('utf-8'))
            with open(file_path, 'w') as file:
                json.dump(json_content, file)
            
            print(f'JSON file downloaded and saved to {file_path}')
    except Exception as e:
        print(f'Failed to download JSON. Error: {e}')


def get_all_available_JSON_files(download=True):
    data_path = 'data/'
    if download:
        for f in files:
            download_json(f[0], os.path.join(data_path, f[1]))
    return [file for file in os.listdir(data_path) if file.endswith('.json')]


def parse_JSON_file(file_path):
    data = None

    try:
        with open(os.path.join('data/', file_path)) as json_file:
            data = json.load(json_file)
            data = convert_keys_to_lower(data)
            data = parse_obj_as(Base, data)
            print(f'{file_path} loaded')
    except FileNotFoundError:
        return {'message': f'{file_path} file not found'}

    return data


def parse_model_to_dict(model):
    return model.dict()

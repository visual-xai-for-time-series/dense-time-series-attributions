from __future__ import annotations

from pydantic import BaseModel, validator

from pydantic.tools import parse_obj_as

from typing import Optional

import dataclasses

import numpy as np

import json

import time


def list_to_np(x):
    return np.array(x)


def dict_to_np(x):
    return {k: np.array(v) for k, v in x.items()}


def dict_dict_to_np(x):
    return {q: {k: np.array(v) for k, v in p.items()} for q, p in x.items()}


class StageData(BaseModel):
    raw: np.ndarray
    activations: np.ndarray
    
    raw_hist: np.ndarray
    activations_hist: np.ndarray
    
    attributions: dict[str, np.ndarray]
    
    labels: np.ndarray
    labels_pred: np.ndarray
    
    class Config:
        arbitrary_types_allowed = True
        
    _raw = validator('raw', pre=True, allow_reuse=True)(list_to_np)
    _activations = validator('activations', pre=True, allow_reuse=True)(list_to_np)
    
    _raw_hist = validator('raw_hist', pre=True, allow_reuse=True)(list_to_np)
    _activations_hist = validator('activations_hist', pre=True, allow_reuse=True)(list_to_np)
    
    _labels = validator('labels', pre=True, allow_reuse=True)(list_to_np)
    _labels_pred = validator('labels_pred', pre=True, allow_reuse=True)(list_to_np)
    
    _attributions = validator('attributions', pre=True, allow_reuse=True)(dict_to_np)
    
    def get_default(self):
        if self.raw is not None:
            return 'raw', self.raw
        if self.activations is not None:
            return 'activations', self.activations
        
    def get_default_attribution(self):
        base = list(self.attributions.keys())[0]
        return base, self.attributions[base]
    
    def get_attributions(self):
        return [x for x in self.attributions.keys() if '_hist' not in x]


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


class ClusteringData(BaseModel):
    raw: dict[str, np.ndarray]
    activations: dict[str, np.ndarray]
    
    raw_hist: dict[str, np.ndarray]
    activations_hist: dict[str, np.ndarray]
    
    attributions: dict[str, dict[str, np.ndarray]]
    
    labels: dict[str, np.ndarray]
    labels_pred: dict[str, np.ndarray]
    
    class Config:
        arbitrary_types_allowed = True

    _raw = validator('raw', pre=True, allow_reuse=True)(dict_to_np)
    _activations = validator('activations', pre=True, allow_reuse=True)(dict_to_np)
    
    _raw_hist = validator('raw_hist', pre=True, allow_reuse=True)(dict_to_np)
    _activations_hist = validator('activations_hist', pre=True, allow_reuse=True)(dict_to_np)
    
    _labels = validator('labels', pre=True, allow_reuse=True)(dict_to_np)
    _labels_pred = validator('labels_pred', pre=True, allow_reuse=True)(dict_to_np)
    
    _attributions = validator('attributions', pre=True, allow_reuse=True)(dict_dict_to_np)
    
    def get_default(self, base_data):
        if base_data == 'raw':
            m = list(self.raw.keys())[0]
            return m, self.raw[m]
        if base_data == 'activations':
            m = list(self.activations.keys())[0]
            return m, self.activations[m]
        if base_data == 'raw_hist':
            m = list(self.raw_hist.keys())[0]
            return m, self.raw_hist[m]
        if base_data == 'activations_hist':
            m = list(self.activations_hist.keys())[0]
            return m, self.activations_hist[m]
        
    def get_default_clusterings(self):
        return {
            'raw': list(self.raw.keys()),
            'activations': list(self.activations.keys()),
            'raw_hist': list(self.raw_hist.keys()),
            'activations_hist': list(self.activations_hist.keys()),
            'labels': list(self.labels.keys()),
            'labels_pred': list(self.labels_pred.keys()),
            'attributions': {k: list(v.keys()) for k, v in self.attributions.items()},
        }
        
    def get_clusterings(self, base_data, method, attribution=None):
        if base_data == 'raw':
            return self.raw[method]
        if base_data == 'activations':
            return self.activations[method]
        if base_data == 'raw_hist':
            return self.raw_hist[method]
        if base_data == 'activations_hist':
            return self.activations_hist[method]
        if base_data == 'labels':
            return self.labels[method]
        if base_data == 'labels_pred':
            return self.labels_pred[method]
        if base_data == 'attributions':
            return self.attributions[attribution][method]
        if base_data == 'attributions_hist':
            return self.attributions[f'{attribution}_hist'][method]


class ClusterSorting(BaseModel):
    train: Optional[ClusteringData]
    test: Optional[ClusteringData]
    validation: Optional[ClusteringData]
    
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
    cluster_sorting: ClusterSorting


def parse_JSON_file(file_name):
    data = None

    try:
        with open(f'data/{file_name}.json') as json_file:
            data = json.load(json_file)
            data = parse_obj_as(Base, data)
    except FileNotFoundError:
        return {'message': f'{file_name} file not found'}

    return data


def parse_model_to_dict(model):
    return model.dict()

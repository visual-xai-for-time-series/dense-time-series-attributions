import json
import base64

import numpy as np

import scipy as sp

from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

import model as m

import image as i

import functions as f


origins = [
    'http://localhost',
    'http://localhost:3000',
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


cache = {}
def load_file(file_name):
    if file_name in cache:
        data = cache[file_name]
    else:
        data = m.parse_JSON_file(file_name)
    return data


cache['forda'] = m.parse_JSON_file('forda')
# cache['forda_normalized'] = m.parse_JSON_file('forda_normalized')


class Settings(BaseModel):
    resolution_width: int = 0
    resolution_height: int = 0
    
    layout: str = 'vertical'

    raw: bool = True
    raw_hist: bool = False
    activations: bool = True
    activations_hist: bool = False
    attributions: bool = True
    attributions_hist: bool = False
    labels_pred: bool = True
    
    suggestions: bool = False


@app.post('/api/image/{file_name}')
async def serve_image(file_name: str, settings: Settings, start: int = 0, end: int = -1, stage: str = '', clustering_base: str = '', clustering_method: str = '', attribution_method: str = ''):
    resolution_width = settings.resolution_width
    resolution_height = settings.resolution_height

    layout = settings.layout
    
    settings_dict = settings.dict()
    data_to_show = []
    for k in settings_dict.keys():
        if settings_dict[k] == True:
            data_to_show.append(k)
    
    print(settings)
    
    loaded_data = load_file(file_name)

    cluster_sorting = loaded_data.cluster_sorting
    data = loaded_data.data
    
    if stage == '':
        stage, _ = data.get_default()
    
    if clustering_base == '':
        clustering_base, _ = data.get(stage).get_default()

    if clustering_method == '':
        clustering_method, _ = cluster_sorting.get(stage).get_default(clustering_base)

    if attribution_method == '':
        attribution_method, _ = data.get(stage).get_default_attribution()

    print(stage, clustering_base, clustering_method, attribution_method)

    collected_data = m.parse_model_to_dict(data.get(stage))
    collected_data['attributions_hist'] = collected_data['attributions'][f'{attribution_method}_hist']
    collected_data['attributions'] = collected_data['attributions'][attribution_method]
    
    cluster_sorting_defaults = cluster_sorting.get(stage).get_default_clusterings()
    cluster_sorting_defaults['attributions_hist'] = cluster_sorting_defaults['attributions'][f'{attribution_method}_hist']
    cluster_sorting_defaults['attributions'] = cluster_sorting_defaults['attributions'][f'{attribution_method}']

    sorting = cluster_sorting.get(stage).get_clusterings(clustering_base, clustering_method, attribution_method)
    stages = data.get_set()
    attribution_methods = data.get(stage).get_attributions()
    
    tmp = {}
    for k in collected_data:
        tmp[k] = collected_data[k][sorting].tolist()

    # slice to start and end and calculate width
    ret_tmp = {}
    max_samples = 0

    for k in tmp:
        if k == 'meta':
            continue
        max_samples = max(max_samples, len(tmp[k]))
        ret_tmp[k] = tmp[k][start:end]
    tmp_sorting = sorting[start:end].tolist()

    summary_data_std = {}
    for k in tmp.keys():
        tmp_data = np.array(tmp[k])
        
        if len(tmp_data.shape) > 1:
            if tmp_data.shape[-1] > 10:
                summary_data_std[k] = np.std(tmp_data, axis=1).tolist()
            else:
                summary_data_std[k] = np.mean(tmp_data, axis=1).tolist()
        else:
            summary_data_std[k] = tmp_data.copy().tolist()

    data_generation = [
        ['raw', 'MinMax', 'interpolateRdBu', False],
        ['raw_hist', 'Sqrt', 'interpolateReds', False],
        ['activations', 'MinMax', 'interpolateReds', False],
        ['activations_hist', 'Sqrt', 'interpolateReds', False],
        ['attributions', 'MinMax', 'interpolateRdBu', True],
        ['attributions_hist', 'Sqrt', 'interpolateReds', False],
        ['labels_pred', 'MinMax', 'viridis', False]
    ]

    data_for_image = []
    for k in data_generation:
        k, norm, cmap, quant = k
        if k in ret_tmp and k in data_to_show:
            d = np.array(ret_tmp[k])
            # d = i.discretizer(d)
            d = i.normalize(d, norm)
            if quant:
                d = i.only_quantiles(d)
            d = i.data_to_color(d, cmap)
            data_for_image.append(d)

    image = i.data_to_image(data_for_image, resolution=[resolution_width, resolution_height], direction=layout)
    image_base64 = base64.b64encode(image.read())
    
    ret_tmp = {
       'image': image_base64,
   }
    
    ret_tmp['meta'] = {
        'cur_stage': stage,
        'cur_attribution_method': attribution_method,
        'stages': stages,
        'attribution_methods': attribution_methods,
        'max_samples': max_samples,
        'cluster_sortings': cluster_sorting_defaults,
        'cur_clustering_base': clustering_base,
        'cur_clustering_method': clustering_method,
        'summary_data': summary_data_std,
        'sorting_idc': tmp_sorting,
    }
    
    return ret_tmp


@app.post('/api/nearestneighbor/{file_name}/{idx}')
async def serve_nearestneighbors(file_name: str, idx: int, settings: Settings, start: int = 0, end: int = -1, stage: str = '', clustering_base: str = '', clustering_method: str = '', attribution_method: str = ''):
    pass


@app.get('/')
async def home():
    return 'Nothing to see'


if __name__ == '__main__':
    print('Start app')
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)

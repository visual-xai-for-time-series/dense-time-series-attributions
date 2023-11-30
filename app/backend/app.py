import json
import base64

import numpy as np

import scipy as sp

from fastapi import FastAPI
from fastapi.responses import Response, JSONResponse
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
    
    raw_time_series_colormap: str = 'interpolateRdBu'
    raw_time_series_hist_colormap: str = 'interpolateReds'

    activations_colormap: str = 'interpolateReds'
    activations_hist_colormap: str = 'interpolateReds'

    attributions_colormap: str = 'interpolateRdBu'
    attributions_hist_colormap: str = 'interpolateReds'

    predictions_colormap: str = 'viridis'


@app.post('/api/getPixelImage/{file_name}')
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
    cluster_sorting_defaults['None'] = ['None']

    sorting = cluster_sorting.get(stage).get_clusterings(clustering_base, clustering_method, attribution_method)
    stages = data.get_set()
    attribution_methods = data.get(stage).get_attributions()
    
    if sorting is None:
        sorting = np.array(range(len(collected_data[list(collected_data.keys())[0]])))

    # slice to start and end and calculate width
    ret_tmp = {}
    max_samples = 0
    tmp_sorting = sorting[start:end]

    for k in collected_data:
        max_samples = max(max_samples, len(collected_data[k]))
        ret_tmp[k] = collected_data[k][tmp_sorting].tolist()
    tmp_sorting = tmp_sorting.tolist()

    summary_data_std = {}
    for k in collected_data.keys():
        tmp_data = collected_data[k][sorting]

        if len(tmp_data.shape) > 1:
            if tmp_data.shape[-1] > 10:
                summary_data_std[k] = np.std(tmp_data, axis=1).tolist()
            else:
                summary_data_std[k] = np.mean(tmp_data, axis=1).tolist()
        else:
            summary_data_std[k] = tmp_data.copy().tolist()

    summary_data_std['None'] = np.std(collected_data['raw'][sorting], axis=1).tolist()

    data_generation = [
        ['raw', 'MinMax', settings.raw_time_series_colormap, False],
        ['raw_hist', 'Sqrt', settings.raw_time_series_hist_colormap, False],
        ['activations', 'MinMax', settings.activations_colormap, False],
        ['activations_hist', 'Sqrt', settings.activations_hist_colormap, False],
        ['attributions', 'MinMax', settings.attributions_colormap, True],
        ['attributions_hist', 'Sqrt', settings.attributions_hist_colormap, False],
        ['labels_pred', 'MinMax', settings.predictions_colormap, False]
    ]

    proportion_for_image = []

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
            proportion_for_image.append(d.shape[1])
            data_for_image.append(d)

    proportion_sum = sum(proportion_for_image)
    if layout == 'horizontal':
        proportion_for_image = [x/proportion_sum * resolution_height for x in proportion_for_image]
    else:
        proportion_for_image = [x/proportion_sum * resolution_width for x in proportion_for_image]

    image = i.data_to_image(data_for_image, resolution=[resolution_width, resolution_height], direction=layout)
    image_base64 = base64.b64encode(image.read())
    
    ret_tmp = {
       'image': image_base64,
       'meta': {
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
            'data_splitters': proportion_for_image,
        }
   }

    return ret_tmp


@app.post('/api/nearestneighbor/{file_name}/{idx}')
async def serve_nearestneighbors(file_name: str, idx: int, settings: Settings, start: int = 0, end: int = -1, stage: str = '', clustering_base: str = '', clustering_method: str = '', attribution_method: str = ''):
    pass


@app.get('/api/getAvailableColors')
async def get_available_colors():
    return JSONResponse(content=i.get_available_colormaps())


@app.post('/api/getTimeSeriesForIdc/{file_name}')
async def get_time_series_for_idc(file_name: str, body: dict, stage: str = ''):

    if 'idc' not in body:
        return 200

    if len(body['idc']) < 1:
        return 200

    selected_idc = np.array(body['idc']).astype(int)

    loaded_data = load_file(file_name)

    cluster_sorting = loaded_data.cluster_sorting
    data = loaded_data.data

    if stage == '':
        stage, _ = data.get_default()

    collected_data = m.parse_model_to_dict(data.get(stage))
    selected_data = collected_data['raw'][selected_idc]

    start = body['start'] * selected_data.shape[1]
    end = body['end'] * selected_data.shape[1]

    image = i.idc_to_image(selected_data, start, end)

    image_base64 = base64.b64encode(image.read())
    
    ret_tmp = {
       'image': image_base64,
   }
    
    return ret_tmp


@app.get('/')
async def home():
    return 'Server is running!'


if __name__ == '__main__':
    print('Start app')
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)

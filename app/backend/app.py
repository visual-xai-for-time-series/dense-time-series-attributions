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


json_files = m.get_all_available_JSON_files()
print(json_files)

for json_file in json_files:
    cache[json_file[:-5]] = m.parse_JSON_file(json_file)

print(cache.keys())


class Settings(BaseModel):
    resolution_width: int = 0
    resolution_height: int = 0
    
    layout: str = 'vertical'

    raw_data: bool = True
    raw_data_histogram: bool = False
    activations: bool = True
    activations_histogram: bool = False
    attributions: bool = True
    attributions_histogram: bool = False
    labels_pred: bool = True
    
    suggestions: bool = False
    
    raw_time_series_colormap: str = 'interpolateRdBu'
    raw_time_series_histogram_colormap: str = 'interpolateReds'

    activations_colormap: str = 'interpolateReds'
    activations_histogram_colormap: str = 'interpolateReds'

    attributions_colormap: str = 'interpolateRdBu'
    attributions_histogram_colormap: str = 'interpolateReds'

    predictions_colormap: str = 'viridis'


@app.post('/api/getPixelImage')
@app.post('/api/getPixelImage/{file_name}')
async def serve_image(settings: Settings, file_name: str = '', start: int = 0, end: int = -1, stage: str = '', ordering_base: str = '', ordering_method: str = '', attribution_method: str = ''):
    if file_name == '':
        file_name = list(cache.keys())[0]
    
    resolution_width = settings.resolution_width
    resolution_height = settings.resolution_height

    layout = settings.layout

    settings_dict = settings.dict()
    data_to_show = []
    for k in settings_dict.keys():
        if settings_dict[k] == True:
            if 'labels' in k:
                data_to_show.append('labels')
                data_to_show.append('predictions')
            else:
                data_to_show.append(k)
    
    print(data_to_show)
    print(settings)
    
    loaded_data = load_file(file_name)

    data = loaded_data.data
    orderings = loaded_data.orderings
    interestingness = loaded_data.interestingness
    
    if stage == '':
        stage, _ = data.get_default()
    
    if ordering_base == '':
        ordering_base, _ = data.get(stage).get_default()

    if ordering_method == '':
        ordering_method, _ = orderings.get(stage).get_default(ordering_base)

    if attribution_method == '':
        attribution_method, _ = data.get(stage).get_default_attribution()

    print(f'Dataset: {file_name}, Interval: [{start}, {end}], Stage: {stage}, Method: {attribution_method}, Ordering: [{ordering_base}, {ordering_method}]')

    collected_data = m.parse_model_to_dict(data.get(stage))
    collected_data['attributions_histogram'] = collected_data['attributions'][f'{attribution_method}_histogram']
    collected_data['attributions'] = collected_data['attributions'][attribution_method]

    orderings_defaults = orderings.get(stage).get_default_orderings()
    orderings_defaults['attributions_histogram'] = orderings_defaults['attributions'][f'{attribution_method}_histogram']
    orderings_defaults['attributions'] = orderings_defaults['attributions'][f'{attribution_method}']
    orderings_defaults['None'] = ['None']

    selected_ordering = orderings.get(stage).get_orderings(ordering_base, ordering_method, attribution_method)
    stages = data.get_set()
    attribution_methods = data.get(stage).get_attributions()

    if selected_ordering is None:
        ordering = np.array(range(len(collected_data[list(collected_data.keys())[0]])))
    else:
        ordering = selected_ordering['ordering']

    print(f'Selected Ordering: {ordering}')

    interestingness_idc = interestingness.get(stage).get_interestingness(ordering_base, ordering_method, attribution_method)
    selected_interestingness_idc = []
    if interestingness_idc:
        for idx in interestingness_idc:
            if start <= idx[0][0] and idx[0][1] <= end:
                selected_interestingness_idc.append(idx)

    # slice to start and end and calculate width
    ret_tmp = {}
    max_samples = 0
    sliced_ordering = ordering[start:end]

    for k in collected_data:
        print(k)
        max_samples = max(max_samples, len(collected_data[k]))
        ret_tmp[k] = collected_data[k][sliced_ordering].tolist()
    sliced_ordering = sliced_ordering.tolist()

    # summary data for the slider selector
    summary_data_std = {}
    for k in collected_data.keys():
        tmp_data = collected_data[k][ordering]

        if len(tmp_data.shape) > 1:
            if tmp_data.shape[-1] > 10:
                summary_data_std[k] = np.std(tmp_data, axis=1).tolist()
            else:
                summary_data_std[k] = np.mean(tmp_data, axis=1).tolist()
        else:
            summary_data_std[k] = tmp_data.copy().tolist()

    summary_data_std['None'] = np.std(collected_data['raw_data'][ordering], axis=1).tolist()

    data_generation = [
        ['raw_data', 'MinMax', settings.raw_time_series_colormap, False],
        ['raw_data_histogram', 'Sqrt', settings.raw_time_series_histogram_colormap, False],
        ['activations', 'MinMax', settings.activations_colormap, False],
        ['activations_histogram', 'Sqrt', settings.activations_histogram_colormap, False],
        ['attributions', 'MinMax', settings.attributions_colormap, True],
        ['attributions_histogram', 'Sqrt', settings.attributions_histogram_colormap, False],
        ['labels', 'MinMax', settings.predictions_colormap, False],
        ['predictions', 'MinMax', settings.predictions_colormap, False]
    ]

    data_for_image = []
    proportion_for_image = []
    
    print(ret_tmp.keys())

    for k in data_generation:
        k, norm, cmap, quant = k
        print(k)
        if k in ret_tmp and k in data_to_show:
            print(k)
            d = np.array(ret_tmp[k])
            # d = i.discretizer(d)
            d = i.normalize(d, norm)
            if quant:
                d = i.only_quantiles(d)
            d = i.data_to_color(d, cmap)

            data_for_image.append(d)
            if d.shape[1] > 10:
                proportion_for_image.append(d.shape[1])

    proportion_sum = sum(proportion_for_image)
    if layout == 'horizontal':
        proportion_for_image_scaled = [x/proportion_sum * resolution_height for x in proportion_for_image]
    else:
        proportion_for_image_scaled = [x/proportion_sum * resolution_width for x in proportion_for_image]

    image = i.data_to_image(data_for_image, resolution=[resolution_width, resolution_height], direction=layout)
    image_base64 = base64.b64encode(image.read())
    
    ret_tmp = {
       'image': image_base64,
       'meta': {
            'stages': stages,
            'attribution_methods': attribution_methods,
            'orderings': orderings_defaults,

            'cur_stage': stage,
            'cur_attribution_method': attribution_method,
            'cur_ordering_base': ordering_base,
            'cur_ordering_method': ordering_method,

            'max_samples': max_samples,

            'summary_data': summary_data_std,
            'ordering_idc': sliced_ordering,

            'data_lengths': proportion_for_image,
            'data_lengths_scaled': proportion_for_image_scaled,

            'interestingness': selected_interestingness_idc,
        }
   }

    return ret_tmp


@app.post('/api/nearestneighbor/{file_name}/{idx}')
async def serve_nearestneighbors(file_name: str, idx: int, settings: Settings, start: int = 0, end: int = -1, stage: str = '', ordering_base: str = '', ordering_method: str = '', attribution_method: str = ''):
    pass


@app.get('/api/getAvailableColors')
async def get_available_colors():
    return JSONResponse(content=i.get_available_colormaps())


@app.get('/api/getAvailableDatasets')
async def get_available_datasets():
    return JSONResponse(content=list(cache.keys()))


@app.post('/api/getTimeSeriesForIdc')
@app.post('/api/getTimeSeriesForIdc/{file_name}')
async def get_time_series_for_idc(body: dict, file_name: str = '', stage: str = ''):

    if file_name == '':
        file_name = list(cache.keys())[0]

    if 'idc' not in body:
        return 200

    if len(body['idc']) < 1:
        return 200

    selected_idc = np.array(body['idc']).astype(int)

    loaded_data = load_file(file_name)

    orderings = loaded_data.orderings
    data = loaded_data.data

    if stage == '':
        stage, _ = data.get_default()

    collected_data = m.parse_model_to_dict(data.get(stage))
    selected_data = collected_data['raw_data'][selected_idc]

    start = body['start']
    end = body['end']
    if start < 1 and isinstance(start, float):
        start = start * selected_data.shape[1]
    if end < 1 and isinstance(end, float):
        end = end * selected_data.shape[1]

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

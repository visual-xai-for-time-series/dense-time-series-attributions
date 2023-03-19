import json

import numpy as np

import scipy as sp

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import model as m


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


@app.get('/api/data/{file_name}')
async def read_data(file_name: str, start: int = 0, end: int = -1, stage: str = '', clustering_base: str = '', clustering_method: str = '', attribution_method: str = ''):
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


@app.get('/')
async def home():
    return 'It works!'


if __name__ == '__main__':
    print('Start app')
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)

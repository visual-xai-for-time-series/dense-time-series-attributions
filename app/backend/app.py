import json

import numpy as np

import scipy as sp

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


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
        try:
            with open(f'data/{file_name}.json') as json_file:
                data = json.load(json_file)
            cache[file_name] = data
        except FileNotFoundError:
            return {'message': f'{file_name} file not found'}
    return data


@app.get('/api/data/{file_name}')
async def read_data(file_name: str, start: int = 0, end: int = -1, ordering_data: str = '', ordering_method: str = ''):
    data = load_file(file_name)
    
    if ordering_data == '':
        ordering_data = list(data['cluster_sorting'].keys())[0]
        
    if ordering_method == '':
        ordering_method = list(data['cluster_sorting'][ordering_data].keys())[0]

    if ordering_data in data['cluster_sorting']:
        print(f'Ordering: {ordering_data}')
        ordering_methods = list(data['cluster_sorting'][ordering_data].keys())
        if ordering_method in ordering_methods:
            print(f'Method: {ordering_method}')
            sorting = data['cluster_sorting'][ordering_data][ordering_method]

        tmp = {}
        for k in data['data']:
            tmp[k] = np.array(data['data'][k])[sorting].tolist()
    else:
        tmp = data['data']

    # slice to start and end and calculate width
    ret_tmp = {}
    max_samples = 0
    length = 0
    for k in tmp:
        if k == 'meta':
            continue
        max_samples = max(max_samples, len(tmp[k]))
        length += len(tmp[k][0])
        ret_tmp[k] = tmp[k][start:end]

    summary_data_std = np.std(data['data'][ordering_data], axis=1).tolist()
    ret_tmp['meta'] = {
        'length': length,
        'max_samples': max_samples,
        'orderings': {d: list(data['cluster_sorting'][d].keys()) for d in data['cluster_sorting']},
        'cur_ordering_data': ordering_data,
        'cur_ordering_method': ordering_method,
        'summary_data': summary_data_std,
    }

    return ret_tmp


@app.get('/')
async def home():
    return 'It works!'


if __name__ == '__main__':
    print('Start app')
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)

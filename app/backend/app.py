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


def sorting(data, key):
    o = np.array(data[key])

    def euclidean(a, b):
        return np.linalg.norm(a - b)
        
    def spearman(a, b):
        return sp.stats.spearmanr(a, b).statistic

    def pearson(a, b):
        return sp.stats.pearsonr(a, b).statistic

    def bhattacharyya(a, b):
        return -np.log(np.sum([np.sqrt(a[i] * b[i]) for i in range(len(a))]))
    
    def wasserstein(a, b):
        return sp.stats.wasserstein_distance(a, b)


    n, k = o.shape
    dist = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i, n):
            dist[i, j] = euclidean(o[i], o[j])

    full_dist = dist + np.transpose(dist) - 2 * np.diag(dist)
    
    min_sample = np.argmin(np.sum(full_dist, axis=1))
    print(min_sample)
    sorting = np.argsort(full_dist[min_sample])
    print(sorting)
    
    tmp = {}
    for k in data:
        tmp[k] = np.array(data[k])[sorting].tolist()

    return tmp


def clustering(data, key):
    o = np.array(data[key])
    
    def pearson(a, b):
        return sp.stats.pearsonr(a, b).statistic
    
    n, k = o.shape
    dist_pearson = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i, n):
            dist_pearson[i, j] = pearson(o[i], o[j])
    
    full_dist_pearson = 1 - dist_pearson + np.transpose(dist_pearson) - np.diag(np.diag(dist_pearson))
    
    # full_dist_pearson = sp.spatial.distance.squareform(full_dist_pearson)
    linkage = sp.cluster.hierarchy.linkage(full_dist_pearson, method='ward', optimal_ordering=True)
    dendrogram = sp.cluster.hierarchy.dendrogram(linkage, get_leaves=True, no_plot=True)
    sorting = dendrogram['leaves']
    
    tmp = {}
    for k in data:
        tmp[k] = np.array(data[k])[sorting].tolist()

    return tmp


def clustering_direct(data, key):
    o = np.array(data[key])
    
    def normalized_euclidean(a, b):
        return np.sqrt(np.sum((a / np.amax(a) - b / np.amax(b)) ** 2)) / len(a)
    
    if len(o.shape) < 2:
        return None

    n, m = o.shape
    dist = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i, n):
            dist[i, j] = normalized_euclidean(o[i], o[j])
    
    dist_square = sp.spatial.distance.squareform(dist + np.transpose(dist))

    linkage = sp.cluster.hierarchy.linkage(dist_square, method='ward', optimal_ordering=True)
    dendrogram = sp.cluster.hierarchy.dendrogram(linkage, get_leaves=True, no_plot=True)
    sorting = dendrogram['leaves']
    
    tmp = {}
    for k in data:
        tmp[k] = np.array(data[k])[sorting].tolist()

    return tmp


@app.get('/data/{file_name}')
async def read_data(file_name: str, start: int = 0, end: int = -1, sorting_name: str = 'raw_test'):
    data = load_file(file_name)

    if sorting_name in data['cluster_sorting']:
        sorting = data['cluster_sorting'][sorting_name]
        tmp = {}
        for k in data['data']:
            tmp[k] = np.array(data['data'][k])[sorting].tolist()
    else:
        tmp = data['data']

    # slice to start and end and calculate width
    width = 0
    for k in tmp:
        width += len(tmp[k][0])
        tmp[k] = tmp[k][start:end]

    return tmp


@app.get('/')
async def location():
    return {'message': f'It works!'}


if __name__ == '__main__':
    print('Init clusterings')
    init_clusterings('forda')
    
    print('Start app')
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)

from distance_functions import *

### Sorting


def naive_sorting(data):
    data_for_sorting = data.copy()

    if len(data_for_sorting.shape) == 1:
        sort_ind = data_for_sorting.argsort(kind='mergesort')
        dist_sort = neighborhood_dist(data_for_sorting[sort_ind])
        return dist_sort, sort_ind
    
    col_len = data_for_sorting.shape[-1]
    for i in range(col_len):
        sort_ind = data_for_sorting[:,col_len - i - 1].argsort(kind='mergesort')
        data_for_sorting = data_for_sorting[sort_ind]

    del data_for_sorting

    return 'Sorting', sort_ind


import tsfresh.feature_extraction.feature_calculators as fc

tsfresh_funcs = [
    ['Sum of Changes', fc.absolute_sum_of_changes],
    ['Absolute Energy', fc.abs_energy],
    ['Absolute Maximum', fc.absolute_maximum],
    ['Kurtosis', fc.kurtosis],
    ['Skewness', fc.skewness],
    ['Sample Entropy', fc.sample_entropy],
    ['Standard Deviation', fc.standard_deviation],
    ['Mean Second Derivative Central', fc.mean_second_derivative_central],
]

def feature_sorting(data):
    inter_results = []
    for fn in tsfresh_funcs:
        name, fn = fn

        data_for_sorting = data.copy()

        extracted_features = np.apply_along_axis(fn, 1, data_for_sorting)
        ef = extracted_features.argsort()
        inter_results.append([name, ef])

        del data_for_sorting

    return inter_results


### Projection

from sklearn.decomposition import PCA
import umap.umap_ as umap

def projection_sorting(data):
    inter_results = []
    
    pca = PCA(n_components=1)
    att_pca = pca.fit_transform(data)
    fpcp = np.argsort(att_pca[:,0])

    reducer = umap.UMAP(n_components=1)
    att_umap = reducer.fit_transform(data)
    fumap = np.argsort(att_umap[:,0])

    inter_results.append(['FPCP', fpcp])
    inter_results.append(['UMAP', fumap])

    return inter_results


### Clustering

def clustering_linkage(data, dist_func=normalized_euclidean, square_func=euclidean_to_square, method='ward', optimal_ordering=True):
    o = np.array(data)
    
    if len(o.shape) != 2:
        return None
    
    n, _ = o.shape
    dist = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i, n):
            dist[i, j] = dist_func(o[i], o[j])
    
    square_dist = square_func(dist)
    square_dist = np.nan_to_num(square_dist)
    
    try:
        linkage = sp.cluster.hierarchy.linkage(square_dist, method=method, optimal_ordering=optimal_ordering)
        dendrogram = sp.cluster.hierarchy.dendrogram(linkage, get_leaves=True, no_plot=True)
        sorting = dendrogram['leaves']
    except Exception as e:
        print(f'Error with Clustering {method}: {e}')
        sorting = list(range(len(data)))

    return sorting


def clustering_linkage_pearson(data, method='ward', optimal_ordering=True):
    return clustering_linkage(data, dist_func=pearson, square_func=pearson_to_square, method=method, optimal_ordering=optimal_ordering)


def clustering_linkage_normalized_euclidean(data, method='ward', optimal_ordering=True):
    return clustering_linkage(data, dist_func=normalized_euclidean, square_func=euclidean_to_square, method=method, optimal_ordering=optimal_ordering)


hierarchical_clustering_appraches = ['ward', 'single', 'average', 'complete']

def clustering_sorting(data):
    inter_results = []
    for approach in hierarchical_clustering_appraches:
        fcluster_euc = clustering_linkage(data, method=approach)
        fcluster_norm_euc = clustering_linkage_normalized_euclidean(data, method=approach)
        fcluster_pearson = clustering_linkage_pearson(data, method=approach)

        inter_results.append([f'{approach.title()} Euclidean', fcluster_euc])
        inter_results.append([f'{approach.title()} Normalized Euclidean', fcluster_norm_euc])
        inter_results.append([f'{approach.title()} Pearson', fcluster_pearson])

    return inter_results


hierarchical_clustering_appraches = ['ward', 'single', 'average', 'complete']

def reduced_clustering_sorting(data):
    reducer = umap.UMAP(n_components=10, random_state=42)
    data_reduced = reducer.fit_transform(data)

    inter_results = clustering_sorting(data_reduced)
    inter_results_tmp = []
    for r in inter_results:
        name_r, sorted_ind = r
        name_r = f'Reduced {name_r}'
        inter_results_tmp.append([name_r, sorted_ind])

    return inter_results_tmp


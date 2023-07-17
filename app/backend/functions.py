import numpy as np

from dist_functions import cosine


def k_nearest_neighbor_ordering(idx, data):
    pass



def interestingness_measure(data):
    def quant(data):
        data_tmp = data.copy()

        lower_bound = np.percentile(data_tmp, 0.05)
        upper_bound = np.percentile(data_tmp, 0.95)

        data_tmp[(data_tmp > lower_bound) & (upper_bound > data_tmp)] = 0
        return data_tmp
    
    focused_data = np.apply_along_axis(quant, 1, data)
    n, m = focused_data.shape
    dist = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i, n):
            dist[i, j] = cosine(focused_data[i], focused_data[j])
    
    print(dist)
    
    neighborhood = 5
    interestingness = []
    for i in range(neighborhood, n - neighborhood):
        lower = max(0, i - neighborhood)
        upper = min(i + neighborhood, n)
        interestingness.append(np.sum(dist[lower:upper, lower:upper]))
    
    return interestingness

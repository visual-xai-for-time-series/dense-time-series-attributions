import time

from scipy.stats import entropy
from scipy.signal import convolve2d, convolve

from distance_functions import *


def neighborhood_dist(data, neighborhood=10, dist_fn=normalized_euclidean):
    if len(data.shape) == 2:
        n, _ = data.shape
    else:
        n = len(data)

    dist = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i, n):
            dist[i, j] = dist_fn(data[i], data[j])

    neighborhood_sum = 0
    for i in range(n):
        lower = max(0, i - neighborhood)
        upper = min(i + neighborhood, n)
        neighborhood_sum += np.sum(dist[lower:upper, lower:upper])
    return neighborhood_sum


def baseline_convolution(data):
    t = data.copy()

    n = min(max(3, int(t.shape[0] * 0.1)), 10)
    m = min(max(3, int(t.shape[1] * 0.1)), 10)
    
    kernel = np.zeros((n, m))
    kernel[:,:] = -1
    middle_row = n // 2
    middle_column = m // 2
    kernel[middle_row, middle_column] = n * m - 1

    t = (t - np.min(t)) / (np.max(t) - np.min(t))
    t_r = convolve2d(t, kernel, mode='full', boundary='wrap')
    return t_r.sum()


def baseline_entropy(data, neighborhood_size=10):

    def convert_to_probs(data, num_bins=100):
        bin_edges = np.linspace(data.min(), data.max(), num=num_bins + 1)
        discrete_data = np.digitize(data, bin_edges)
        discrete_data_flatten = discrete_data.flatten()
        _, counts = np.unique(discrete_data_flatten, return_counts=True)
        probabilities = counts / len(discrete_data_flatten)
        return probabilities

    complete_neighborhood_size = neighborhood_size * 2
    
    data_len = len(data)
    random_idc = np.random.permutation(np.arange(data_len))
    random_data = data[random_idc]

    data_entropy = []
    random_entropy = []

    for i in range(int(data_len / complete_neighborhood_size) + 1):

        tmp_data = data[i*complete_neighborhood_size:(i+1)*complete_neighborhood_size]
        tmp_random = random_data[i*complete_neighborhood_size:(i+1)*complete_neighborhood_size]
        
        data_entropy.append(entropy(convert_to_probs(tmp_data)))
        random_entropy.append(entropy(convert_to_probs(tmp_random)))

    return np.sum(data_entropy), np.sum(random_entropy)


def calculate_scores(data):
    start_time = time.process_time()
    neighborhood_score = neighborhood_dist(data)
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds for neighboorhood measure')

    start_time = time.process_time()
    convolution_score = baseline_convolution(data)
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds for convolution measure')

    start_time = time.process_time()
    entropy_score = baseline_entropy(data)
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds for entropy measure')

    return neighborhood_score, convolution_score, entropy_score

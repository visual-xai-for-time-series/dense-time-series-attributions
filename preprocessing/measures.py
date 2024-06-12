import time
import traceback

from scipy.stats import entropy
from scipy.signal import convolve2d, convolve

from distance_functions import *


def neighborhood_dist(data, neighborhood=10, dist_fn=normalized_euclidean):
    if len(data.shape) == 2:
        n, _ = data.shape
    else:
        n = len(data)

    dist = np.empty((n, n), dtype=float)
    dist[:] = np.nan

    for i in range(n):
        for j in range(-neighborhood * 2, neighborhood * 2):
            j += i
            if j >= n or j < 0: continue
            if j < i:
                dist[i, j] = 0
            if np.isnan(dist[i, j]):
                dist[i, j] = dist_fn(data[i], data[j])

    neighborhood_sum = 0
    for i in range(n):
        lower = max(0, i - neighborhood)
        upper = min(i + neighborhood, n)
        neighborhood_sum += np.sum(dist[lower:upper, lower:upper])
    return neighborhood_sum


def neighborhood_dist_naive(data, neighborhood=10, dist_fn=normalized_euclidean):
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
    data_tmp = data.copy()

    def convert_to_probs(data, num_bins=100):
        min_ = data.min()
        max_ = data.max()
        bin_edges = np.linspace(min_, max_, num=num_bins + 1)
        discrete_data = np.digitize(data, bin_edges)
        discrete_data_flatten = discrete_data.flatten()
        _, counts = np.unique(discrete_data_flatten, return_counts=True)
        probabilities = counts / len(discrete_data_flatten)
        return probabilities

    complete_neighborhood_size = neighborhood_size * 2

    data_len = len(data_tmp)
    random_idc = np.random.permutation(np.arange(data_len))
    random_data = data_tmp[random_idc]

    data_entropy = []
    random_entropy = []

    for i in range(int(data_len / complete_neighborhood_size) + 1):

        tmp_data = data_tmp[i*complete_neighborhood_size:(i+1)*complete_neighborhood_size]
        tmp_random = random_data[i*complete_neighborhood_size:(i+1)*complete_neighborhood_size]

        data_entropy.append(entropy(convert_to_probs(tmp_data)))
        random_entropy.append(entropy(convert_to_probs(tmp_random)))

    return np.sum(data_entropy), np.sum(random_entropy)


def calculate_scores(data):
    start_time = time.process_time()
    try:
        neighborhood_score = neighborhood_dist(data)
    except Exception as e:
        traceback_str = traceback.format_exc()
        print(f'Exception: {e}')
        print(traceback_str)
        print(f'Problem with: {data}')
        neighborhood_score = None
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds for neighboorhood measure')

    start_time = time.process_time()
    try:
        convolution_score = baseline_convolution(data)
    except Exception as e:
        traceback_str = traceback.format_exc()
        print(f'Exception: {e}')
        print(traceback_str)
        print(f'Problem with: {data}')
        convolution_score = None
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds for convolution measure')

    start_time = time.process_time()
    try:
        entropy_score = baseline_entropy(data)
    except Exception as e:
        traceback_str = traceback.format_exc()
        print(f'Exception: {e}')
        print(traceback_str)
        print(f'Problem with: {data}')
        entropy_score = None
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    print(f'Time needed {rounded_time} seconds for entropy measure')

    return neighborhood_score, convolution_score, entropy_score


################################################################################


def only_quantiles(data, axis=1, quant_range=0.1, fill=None):
    def quant(data):
        lower_bound = np.quantile(data, quant_range)
        upper_bound = np.quantile(data, 1 - quant_range)

        filler = fill
        if filler is None:
            filler = (np.max(data) - np.min(data)) / 2

        data_new = np.copy(data)
        data_new[(data_new > lower_bound) & (upper_bound > data_new)] = filler

        return data_new

    if axis == -1:
        return quant(data)
    else:
        return np.apply_along_axis(quant, 1, data)


def minmax_norm(data):
    max_ = np.max(data)
    min_ = np.min(data)
    if max_ == min_:
        return np.full_like(data, 1)
    return (data - min_) / (max_ - min_)


def norm(data, axis=1):
    if axis == -1 or len(data.shape) == 1:
        return minmax_norm(data)
    else:
        return np.apply_along_axis(minmax_norm, axis, data)


def combine_elements_with_range(array, range_val=1):
    differences = np.diff(array)
    group_boundaries = np.where(differences > range_val)[0]
    group_boundaries_end = np.append(group_boundaries, len(array) - 1)
    group_boundaries_start = np.append(0, group_boundaries + 1)
    combined_elements_end = array[group_boundaries_end]
    combined_elements_start = array[group_boundaries_start]
    return np.array(list(zip(combined_elements_start, combined_elements_end)))


################################################################################


def interestingness_measure(data, neighborhood=10, dist_fn=wasserstein, lower_bound_value=0.1, upper_bound_value=0.9):
    def quant(data):
        data_tmp = data.copy()
        max_ = np.max(data_tmp)
        min_ = np.min(data_tmp)

        lower_bound = np.quantile(data_tmp, lower_bound_value)
        upper_bound = np.quantile(data_tmp, upper_bound_value)

        data_tmp[(data_tmp > lower_bound) & (upper_bound > data_tmp)] = (max_ - min_) / 2
        return data_tmp

    tmp_data = data.copy()
    focused_data = np.apply_along_axis(quant, 1, tmp_data)

    n, _ = focused_data.shape
    interestingness = np.zeros((n, ), dtype=float)

    dist = np.empty((n, n), dtype=float)
    dist[:] = np.nan
    for i in range(n):
        tmp_sum = 0
        for j in range(-neighborhood, neighborhood):
            j += i
            if j >= n: continue
            if j < 0: continue
            if np.isnan(dist[i,j]):
                dist[i,j] = dist_fn(focused_data[i], focused_data[j])
            tmp_sum += dist[i,j]
        interestingness[i] = tmp_sum / (neighborhood * 2)

    return interestingness


def data_to_interestingness_idx(data, interestingness, neighborhood_size=10, quantile_threshold=0.1):
    threshold = np.quantile(interestingness, quantile_threshold)
    x = np.arange(0, interestingness.shape[0])
    candidates = x[interestingness < threshold]
    if len(candidates) < 1:
        return []
    candidates = combine_elements_with_range(candidates, neighborhood_size)

    data_for_interestingness = data.copy()
    focused_data = norm(data_for_interestingness)
    focused_data = only_quantiles(focused_data)

    interesting_sequences = []
    for start_idx, end_idx in candidates:
        if end_idx - start_idx < neighborhood_size:
            continue

        focused_subsequence = focused_data[start_idx:end_idx]

        kernel = np.zeros((neighborhood_size, neighborhood_size))
        kernel[:,:] = 1
        middle_row = neighborhood_size // 2
        middle_column = neighborhood_size // 2
        kernel[:, middle_column] = neighborhood_size
        kernel[middle_row, middle_column] = neighborhood_size * neighborhood_size
        kernel /= kernel.sum()

        cleaned_data = convolve2d(focused_subsequence, kernel, mode='full', boundary='symm')
        cleaned_data = only_quantiles(cleaned_data, quant_range=0.01)

        norm_data = norm(cleaned_data)
        norm_data_sum = np.sum(norm_data, axis=0)
        idx = np.argmax(norm_data_sum)
    
        interesting_sequences.append([[start_idx, end_idx], idx])

    return interesting_sequences

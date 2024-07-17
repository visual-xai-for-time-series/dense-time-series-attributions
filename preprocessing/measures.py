import time
import traceback

from scipy.stats import entropy
from scipy.signal import convolve2d
from scipy.ndimage import convolve

from logger import logger

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
        logger.info(f'[E] Exception: {e}')
        logger.info(traceback_str)
        logger.info(f'Problem with: {data}')
        neighborhood_score = None
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    logger.info(f'Time needed {rounded_time} seconds for neighboorhood measure')

    start_time = time.process_time()
    try:
        convolution_score = baseline_convolution(data)
    except Exception as e:
        traceback_str = traceback.format_exc()
        logger.info(f'[E] Exception: {e}')
        logger.info(traceback_str)
        logger.info(f'Problem with: {data}')
        convolution_score = None
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    logger.info(f'Time needed {rounded_time} seconds for convolution measure')

    start_time = time.process_time()
    try:
        entropy_score = baseline_entropy(data)
    except Exception as e:
        traceback_str = traceback.format_exc()
        logger.info(f'[E] Exception: {e}')
        logger.info(traceback_str)
        logger.info(f'Problem with: {data}')
        entropy_score = None
    end_time = time.process_time()
    rounded_time = np.round(end_time - start_time, 10)
    logger.info(f'Time needed {rounded_time} seconds for entropy measure')

    return neighborhood_score, convolution_score, entropy_score


################################################################################


def only_quantiles(data, axis=1, quant_range=0.1, fill=None, only_upper=False):
    def quant(data):
        lower_bound = np.quantile(data, quant_range)
        upper_bound = np.quantile(data, 1 - quant_range)

        filler = fill
        if filler is None:
            if only_upper:
                filler = upper_bound
            else:
                filler = (np.max(data) - np.min(data)) / 2

        data_new = np.copy(data)
        if only_upper:
            data_new[data_new < upper_bound] = filler
        else:
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


def flip(data):
    mean = np.mean(data)
    return np.abs(data - mean) + mean


def gaussian_kernel(size: int, sigma: float) -> np.ndarray:
    """
    Generates a 2D Gaussian kernel.
    
    Parameters:
    size (int): The size of the kernel (must be an odd number).
    sigma (float): The standard deviation of the Gaussian.
    
    Returns:
    np.ndarray: 2D Gaussian kernel.
    """
    # Ensure the size is odd to have a center
    if size % 2 == 0:
        raise ValueError("Size must be an odd number.")

    # Create an (size x size) grid of (x, y) coordinates
    ax = np.arange(-size // 2 + 1, size // 2 + 1)
    xx, yy = np.meshgrid(ax, ax)

    # Calculate the Gaussian function
    kernel = np.exp(-(xx**2 + yy**2) / (2 * sigma**2))

    # Normalize the kernel to make the sum of all elements equal to 1
    kernel = kernel / np.sum(kernel)

    return kernel.round(3)


def convolution_binarize(data, neighboorhoodsize=None):
    t = data.copy()
    t -= np.mean(t)

    if neighboorhoodsize == None:
        neighboorhoodsize = int(t.shape[-1] * 0.02)

    if neighboorhoodsize % 2 == 0:
        neighboorhoodsize += 1
    
    # n = neighboorhoodsize

    # kernel = np.zeros((n, n))

    # kernel[:,:] = 1
    # middle_row = n // 2
    # middle_column = n // 2
    # kernel[:, middle_column] = n
    # for i in range(1, int(n // 2)):
    #     kernel[:, middle_column + i] = 2 * n // 4 - i
    #     kernel[:, middle_column - i] = 2 * n // 4 - i
    # kernel[middle_row, middle_column] = n * 2 # n * n / 2
    # kernel /= kernel.sum()

    # smoothed_data = convolve2d(t, kernel, mode='full', boundary='symm')

    sigma = neighboorhoodsize // 4
    kernel = gaussian_kernel(neighboorhoodsize, sigma)

    smoothed_data = convolve(t, kernel, mode='constant', cval=0.0)

    salient_data = only_quantiles(smoothed_data, quant_range=0.005, fill=0, only_upper=True)
    salient_data[salient_data > 0] = 1

    return salient_data


def combine_elements_with_range(array, range_val=1):
    if len(array) < 1:
        return []

    if array[0] > 0:
        array = np.concatenate(([0], array))
        differences = np.diff(array)
        group_boundaries = np.where(differences > range_val)[0]
        group_boundaries_end =  np.concatenate((group_boundaries[1:], [len(array) - 1]))
        group_boundaries_start = group_boundaries
    else:
        differences = np.diff(array)
        group_boundaries = np.where(differences > range_val)[0]
        group_boundaries_end =  np.append(group_boundaries, len(array) - 1)
        group_boundaries_start = np.append(0, group_boundaries + 1)

    combined_elements_end = array[group_boundaries_end]
    combined_elements_start = array[group_boundaries_start]

    return np.array(list(zip(combined_elements_start, combined_elements_end)))


def combine_elements_with_range_new(arr, min_range=10):
    if len(arr) < 1:
        return []
    
    if arr[0] > 0:
        arr = np.concatenate(([0], arr))
    
    diff = np.diff(arr)

    subsequences = []
    for i, x in enumerate(diff):
        if x > min_range:
            subsequences.append([arr[i], arr[i + 1]])

    return subsequences 


################################################################################


def interestingness_measure(data, neighborhood=10, dist_fn=hellinger, bound_value=0.05):
    
    norm_data = norm(data)
    quant_data = only_quantiles(norm_data, quant_range=bound_value)
    flipped_data = flip(quant_data)

    binarized_data = convolution_binarize(flipped_data, neighborhood)

    interestingness = []
    for i in range(len(binarized_data) - 1):
        dst = 0
        for j in range(1, 3):
            low_idx = i - j
            high_idx = i + j
            if low_idx > -1:
                dst += dist_fn(binarized_data[i], binarized_data[low_idx])
            if high_idx < len(binarized_data):
                dst += dist_fn(binarized_data[i], binarized_data[high_idx])
        interestingness.append(dst)
    interestingness = np.array(interestingness)

    return interestingness, binarized_data


def data_to_interestingness_idx(data, interestingness, neighborhood_size=20, quantile_threshold=0.9):
    
    threshold = np.quantile(interestingness, quantile_threshold)
    x = np.arange(0, interestingness.shape[0])
    candidates = x[interestingness > threshold]

    candidates_bounds = combine_elements_with_range_new(candidates, neighborhood_size)

    interesting_sequences = []
    for start_idx, end_idx in candidates_bounds:
        candidates_idx = np.argmax(np.sum(data[start_idx:end_idx], axis=0))
        interesting_sequences.append([[start_idx, end_idx], candidates_idx])

    return interesting_sequences

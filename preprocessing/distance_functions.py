import numpy as np
import scipy as sp

from scipy.spatial.distance import jensenshannon
from scipy.spatial.distance import squareform
from scipy.spatial.distance import cosine as sp_cosine

from dtaidistance import dtw

from frechetdist import frdist

eps = 0.001


def standardize(a):
    return (a - np.mean(a)) / np.std(a)


def pearson(a, b):
    return sp.stats.pearsonr(a, b).statistic


def pearson_to_square(dist):
    return 1 - dist + np.transpose(dist) - np.diag(np.diag(dist))


def euclidean(a, b):
    return np.sqrt(np.sum(a - b) ** 2)


def normalized_euclidean(a, b):
    return np.sqrt(np.sum((a / (np.amax(a) + eps) - b / (np.amax(b) + eps)) ** 2)) / len(a)


def z_normalized_euclidean(a, b):
    return np.sqrt(np.sum(standardize(a) - standardize(b)) ** 2)


def euclidean_to_square(dist):
    return squareform(dist + np.transpose(dist))


def bhattacharyya_distance(a, b):
    bins = int(max(len(a), len(b)) * 0.1)
    # Convert time series to probability distributions
    pdf1 = np.histogram(a, bins=bins, density=True)[0]
    pdf2 = np.histogram(b, bins=bins, density=True)[0]
    # Calculate the Bhattacharyya distance using Jensen-Shannon divergence
    bhattacharyya_distance = np.sqrt(1 - jensenshannon(pdf1, pdf2))
    return bhattacharyya_distance


def dynamic_time_warping(a, b):
    return dtw.distance(a, b)


def frechet_dist(a, b):
    a_traj = a[:, np.newaxis]
    a_traj = np.concatenate((a_traj, np.zeros_like(a_traj)), axis=1)
    b_traj = b[:, np.newaxis]
    b_traj = np.concatenate((b_traj, np.zeros_like(b_traj)), axis=1)
    return frdist(a_traj, b_traj)


def wasserstein(a, b):
    return sp.stats.wasserstein_distance(a, b)


def spearman(a, b):
    return sp.stats.spearmanr(a, b).statistic


def cosine(a, b):
    return sp_cosine(a, b)


def manhattan(a, b):
    return np.sum(np.abs(a - b))


def hellinger(p, q):
    """ Hellinger distance between distributions """
    return sum([(np.sqrt(t[0]) - np.sqrt(t[1])) * (np.sqrt(t[0]) - np.sqrt(t[1])) for t in zip(p,q)]) / np.sqrt(2.)

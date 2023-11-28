
import io
import numpy as np

from PIL import Image

import matplotlib as mpl
import matplotlib.pyplot as plt

from sklearn.preprocessing import KBinsDiscretizer
from sklearn.preprocessing import PowerTransformer


def minmax_norm(data):
    max_ = np.max(data)
    min_ = np.min(data)
    if max_ == min_:
        return 0
    return (data - min_) / (max_ - min_)


def minmax_normalize(data, axis=1):
    if axis == -1:
        return minmax_norm(data)
    else:
        return np.apply_along_axis(minmax_norm, axis, data)


def sqrt_normalize(data, axis=1):
    def sqrt_norm(data):
        data_sqrt = np.sqrt(data)
        return minmax_norm(data_sqrt)

    if axis == -1:
        return sqrt_norm(data)
    else:
        return np.apply_along_axis(sqrt_norm, axis, data)


def robust_normalize(data, axis=1):
    def robust_norm(data):
        shape = data.shape
        pt = PowerTransformer()
        return pt.fit_transform(data.reshape(-1, 1)).reshape(*shape)

    if axis == -1:
        return robust_norm(data)
    else:
        return np.apply_along_axis(robust_norm, axis, data)


def normalize(data, strategy='MinMax'):
    if strategy == 'MinMax':
        return minmax_normalize(data)
    elif strategy == 'Sqrt':
        return sqrt_normalize(data)
    elif strategy == 'Robust':
        return robust_normalize(data)
    return minmax_normalize(data)


def discretizer(data):
    def disc(data):
        est = KBinsDiscretizer(n_bins=10, encode='ordinal', strategy='uniform')
        return est.fit_transform(data.reshape(-1, 1))

    shape = data.shape
    return np.apply_along_axis(disc, 1, data).reshape(*shape)


def only_quantiles(data, axis=1):
    def quant(data):
        quant_range = 0.1
        lower_bound = np.quantile(data, quant_range)
        upper_bound = np.quantile(data, 1 - quant_range)
        
        fill = (max(data) - min(data)) / 2
        
        data_new = np.copy(data)
        data_new[(data_new > lower_bound) & (upper_bound > data_new)] = fill

        return data_new

    if axis == -1:
        return quant(data)
    else:
        return np.apply_along_axis(quant, 1, data)


mpl_colormaps = {
    'interpolateBwr': mpl.colormaps['bwr'],
    'interpolateSeismic': mpl.colormaps['seismic'],
    'interpolateCoolwarm': mpl.colormaps['coolwarm'],
    'interpolateRdBu': mpl.colormaps['RdBu'],
    'interpolateReds': mpl.colormaps['Reds'],
    'interpolateViridis': mpl.colormaps['viridis']
}

def data_to_color(data, colormap=''):
    cmap = mpl.colormaps['binary']
    if colormap in mpl_colormaps:
        cmap = mpl_colormaps[colormap]
    return cmap(data)


def get_available_colormaps():
    return list(mpl_colormaps.keys())


def data_to_image(data, resolution=None, direction='horizontal', divider_length=1):

    # how many pixel per value
    resolution_width, resolution_height = [0, 0]
    if resolution is not None:
        resolution_width, resolution_height = resolution

    # loop through each item in the data array
    data_for_image = []
    for d in data:
        # if the data item is not already a 2D array, reshape it to a column vector
        if len(d.shape) < 2:
            d = d.reshape(-1, 1)

        # scale the values in the data item to the range [0, 255]
        # add the scaled data item to the list of data for the image
        d = d * 255
        data_for_image.append(d)

        # create a divider image to separate the data items
        div = np.ones((len(d), divider_length, 4)) * 255
        data_for_image.append(div)

    # remove the last divider image from the list
    data_for_image = data_for_image[:-divider_length or None]

    # concatenate all of the data items and divider images into a single image array
    data_for_image = np.hstack(data_for_image)

    # transpose if direction is changed
    if direction == 'horizontal':
        data_for_image = np.transpose(data_for_image, (1, 0, 2))

    # change resolution if data is too large
    data_resolution_height, data_resolution_width = data_for_image.shape[:2]
    print(data_resolution_width, data_resolution_height, resolution_width, resolution_height)
    if direction == 'horizontal' and data_resolution_width > resolution_width:
        resolution_width = data_resolution_width
    if direction == 'vertical' and data_resolution_height > resolution_height:
        resolution_height = data_resolution_height

    # create an image from the data matrix
    img = Image.fromarray(np.uint8(data_for_image))
    img = img.resize((resolution_width, resolution_height), resample=Image.NEAREST)

    # save the image to an in-memory buffer
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return buffer


def idc_to_image(data, highlight_start=0, highlight_end=0):

    fig = plt.figure()
    plt.axis('off')
    plt.tight_layout()

    quantile_100 = np.quantile(data, 1, axis=0)
    quantile_90 = np.quantile(data, 0.90, axis=0)
    quantile_50 = np.quantile(data, 0.5, axis=0)
    quantile_10 = np.quantile(data, 0.10, axis=0)
    quantile_0 = np.quantile(data, 0, axis=0)

    max_ = np.max(data)
    min_ = np.min(data)

    plt.fill_between([highlight_start, highlight_end], min_, max_, color='red', alpha=0.1)

    for ts in data:
        plt.plot(ts, color='gray', alpha=0.2)

    plt.plot(quantile_100, color='black', alpha=0.4)
    plt.plot(quantile_90, color='blue', alpha=0.4)
    plt.plot(quantile_50, color='orange')
    plt.plot(quantile_10, color='blue', alpha=0.4)
    plt.plot(quantile_0, color='black', alpha=0.4)

    # Save the Matplotlib figure to an in-memory file-like object
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight', pad_inches=0)
    buffer.seek(0)

    return buffer
    

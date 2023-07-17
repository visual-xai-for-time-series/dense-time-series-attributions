
import io
import numpy as np

from PIL import Image

import matplotlib as mpl

from sklearn.preprocessing import KBinsDiscretizer
from sklearn.preprocessing import PowerTransformer


def minmax_normalize(data, axis=1):
    def minmax_norm(data):
        return (data - np.min(data)) / (np.max(data) - np.min(data))
    
    if axis == -1:
        return minmax_norm(data)
    else:
        return np.apply_along_axis(minmax_norm, 1, data)


def sqrt_normalize(data, axis=1):
    def sqrt_norm(data):
        data_sqrt = np.sqrt(data)
        return (data_sqrt - np.min(data_sqrt)) / (np.max(data_sqrt) - np.min(data_sqrt))
    
    if axis == -1:
        return sqrt_norm(data)
    else:
        return np.apply_along_axis(sqrt_norm, 1, data)


def robust_normalize(data, axis=1):
    def robust_norm(data):
        shape = data.shape
        pt = PowerTransformer()
        return pt.fit_transform(data.reshape(-1, 1)).reshape(*shape)

    if axis == -1:
        return robust_norm(data)
    else:
        return np.apply_along_axis(robust_norm, 1, data)


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


def data_to_color(data, colormap=''):
    cmap = mpl.colormaps['binary']
    if colormap == 'interpolateBwr':
        cmap = mpl.colormaps['bwr']
    elif colormap == 'interpolateSeismic':
        cmap = mpl.colormaps['seismic']
    elif colormap == 'interpolateCoolwarm':
        cmap = mpl.colormaps['coolwarm']
    elif colormap == 'interpolateRdBu':
        cmap = mpl.colormaps['RdBu']
    elif colormap == 'interpolateReds':
        cmap = mpl.colormaps['Reds']
    elif colormap == 'interpolateViridis':
        cmap = mpl.colormaps['viridis']
    return cmap(data)


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

import json

import numpy as np
import scipy as sp
import pandas as pd

import torch
import torch.nn as nn

from torch.utils.data import Dataset, DataLoader

from sklearn.preprocessing import OneHotEncoder

from sktime.datasets import load_UCR_UEA_dataset

from captum.attr import GradientShap, IntegratedGradients



##################
# Set and crawl the dataset
##################

dataset = 'FordA'

X_train, y_train = load_UCR_UEA_dataset(name=dataset, split='train', return_type='numpyflat')
X_test, y_test = load_UCR_UEA_dataset(name=dataset, split='test', return_type='numpyflat')

encoder = OneHotEncoder(categories='auto', sparse=False)

y_train_ohe = encoder.fit_transform(np.expand_dims(y_train, axis=-1))
y_test_ohe = encoder.transform(np.expand_dims(y_test, axis=-1))

y_train_norm = y_train_ohe.argmax(axis=-1)
y_test_norm = y_test_ohe.argmax(axis=-1)

class FordADataset(Dataset):

    def __init__(self, X, y):
        self.X = X
        self.y = y
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        inputs = self.X[idx]
        label = self.y[idx]
        
        return inputs, label

dataset_train = FordADataset(X_train, y_train_ohe)
dataset_test = FordADataset(X_test, y_test_ohe)

dataloader_train = DataLoader(dataset_train, batch_size=120, shuffle=True)
dataloader_train_not_shuffled = DataLoader(dataset_train, batch_size=120, shuffle=False)
dataloader_test = DataLoader(dataset_test, batch_size=120, shuffle=False)

class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        
        self.conv1 = nn.Sequential(
            nn.Conv1d(1, 10, kernel_size=3, stride=1),
            nn.ReLU(inplace=True)
        )
        self.conv2 = nn.Sequential(
            nn.Conv1d(10, 50, kernel_size=3, stride=1),
            nn.MaxPool1d(3),
            nn.ReLU(inplace=True)
        )
        self.conv3 = nn.Sequential(
            nn.Conv1d(50, 100, kernel_size=3, stride=1),
            nn.MaxPool1d(3),
            nn.ReLU(inplace=True)
        )
        
        self.fc1 = nn.Sequential(
            nn.Linear(100 * 54, 100),
            nn.Dropout(0.5),
            nn.ReLU(inplace=True)
        )
        self.fc2 = nn.Sequential(
            nn.Linear(100, 2),
            nn.Softmax()
        )
        
    def forward(self, x):
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)

        batch_size = x.shape[0]
        x = x.view(batch_size, -1)
        x = self.fc1(x)
        x = self.fc2(x)
        
        return x


def trainer(model, dataloader_train, criterion):
    running_loss = 0

    model.train()

    for idx, (inputs, labels) in enumerate(dataloader_train):
        inputs = inputs.reshape(inputs.shape[0], 1, -1)
        inputs = inputs.float().to(device)
        labels = labels.float().to(device)

        optimizer.zero_grad()
        preds = model(inputs)
        loss = criterion(preds, labels.argmax(dim=-1))
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()

    train_loss = running_loss / len(dataloader_train)
    
    return train_loss


def validator(model, dataloader_test, criterion):
    running_loss = 0

    model.eval()

    for idx, (inputs, labels) in enumerate(dataloader_test):
        inputs = inputs.reshape(inputs.shape[0], 1, -1)
        inputs = inputs.float().to(device)
        labels = labels.float().to(device)

        preds = model(inputs)
        loss = criterion(preds, labels.argmax(dim=-1))
        
        running_loss += loss.item()

    train_loss = running_loss / len(dataloader_train)
    
    return train_loss


device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = SimpleCNN().to(device)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
loss = nn.CrossEntropyLoss()

##################
# Learning the model on the data
##################

epochs = 500

for epoch in range(epochs):
    train_loss = trainer(model, dataloader_train, loss)
    if epoch % 10 == 0:
        print('Val', validator(model, dataloader_test, loss))

##################
# Get the activations
##################

activation = {}
def get_activation(name):
    def hook(model, input, output):
        if name not in activation:
            activation[name] = []
        activation[name].extend(output.detach().cpu().numpy().tolist())
    return hook

model.eval()

fc1_handle = model.fc1.register_forward_hook(get_activation('train-fc1'))

for idx, (inputs, labels) in enumerate(dataloader_train_not_shuffled):
    inputs = inputs.reshape(inputs.shape[0], 1, -1)
    inputs = inputs.float().to(device)
    labels = labels.float().to(device)

    preds = model(inputs)

print(len(activation['train-fc1']))
fc1_handle.remove()

fc1_handle = model.fc1.register_forward_hook(get_activation('test-fc1'))

for idx, (inputs, labels) in enumerate(dataloader_test):
    inputs = inputs.reshape(inputs.shape[0], 1, -1)
    inputs = inputs.float().to(device)
    labels = labels.float().to(device)

    preds = model(inputs)

print(len(activation['test-fc1']))
fc1_handle.remove()

##################
# Get the attributions
##################

inputs, labels = [x for x in dataloader_test][0]
inputs = inputs.reshape(inputs.shape[0], 1, -1)
inputs = inputs.float().to(device)
labels = labels.float().to(device)

model.eval()
preds = model(inputs)

y_test_pred = preds.cpu().detach().numpy()

print((preds.argmax(dim=-1) == labels.argmax(dim=-1)).int().sum().float() / len(preds))

sample, label = dataset_test[0]

shape = sample.reshape(1, -1).shape
device = next(model.parameters()).device

ig = IntegratedGradients(model)
attributions = ig.attribute(inputs.reshape(-1, *shape).float().to(device), target=torch.argmax(labels, axis=1))

A_test = attributions.cpu().reshape(-1, shape[-1]).numpy()

##################
# Create json dict
##################


data_to_json = {
    'data': {
        'raw_test': X_test,
        'labels_test': y_test,
        'labels_test_pred': y_test_pred,
        'attributions_test': A_test,
        'activations_test': np.array(activation['test-fc1'])
    }
}


##################
# Get histograms for larger data
##################

keys = list(data_to_json['data'].keys())
for k in keys:
    k_hist = []
    for e in data_to_json['data'][k]:
        if len(e) > 10:
            hist, _ = np.histogram(e, max(10, int(len(e) / 10)))
            k_hist.append(hist)
    if len(k_hist) > 0:
        data_to_json['data'][f'{k}_hist'] = np.array(k_hist)


##################
# Cluster data
##################

def pearson(a, b):
    return sp.stats.pearsonr(a, b).statistic


def pearson_to_square(dist):
    return 1 - dist + np.transpose(dist) - np.diag(np.diag(dist))


def normalized_euclidean(a, b):
    return np.sqrt(np.sum((a / np.amax(a) - b / np.amax(b)) ** 2)) / len(a)


def standardize(a):
    return (a - np.mean(a)) / np.std(a)

def z_normalized_euclidean(a, b):
    return np.sqrt(np.sum(standardize(a) - standardize(b)) ** 2)


def euclidean_to_square(dist):
    return sp.spatial.distance.squareform(dist + np.transpose(dist))


def clustering_linkage(data, key, dist_func=normalized_euclidean, square_func=euclidean_to_square, method='ward', optimal_ordering=True):
    o = np.array(data[key])
    
    if len(o.shape) < 2:
        return None
    
    n, _ = o.shape
    dist = np.zeros((n, n), dtype=float)
    for i in range(n):
        for j in range(i, n):
            dist[i, j] = dist_func(o[i], o[j])
    
    square_dist = square_func(dist)
    
    linkage = sp.cluster.hierarchy.linkage(square_dist, method=method, optimal_ordering=optimal_ordering)
    dendrogram = sp.cluster.hierarchy.dendrogram(linkage, get_leaves=True, no_plot=True)
    sorting = dendrogram['leaves']

    return sorting


def clustering_linkage_pearson(data, key, method='ward', optimal_ordering=True):
    return clustering_linkage(data, key, dist_func=pearson, square_func=pearson_to_square, method=method, optimal_ordering=optimal_ordering)


cluster_sorting = {}
keys = list(data_to_json['data'].keys())
for k in keys:
    print(f'Start {k}')
    cluster_sorting[f'{k}'] = {
        'ward_euclidean': clustering_linkage(data_to_json['data'], k),
        'ward_pearson': clustering_linkage_pearson(data_to_json['data'], k),
        'complete_euclidean': clustering_linkage(data_to_json['data'], k, method='complete'),
        'complete_pearson': clustering_linkage_pearson(data_to_json['data'], k, method='complete'),
        'ward_euclidean_non_optimal': clustering_linkage(data_to_json['data'], k, optimal_ordering=False),
        'ward_pearson_non_optimal': clustering_linkage_pearson(data_to_json['data'], k, optimal_ordering=False),
    }


data_to_json['cluster_sorting'] = cluster_sorting


##################
# Convert to json file
##################

class NumpyArrayEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

json_data = json.dumps(data_to_json, cls=NumpyArrayEncoder)



with open(f'{dataset.lower()}.json', 'w') as f:
    f.write(json_data)

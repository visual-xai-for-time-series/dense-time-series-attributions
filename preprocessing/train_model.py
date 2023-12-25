#!/usr/bin/env python

import random

import numpy as np
import pandas as pd

from tqdm import tqdm

import torch
import torch.nn as nn

from torch.utils.data import Dataset, DataLoader

from sklearn.preprocessing import OneHotEncoder

from sktime.datasets import load_UCR_UEA_dataset


random_seed = 13

torch.manual_seed(random_seed)
random.seed(random_seed)
np.random.seed(random_seed)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

from models import *


class TimeSeriesDataset(Dataset):

    def __init__(self, X, y):
        self.X = X
        self.y = y

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        inputs = self.X[idx]
        label = self.y[idx]

        return inputs, label


def trainer(model, dataloader_train, criterion, optimizer):
    running_loss = 0

    model.train()

    for idx, (inputs, labels) in enumerate(dataloader_train):
        inputs = inputs.reshape(inputs.shape[0], 1, -1).float().to(device)
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
        inputs = inputs.reshape(inputs.shape[0], 1, -1).float().to(device)
        labels = labels.float().to(device)

        preds = model(inputs)
        loss = criterion(preds, labels.argmax(dim=-1))

        running_loss += loss.item()

    train_loss = running_loss / len(dataloader_train)

    return train_loss


def main():
    parser = argparse.ArgumentParser(description='Train a model for a selected dataset.')

    # Add arguments
    parser.add_argument('--dataset', '-d', type=str, required=True,
                        default='FordA', help='Specify the dataset (e.g., FordA)')
    parser.add_argument('--model', '-m', type=str, required=True, 
                        choices=['cnn', 'resnet'], 
                        help='Specify the model type (choose from: cnn, resnet)')
    parser.add_argument('--epochs', type=int, default=500, 
                        help='Number of training epochs (default: 500)')


    # Parse the arguments
    args = parser.parse_args()

    dataset = args.dataset
    model_type = args.model

    epochs = args.epochs

    X_train, y_train = load_UCR_UEA_dataset(name=dataset, split='train', return_type='numpyflat')
    X_test, y_test = load_UCR_UEA_dataset(name=dataset, split='test', return_type='numpyflat')

    print(f'Length training data: {len(X_train)} labels: {len(y_train)} test data: {len(X_test)} labels: {len(y_test)}')

    encoder = OneHotEncoder(categories='auto', sparse_output=False)

    y_train_ohe = encoder.fit_transform(np.expand_dims(y_train, axis=-1))
    y_test_ohe = encoder.transform(np.expand_dims(y_test, axis=-1))

    y_train_norm = y_train_ohe.argmax(axis=-1)
    y_test_norm = y_test_ohe.argmax(axis=-1)

    labels_nr = len(encoder.categories_[0])

    dataset_train = TimeSeriesDataset(X_train, y_train_ohe)
    dataset_test = TimeSeriesDataset(X_test, y_test_ohe)

    dataloader_train = DataLoader(dataset_train, batch_size=120, shuffle=False)
    dataloader_train_not_shuffled = DataLoader(dataset_train, batch_size=120, shuffle=False)
    dataloader_test = DataLoader(dataset_test, batch_size=120, shuffle=False)

    model = SimpleCNN(labels_nr).to(device)
    if model_type == 'resnet':
        model = ResNet(labels_nr).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    loss = nn.CrossEntropyLoss()

    for epoch in range(epochs):
        train_loss = trainer(model, dataloader_train, loss, optimizer)
        if epoch % 100 == 0:
            print('Val', validator(model, dataloader_test, loss))
    #     print('Train', train_loss)


    model.eval()

    preds = []
    labels = []
    for x in dataloader_train_not_shuffled:
        input_, label_ = x
        input_ = input_.reshape(input_.shape[0], 1, -1)
        input_ = input_.float().to(device)
        label_ = label_.float().to(device)

        pred_ = model(input_)
        preds.extend(pred_)
        labels.extend(label_)

    preds = torch.stack(preds)
    labels = torch.stack(labels)
    accuracy_ = np.round((preds.argmax(dim=-1) == labels.argmax(dim=-1)).int().sum().float().item() / len(preds), 4)
    print(f'Prediction Accuracy for Training: {accuracy_}')

    preds = []
    labels = []
    for x in dataloader_test:
        input_, label_ = x
        input_ = input_.reshape(input_.shape[0], 1, -1)
        input_ = input_.float().to(device)
        label_ = label_.float().to(device)

        pred_ = model(input_)
        preds.extend(pred_)
        labels.extend(label_)

    preds = torch.stack(preds)
    labels = torch.stack(labels)
    accuracy_ = np.round((preds.argmax(dim=-1) == labels.argmax(dim=-1)).int().sum().float().item() / len(preds), 4)
    print(f'Prediction Accuracy for Testing: {accuracy_}')

    torch.save(model, f'./{model_type.lower()}-{dataset.lower()}.pt')


if __name__ == '__main__':
    main()

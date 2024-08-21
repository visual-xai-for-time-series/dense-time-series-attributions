import torch
from torch import nn
import torch.nn.functional as F


class Conv1dSamePadding(nn.Conv1d):
    """Represents the "Same" padding functionality from Tensorflow.
    See: https://github.com/pytorch/pytorch/issues/3867
    Note that the padding argument in the initializer doesn't do anything now
    """
    def forward(self, input):
        kernel, dilation, stride = self.weight.size(2), self.dilation[0], self.stride[0]
        
        l_out = l_in = input.size(2)
    
        padding = (((l_out - 1) * stride) - l_in + (dilation * (kernel - 1)) + 1)
        if padding % 2 != 0:
            input = F.pad(input, [0, 1])

        return F.conv1d(input=input, weight=self.weight, bias=self.bias, stride=stride, padding=padding // 2, dilation=dilation, groups=self.groups)


class ResNetBlock(nn.Module):

    def __init__(self, in_channels, out_channels):
        super().__init__()

        channels = [in_channels, out_channels, out_channels, out_channels]
        kernel_sizes = [5, 3, 1]

        layers = []
        for i in range(len(kernel_sizes)):
            layers += [
                Conv1dSamePadding(in_channels=channels[i], out_channels=channels[i + 1], kernel_size=kernel_sizes[i], stride=1),
                nn.BatchNorm1d(num_features=channels[i + 1]),
                nn.ReLU(),
            ]
        self.layers = nn.Sequential(*layers)

        self.residual = nn.Identity()
        self.match_channels = False
        if in_channels != out_channels:
            self.match_channels = True
            self.residual = nn.Sequential(*[
                Conv1dSamePadding(in_channels=in_channels, out_channels=out_channels, kernel_size=1, stride=1),
                nn.BatchNorm1d(num_features=out_channels)
            ])

    def forward(self, x):
        if self.match_channels:
            return self.layers(x) + self.residual(x)
        return self.layers(x)


class ResNet(nn.Module):
    def __init__(self, num_pred_classes=2):
        super().__init__()
        
        in_channels = 1
        mid_channels = 10
        
        self.layers = nn.Sequential(*[
            ResNetBlock(in_channels=in_channels, out_channels=mid_channels),
            ResNetBlock(in_channels=mid_channels, out_channels=mid_channels * 2),
            ResNetBlock(in_channels=mid_channels * 2, out_channels=mid_channels * 2),

        ])
        self.fc = nn.Sequential(
            nn.Linear(mid_channels * 2, num_pred_classes),
            nn.Softmax(-1)
        )

        
    def forward(self, x):
        x = self.layers(x)
        x = x.mean(dim=-1)
        x = self.fc(x)
        
        return x


class SimpleCNN(nn.Module):
    def __init__(self, num_pred_classes=2):
        super().__init__()
        
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
            nn.Linear(100, num_pred_classes),
            nn.Softmax(-1)
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

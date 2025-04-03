import numpy as np
import json
from PIL import Image

class Linear:
    def __init__(self, in_features, out_features):
        self.in_features = in_features
        self.out_features = out_features
        self.weights = np.random.randn(in_features, out_features) * np.sqrt(2 / in_features)
        self.input = None

    def forward(self, x):
        self.input = x
        return np.dot(x, self.weights)

    def backward(self, grad_output, learning_rate):
        grad_input = np.dot(grad_output, self.weights.T)
        grad_weights = np.dot(self.input.T, grad_output)
        self.weights -= learning_rate * grad_weights
        return grad_input

class Tanh:
    def __init__(self):
        self.output = None

    def forward(self, x):
        self.output = np.tanh(x)
        return self.output

    def backward(self, grad_output):
        return (1 - self.output ** 2) * grad_output

class Dropout:
    def __init__(self, dropout_rate=0.5):
        self.dropout_rate = dropout_rate
        self.mask = None

    def forward(self, x, is_training=True):
        if is_training:
            self.mask = np.random.binomial(1, 1 - self.dropout_rate, size=x.shape)
            return x * self.mask / (1 - self.dropout_rate)
        else:
            return x

    def backward(self, grad_output):
        return grad_output * self.mask / (1 - self.dropout_rate)

class Softmax:
    def __init__(self):
        self.output = None

    def forward(self, x):
        exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        self.output = exp_x / np.sum(exp_x, axis=1, keepdims=True)
        return self.output

    def backward(self, grad_output):
        grad_input = self.output * (grad_output - np.sum(self.output * grad_output, axis=1, keepdims=True))
        return grad_input

import inspect


class Sequential:
    def __init__(self):
        self.layers = []

    def add(self, layer):
        self.layers.append(layer)

    def forward(self, x, is_training=True):
        for layer in self.layers:
            if isinstance(layer, Dropout):
                x = layer.forward(x, is_training)
            else:
                x = layer.forward(x)
        return x

    def backward(self, grad_output, learning_rate):
        for layer in reversed(self.layers):
            if hasattr(layer, 'backward'):
                if 'learning_rate' in inspect.signature(layer.backward).parameters:
                    grad_output = layer.backward(grad_output, learning_rate)
                else:
                    grad_output = layer.backward(grad_output)


def load_weights_from_json(model, filepath):
    with open(filepath, 'r') as f:
        weights_data = json.load(f)
        print(weights_data.keys())

    model.layers[0].weights = np.array(weights_data['weight_1'])
    model.layers[2].weights = np.array(weights_data['weight_2'])
    model.layers[4].weights = np.array(weights_data['weight_3'])

def create_model(path):
    model = Sequential()
    model.add(Linear(in_features=784, out_features=512))
    model.add(Tanh())
    model.add(Dropout(dropout_rate=0.4))
    model.add(Linear(in_features=512, out_features=256))
    model.add(Tanh())
    model.add(Linear(in_features=256, out_features=10))
    model.add(Softmax())
    load_weights_from_json(model, path)
    return model

def preprocess_image(image_array, target_size=(28, 28)):
    image = Image.fromarray(image_array).convert('L')
    image = image.resize(target_size)
    image_array = np.array(image)
    if np.mean(image_array) > 127:
        image_array = 255 - image_array
    image_array = image_array / 255.0
    image_array = image_array.flatten().reshape(1, -1)
    return image_array

def predict(input, path):
    processed_image = preprocess_image(input)
    model = create_model(path)
    output = model.forward(processed_image, is_training=False)
    probabilities = np.exp(output)
    predicted_class = np.argmax(probabilities, axis=1)[0]
    return int(predicted_class)
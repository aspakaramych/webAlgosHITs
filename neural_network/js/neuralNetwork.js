class NeuralNetwork {
    constructor(layers) {
        this.layers = layers;
    }

    forward(input) {
        let output = input;
        for (const layer of this.layers) {
            output = layer.forward(output);
        }
        return output;
    }
}

class DenseLayer {
    constructor(weights, activation = 'relu') {
        this.weights = weights;
        this.activation = activation;
    }

    forward(input) {
        const output = input.map(row => {
            return this.weights[0].map((_, i) => {
                return row.reduce((sum, val, j) => sum + val * this.weights[j][i], 0);
            });
        });

        if (this.activation === 'relu') {
            return output.map(row => row.map(x => Math.max(0, x)));
        } else if (this.activation === 'softmax') {
            return this.softmax(output);
        }
        return output;
    }

    softmax(matrix) {
        return matrix.map(row => {
            const max = Math.max(...row);
            const exps = row.map(x => Math.exp(x - max));
            const sum = exps.reduce((a, b) => a + b, 0);
            return exps.map(x => x / sum);
        });
    }
}


async function loadWeights(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Ошибка при загрузке весов ${response.status}`);
    }
    const data = await response.json();
    console.log('Веса загружены');
    return data;
}

export async function createModel(path) {
    const weights = await loadWeights(path);
    const model = new NeuralNetwork([
        new DenseLayer(weights.layer_0.weights, 'relu'),
        new DenseLayer(weights.layer_3.weights, 'softmax'),
    ]);
    return model;
}
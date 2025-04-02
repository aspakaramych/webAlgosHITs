function dotProduct(matA, matB) {
    const result = [];
    for (let i = 0; i < matA.length; i++) {
        const row = [];
        for (let j = 0; j < matB[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < matA[0].length; k++) {
                sum += matA[i][k] * matB[k][j];
            }
            row.push(sum);
        }
        result.push(row);
    }
    return result;
}

function max(matrix) {
    return matrix.map(row => row.map(x => Math.max(x, 0)));
}

function softmax(matrix) {
    const expMatrix = matrix.map(row => row.map(x => Math.exp(x - Math.max(...row))));
    const sums = expMatrix.map(row => row.reduce((a, b) => a + b, 0));
    return expMatrix.map((row, i) => row.map(x => x / sums[i]));
}

class Linear {
    constructor(weights) {
        this.weights = weights;
    }

    forward(x) {
        return dotProduct(x, this.weights);
    }
}

class ReLU {
    forward(x) {
        return max(x);
    }
}

class Softmax {
    forward(x) {
        return softmax(x);
    }
}

class Sequential {
    constructor() {
        this.layers = [];
    }

    add(layer) {
        this.layers.push(layer);
    }

    forward(x) {
        for (const layer of this.layers) {
            x = layer.forward(x);
            console.log("Layer output:", x);
        }
        return x;
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

    console.log("Layer 1 weights shape:", [weights.layer_1.length, weights.layer_1[0].length]);
    console.log("Layer 2 weights shape:", [weights.layer_2.length, weights.layer_2[0].length]);
    console.log("Layer 3 weights shape:", [weights.layer_3.length, weights.layer_3[0].length]);

    const model = new Sequential();
    model.add(new Linear(weights.layer_1));
    model.add(new ReLU());
    model.add(new Linear(weights.layer_2));
    model.add(new ReLU());
    model.add(new Linear(weights.layer_3));
    model.add(new Softmax());

    return model;
}
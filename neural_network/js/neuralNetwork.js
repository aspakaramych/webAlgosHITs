function mm(data1, data2) {
    if (data1[0].length !== data2.length) {
        throw new Error("Несовместимый размер матриц");
    }
    const rows1 = data1.length;
    const cols2 = data2[0].length;
    const cols1 = data1[0].length;
    let result = new Array(rows1);
    for (let i = 0; i < rows1; i++) {
        result[i] = new Array(cols2).fill(0);
        for (let j = 0; j < cols2; j++) {
            for (let k = 0; k < cols1; k++) {
                result[i][j] += data1[i][k] * data2[k][j];
            }
        }
    }
    return result;
}

class Linear {
    constructor(in_features, out_features, weights) {
        this.in_features = in_features;
        this.out_features = out_features;
        this.weights = weights;
    }

    forward(x) {
        return mm(x, this.weights);
    }
}

class ReLU {
    constructor() {
    }

    forward(x) {
        return x.map(row => row.map(val => Math.max(0, x)));
    }
}

class Softmax {
    constructor() {
    }

    forward(x) {
        const maxValues = x.map(row => Math.max(...row));
        const expX = x.map((row, i) =>
            row.map(val => Math.exp(val - maxValues[i]))
        );

        const sumExpX = expX.map(row => row.reduce((sum, val) => sum + val, 0));

        this.output = expX.map((row, i) =>
            row.map(val => val / sumExpX[i])
        );

        return this.output;
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
        }
        return x;
    }
}

async function loadWeights(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Ошибка при загрузке весов ${response.status}`)
    }
    const data = response.json();
    console.log('Данные загружены')
    return data;
}

export async function createModel(path) {
    const weights = await loadWeights(path);
    let model = new Sequential();
    model.add(new Linear(784, 256, weights.layer_0));
    model.add(new ReLU());
    model.add(new Linear(256, 10, weights.layer_3));
    model.add(new Softmax());
    return model;
}
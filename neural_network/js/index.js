async function loadWeights(filePath) {
    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}


function forwardPass(input, weights) {
    const { weight_0_1, weight_1_2 } = weights;

    const layer_1 = weight_0_1.map(row => {
        const dotProduct = row.reduce((sum, weight, idx) => sum + weight * input[idx], 0);
        return Math.tanh(dotProduct); // Активация tanh
    });

    const layer_2 = weight_1_2.map(row => {
        const dotProduct = row.reduce((sum, weight, idx) => sum + weight * layer_1[idx], 0);
        return dotProduct;
    });
    const exp = layer_2.map(val => Math.exp(val));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(val => val / sum);
}

function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';

    let isDrawing = false;

    canvas.addEventListener('mousedown', (event) => {
        isDrawing = true;
        drawPixel(canvas, event);
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!isDrawing) return;
        drawPixel(canvas, event);
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
}

function drawPixel(canvas, event) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    ctx.fillRect(x, y, 1, 1);
}

function preprocessImage(canvas) {
    const ctx = canvas.getContext('2d');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const tensorData = new Float32Array(50 * 50);
    for (let i = 0; i < imageData.data.length; i += 4) {
        tensorData[Math.floor(i / 4)] = 1 - imageData.data[i] / 255.0;
    }

    const resizedData = resizeData(tensorData, 50, 50, 28, 28);

    return resizedData;
}

function resizeData(data, oldWidth, oldHeight, newWidth, newHeight) {
    const newData = new Float32Array(newWidth * newHeight);
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const oldX = Math.floor((x / newWidth) * oldWidth);
            const oldY = Math.floor((y / newHeight) * oldHeight);
            newData[y * newWidth + x] = data[oldY * oldWidth + oldX];
        }
    }
    return newData;
}

async function predictDigit(canvas, weightsFilePath) {

    try {
        const weights = await loadWeights(weightsFilePath)

        const input = preprocessImage(canvas);

        const output = forwardPass(input, weights);

        const predictedClass = output.indexOf(Math.max(...output));

        const resultElement = document.getElementById('Result');
        if (resultElement) {
            resultElement.textContent = `Результат: ${predictedClass}`;
        } else {
            console.error('Result element not found!');
        }

        console.log(`Predicted class: ${predictedClass}`);
        return predictedClass;
    } catch (error) {
        console.error('Error during prediction:', error);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('myCanvas');
    const submitButton = document.getElementById('submitButton');

    if (!canvas || !submitButton) {
        console.error('Canvas or Submit button not found!');
        return;
    }

    setupCanvas(canvas);

    submitButton.addEventListener('click', () => {
        predictDigit(canvas, '../neural_network/neural_network/weights/weights.json');
    });
});
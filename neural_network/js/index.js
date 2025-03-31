import {createModel} from "./neuralNetwork.js";

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
    const pixels = imageData.data;

    const grayscale = [];
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayscale.push(gray / 255);
    }

    const resizedData = resizeData(grayscale, canvas.width, canvas.height, 28, 28);


    const input = [resizedData];
    return input;
}

function resizeData(data, oldWidth, oldHeight, newWidth, newHeight) {
    const newData = new Array(newWidth * newHeight);

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const oldX = Math.min(Math.floor((x / newWidth) * oldWidth), oldWidth - 1);
            const oldY = Math.min(Math.floor((y / newHeight) * oldHeight), oldHeight - 1);
            newData[y * newWidth + x] = data[oldY * oldWidth + oldX];
        }
    }

    return newData;
}

async function predict(canvas, path) {
    const model = await createModel(path);
    const input = preprocessImage(canvas);
    const output = model.forward(input);
    const predictedClass = output[0].indexOf(Math.max(...output[0]));
    console.log(predictedClass);
    const resultElement = document.getElementById('Result');
    resultElement.textContent = `Результат: ${predictedClass}`;
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
        predict(canvas, '../neural_network/neural_network/weights/weights.json');
    });
});
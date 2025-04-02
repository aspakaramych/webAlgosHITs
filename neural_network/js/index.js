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
    const data = imageData.data;

    const resized = Array.from({ length: 28 }, () => Array(28).fill(0));

    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            const pixelIndex = (y * 50 + x) * 4;
            const gray = data[pixelIndex] / 255;

            const newX = Math.floor((x / 50) * 28);
            const newY = Math.floor((y / 50) * 28);

            resized[newY][newX] += gray;
        }
    }


    const maxValue = Math.max(...resized.flat());
    return resized.map(row => row.map(val => val / maxValue));
}

async function predict(canvas, path) {
    const model = await createModel(path);
    const input = preprocessImage(canvas);

    const flatInput = [input.flat()];

    const output = model.forward(flatInput);
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
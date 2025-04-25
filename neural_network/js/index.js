import {setupCanvas, canvasToArray, isCanvasEmpty} from "./canvasFunc.js";

async function predict(input) {
    console.log(input);
    const response = await fetch("http://82.202.143.120:5000/predict", {
        method: "POST",
        body: JSON.stringify({
            'data': input
        })
    });
    if (response.ok) {
        return await response.json();
    } else {
        console.log(response);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('myCanvas');
    const submitButton = document.getElementById('submitButton');
    const resetButton = document.getElementById('resetButton');
    const errorModal = document.getElementById('error-modal');
    const errorText = document.getElementById('error-text');
    const closeErrorModal = document.getElementById('close-error-modal');
    const parentContainer = document.getElementById('parent-container');
    const result = document.getElementById('result');
    const resultText = result.textContent;
    let input = [];

    if (!canvas || !submitButton) {
        console.error('Canvas or Submit button not found!');
        return;
    }
    setupCanvas(canvas);
    submitButton.addEventListener('click', async () => {
        if (isCanvasEmpty(canvas)) {
            errorText.textContent = "Вы не нарисовали ничего на холсте!";
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
        } else {
            input = canvasToArray(canvas);
            const predictedClass = await predict(input);
            result.textContent = resultText + " " + predictedClass;
        }
    });

    resetButton.addEventListener('click', () => {
        input = []
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        result.textContent = resultText;

    });
    closeErrorModal.addEventListener('click', () => {
        errorModal.style.display = 'none';
        parentContainer.classList.remove('blur');
    });
});
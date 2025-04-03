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

function canvasToArray(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return Array.from(imageData.data);
}

async function predict(canvas) {
    const input = canvasToArray(canvas);
    console.log(input);
    const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: JSON.stringify({
            'data': input
        })
    });
    if (response.ok) {
        const predictedClass = await response.json();

        const resultElement = document.getElementById('Result');
        resultElement.textContent = `Результат: ${predictedClass}`;
    }
    else{
        console.log(response);
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
        predict(canvas);
    });
});
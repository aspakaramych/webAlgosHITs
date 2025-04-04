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

function isCanvasEmpty(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] !== 255 || imageData[i + 1] !== 255 || imageData[i + 2] !== 255) {
            return false;
        }
    }
    return true;
}

async function predict(input) {
    console.log(input);
    const response = await fetch("http://localhost:80/predict", {
        method: "POST",
        body: JSON.stringify({
            'data': input
        })
    });
    if (response.ok) {
        const predictedClass = await response.json();

        const resultElement = document.getElementById('result');
        resultElement.textContent = `${predictedClass}`;
    } else {
        console.log(response);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('myCanvas');
    const submitButton = document.getElementById('submitButton');
    const resetButtom = document.getElementById('resetButton');
    const errorModal = document.getElementById('error-modal');
    const closeErrorModal = document.getElementById('close-error-modal');
    const parentContainer = document.getElementById('parent-container');
    const result = document.getElementById('result');
    let input = [];

    if (!canvas || !submitButton) {
        console.error('Canvas or Submit button not found!');
        return;
    }

    setupCanvas(canvas);


    submitButton.addEventListener('click', async () => {
        if (isCanvasEmpty(canvas)) {
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
        } else {
            input = canvasToArray(canvas);
            await predict(input);
        }
    });

    resetButtom.addEventListener('click', () => {
        input = []
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        result.textContent = "";

    });
    closeErrorModal.addEventListener('click', () => {
        errorModal.style.display = 'none';
        parentContainer.classList.remove('blur');
    });
});
function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';

    let isDrawing = false;

    canvas.addEventListener('mousedown', (event) => {
        isDrawing = true;
        drawSpray(canvas, event);
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!isDrawing) return;
        drawSpray(canvas, event);
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
}

function drawSpray(canvas, event) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    const sprayRadius = 2;
    const density = 7;

    for (let i = 0; i < density; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.sqrt(Math.random()) * sprayRadius;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
}

function canvasToArray(canvas) {
    const resizedCanvas = document.getElementById("resizedCanvas");
    const ctxResized = resizedCanvas.getContext('2d');
    ctxResized.drawImage(canvas, 0, 0, 50, 50, 0, 0, 28, 28);

    const imageData = ctxResized.getImageData(0, 0, 28, 28);

    const grayscaleData = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        const grayscale = (r + g + b) / 3;
        grayscaleData.push(grayscale);
    }

    return grayscaleData;
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
    const resetButtom = document.getElementById('resetButton');
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

    resetButtom.addEventListener('click', () => {
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
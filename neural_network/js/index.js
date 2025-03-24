let session;

async function loadModel() {
    try {
        // Загружаем ONNX-модель
        session = await ort.InferenceSession.create('./nn/model.onnx');
        console.log('ONNX модель загружена');
    } catch (error) {
        console.error('Ошибка загрузки модели:', error);
    }
}

function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; // Фон белый
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Очищаем canvas
    ctx.fillStyle = 'black'; // Рисуем черным цветом

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

    // Рисуем пиксель
    ctx.fillRect(x, y, 1, 1);
}

function preprocessImage(canvas) {
    const ctx = canvas.getContext('2d');

    // Получаем изображение с canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Преобразуем изображение в массив данных
    const tensorData = new Float32Array(50 * 50);
    for (let i = 0; i < imageData.data.length; i += 4) {
        // Берем только красный канал (grayscale)
        tensorData[Math.floor(i / 4)] = 1 - imageData.data[i] / 255.0; // Инвертируем цвета
    }

    // Масштабируем изображение до 28x28
    const resizedData = resizeTensor(tensorData, 50, 50, 28, 28);

    // Добавляем размерность для батча и каналов
    const inputTensor = new ort.Tensor('float32', resizedData, [1, 28, 28]);
    console.log('Форма тензора:', inputTensor.dims);
    return inputTensor;
}

function resizeTensor(data, oldWidth, oldHeight, newWidth, newHeight) {
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

async function predictDigit(canvas) {
    if (!session) {
        console.error('Модель не загружена');
        return;
    }

    // Подготавливаем изображение
    const inputTensor = preprocessImage(canvas);

    // Получаем предсказание
    const outputs = await session.run({ input: inputTensor });
    const outputTensor = outputs.output.data;
    const predictedClass = Array.from(outputTensor).indexOf(Math.max(...outputTensor));

    // Обновляем результат на странице
    const resultElement = document.getElementById('Result');
    if (resultElement) {
        resultElement.textContent = `Результат: ${predictedClass}`;
    } else {
        console.error('Result element not found!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('myCanvas');
    const submitButton = document.getElementById('submitButton');

    if (!canvas || !submitButton) {
        console.error('Canvas or Submit button not found!');
        return;
    }

    // Настройка canvas
    setupCanvas(canvas);

    // Загрузка модели
    loadModel();

    // Обработка нажатия кнопки "Submit"
    submitButton.addEventListener('click', () => {
        predictDigit(canvas);
    });
});
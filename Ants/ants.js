import {
    drawRect,
    generateColony,
    updatePixel,
    correctPos,
    delay
} from './help.js'

let canvasHeight = 100;
let canvasWidth = 100;

let cnt_ants = 1000;

let d = [[-1, 0], [0, -1], [1, 0], [0, 1]];

let coef_transpire = 0.001;

let alpha = 4;
let beta = 2;

document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('table');
    let ctx = canvas.getContext('2d');
    let startButton = document.getElementById('startButton');
    let foodButton = document.getElementById('foodButton');

    let mode = 'colony';
    let colony = [];
    let matrix = Array.from({ length: canvasHeight }, () =>
        Array.from({ length: canvasWidth }, () => ({
            pheromones_food: 0,
            pheromones_home: 0,
            food: 0,
            ants: 0,
            colony: false
        }))
    );
    let ants = [];
    let pheromonesHome = {};
    let pheromonesFood = {};

    canvas.addEventListener('click', (event) => {
        if (mode === 'colony') addColony(event);
        if (mode === 'food') addFood(event);
    })

    foodButton.addEventListener('click', () => {
        mode = 'food';
    })

    startButton.addEventListener('click', () => {
        if (colony.length === 0) return;
        ants = generateColony(colony, cnt_ants);
        matrix[colony[0]][colony[1]].ants = cnt_ants;
        ants_algorithm();
    })

    function addColony(event) {
        if (colony.length > 0) {
            return;
        }
        const x = event.offsetX;
        const y = event.offsetY;
        let colony_size = 1;
        let ch = Math.ceil(colony_size / 2);

        if (
            x >= colony_size / 2  && x + colony_size / 2 <= canvasWidth &&
            y >= colony_size / 2 && y + colony_size / 2 <= canvasHeight
        ) {
            drawRect(ctx, x, y, 'orange', colony_size);
            for (let dy = -ch; dy < ch; dy++) {
                for (let dx = -ch; dx < ch; dx++) {
                    const currentX = x + dx;
                    const currentY = y + dy;
                    matrix[currentX][currentY].colony = true;
                }
            }
            colony.push(x);
            colony.push(y);
        }
    }

    function addFood(event) {
        const foodWidth = 1;
        const foodHeight = 1;
        let ch = Math.ceil(foodWidth / 2);

        const x = event.offsetX;
        const y = event.offsetY;

        const nutrition = 100;

        if (
            x >= foodWidth / 2  && x + foodWidth / 2 <= canvasWidth &&
            y >= foodHeight / 2 && y + foodHeight / 2 <= canvasHeight
        ) {
            drawRect(ctx, x, y, 'green', foodWidth);
            for (let dy = -ch; dy < ch; dy++) {
                for (let dx =  - ch; dx < ch; dx++) {
                    const currentX = x + dx;
                    const currentY = y + dy;
                    matrix[currentX][currentY].food = nutrition;
                }
            }
        }
    }

    function isFood(x, y) {
        return matrix[x][y].food > 0;
    }

    function isColony(x, y) {
        return matrix[x][y].colony;
    }

    function nextCeil(ant) {
        let probabilities = [];
        let total = 0;
        for (let i = 0; i < d.length; i++) {
            let newX = ant.x + d[i][0];
            let newY = ant.y + d[i][1];

            if (newX >= 0 && newX < canvasWidth && newY >= 0 && newY < canvasHeight) {
                let pheromones = 0;
                let heuristic = 0;

                if (ant.memory.some(step => step.x === newX && step.y === newY)) {
                    continue;
                }

                if (ant.state === 'search') {
                    pheromones = matrix[newX][newY].pheromones_food;
                } else if (ant.state === 'food') {
                    pheromones = matrix[newX][newY].pheromones_home;
                }

                heuristic = 1 / (Math.abs(newX - colony[0]) + Math.abs(newY - colony[1]) + 1);

                let probability = Math.pow(pheromones, alpha) * Math.pow(heuristic, beta);
                probabilities.push({ direction: i, value: probability });
                total += probability;
            }
        }

        if (total === 0) {
            return Math.floor(Math.random() * d.length);
        }

        let cumulativeProbability = 0;
        let randomValue = Math.random();

        for (let i = 0; i < probabilities.length; i++) {
            probabilities[i].value /= total; // Нормализация
            cumulativeProbability += probabilities[i].value;

            if (randomValue < cumulativeProbability) {
                return probabilities[i].direction;
            }
        }

        return Math.floor(Math.random() * d.length);
    }

    function updatePos() {
        for (let i = 0; i < cnt_ants; i++) {
            let path = nextCeil(ants[i]);

            matrix[ants[i].x][ants[i].y].ants--;
            if (ants[i].state === 'search') leavePheromoneHome(ants[i]);
            else if (ants[i].state === 'food') leavePheromoneFood(ants[i]);
            updatePixel(ctx, matrix, ants[i].x, ants[i].y);

            let cord = correctPos(canvasHeight, canvasWidth, ants[i].x, ants[i].y, d[path]);
            ants[i].x = cord[0];
            ants[i].y = cord[1];

            // Добавляем текущую клетку в память
            ants[i].memory.push({ x: ants[i].x, y: ants[i].y });

            // Ограничиваем длину памяти (например, до 10 шагов)
            if (ants[i].memory.length > 10) {
                ants[i].memory.shift(); // Удаляем старые шаги
            }

            if (isFood(ants[i].x, ants[i].y)) {
                ants[i].nutrition = matrix[ants[i].x][ants[i].y].food;
                ants[i].state = 'food';
            }
            if (isColony(ants[i].x, ants[i].y))
            {
                ants[i].nutrition = 100;
                ants[i].state = 'search';
            }

            matrix[ants[i].x][ants[i].y].ants++;
            updatePixel(ctx, matrix, ants[i].x, ants[i].y);
        }
    }

    function transpirePheromones() {
        for (const cord in pheromonesHome) {
            pheromonesHome[cord].pheromones = pheromonesHome[cord].pheromones;
            matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = pheromonesHome[cord].pheromones;
            updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
            if (pheromonesHome[cord].pheromones <= 0) {
                matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = 0;
                updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
                delete pheromonesHome[cord];
            }
        }
        for (const cord in pheromonesFood) {
            pheromonesFood[cord].pheromones = pheromonesFood[cord].pheromones * (1 - 0.05);
            matrix[pheromonesFood[cord].x][pheromonesFood[cord].y].pheromones_food = pheromonesFood[cord].pheromones;
            updatePixel(ctx, matrix, pheromonesFood[cord].x, pheromonesFood[cord].y);
            if (pheromonesFood[cord].pheromones <= 0) {
                matrix[pheromonesFood[cord].x][pheromonesFood[cord].y].pheromones_food = 0;
                updatePixel(ctx, matrix, pheromonesFood[cord].x, pheromonesFood[cord].y);
                delete pheromonesFood[cord];
            }
        }
    }

    function leavePheromoneHome(ant) {
        let x = ant.x, y = ant.y, pheromones = ant.nutrition;
        const key = `${x},${y}`;
        if (matrix[x][y].pheromones_home === 0) pheromonesHome[key] = {pheromones, x, y};
        else pheromonesHome[key].pheromones += pheromones;
        ant.nutrition = (1 - 0.01) * ant.nutrition;
        matrix[x][y].pheromones_home += pheromones;
    }

    function leavePheromoneFood(ant) {
        let x = ant.x, y = ant.y, pheromones = ant.nutrition;
        const key = `${x},${y}`;
        if (matrix[x][y].pheromones_food === 0) pheromonesFood[key] = {pheromones, x, y};
        else pheromonesFood[key].pheromones += pheromones;
        ant.nutrition = (1 - 0.001) * ant.nutrition;
        matrix[x][y].pheromones_food += pheromones;
    }

    async function ants_algorithm() {
        while (true) {
            updatePos();
            transpirePheromones();
            await delay(1);
        }
    }
})
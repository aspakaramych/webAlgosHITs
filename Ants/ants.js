import {colors, correctPos, delay, drawRect, generateColony, updatePixel} from './help.js'

let canvasHeight = 100;
let canvasWidth = 100;

let cnt_ants = 1000;

let d = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -1], [1, -1], [1, 1], [-1, 1]];

let coef_transpire = 0.001;

let alpha = 5;
let beta = 1;

document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('table');
    let ctx = canvas.getContext('2d');
    let startButton = document.getElementById('startButton');
    let foodButton = document.getElementById('foodButton');
    let obstacleButton = document.getElementById('obstacleButton');

    let mode = 'colony';
    let isDrawingObstacle = false;
    let colony = [];
    let matrix = Array.from({ length: canvasHeight }, () =>
        Array.from({ length: canvasWidth }, () => ({
            pheromones_food: 0,
            pheromones_home: 0,
            food: 0,
            ants: 0,
            colony: false,
            obstacle: false
        }))
    );
    let ants = [];
    let pheromonesHome = {};
    let pheromonesFood = {};

    canvas.addEventListener('click', (event) => {
        if (mode === 'colony') addColony(event);
        if (mode === 'food') addFood(event);
        if (mode === 'obstacle') addObstacle(event);
    })

    foodButton.addEventListener('click', () => {
        mode = 'food';
    })

    obstacleButton.addEventListener('click', () => {
        mode = 'obstacle';
    })

    canvas.addEventListener('mousedown', (event) => {
        if (mode === 'obstacle') {
            isDrawingObstacle = true;
            addObstacle(event);
        }
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDrawingObstacle && mode === 'obstacle') {
            addObstacle(event);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDrawingObstacle = false; // Остановить рисование при отпускании кнопки мыши
    });

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
        let scaleX = canvas.width / canvas.clientWidth;
        let scaleY = canvas.height / canvas.clientHeight;

        let x = Math.floor(event.offsetX * scaleX);
        let y = Math.floor(event.offsetY * scaleY);
        let colony_size = 4;
        let ch = 2;

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

        console.log(x, y);
    }

    function addFood(event) {
        const foodWidth = 2;
        const foodHeight = 2;
        let ch = Math.ceil(foodWidth / 2);

        let scaleX = canvas.width / canvas.clientWidth;
        let scaleY = canvas.height / canvas.clientHeight;

        let x = Math.floor(event.offsetX * scaleX);
        let y = Math.floor(event.offsetY * scaleY);

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

    function addObstacle(event) {
        let scaleX = canvas.width / canvas.clientWidth;
        let scaleY = canvas.height / canvas.clientHeight;

        let x = Math.floor(event.offsetX * scaleX);
        let y = Math.floor(event.offsetY * scaleY);

        let ch = 1;

        if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
            drawRect(ctx, x, y, 'gray', 1);
            for (let dy = -ch; dy < ch; dy++) {
                for (let dx =  - ch; dx < ch; dx++) {
                    const currentX = x + dx;
                    const currentY = y + dy;
                    updatePixel(ctx, matrix, x, y);
                    matrix[currentX][currentY].obstacle = true;
                }
            }
        }
    }

    function isFood(x, y) {
        return matrix[x][y].food > 0;
    }

    function isColony(x, y) {
        return x === colony[0] && y === colony[1];
    }

    function calculateAngleHeuristic(ant, newX, newY) {
        let currentDirection = [newX - ant.x, newY - ant.y];
        let targetDirection = [colony[0] - ant.x, colony[1] - ant.y];

        let dotProduct = currentDirection[0] * targetDirection[0] + currentDirection[1] * targetDirection[1];
        let magnitudeCurrent = Math.sqrt(currentDirection[0] * currentDirection[0] + currentDirection[1] * currentDirection[1]);
        let magnitudeTarget = Math.sqrt(targetDirection[0] * targetDirection[0] + targetDirection[1] * targetDirection[1]);

        let cosineAngle = dotProduct / (magnitudeCurrent * magnitudeTarget);

        return Math.max(cosineAngle, 0);
    }

    function nextCeil(ant) {
        let probabilities = Array.from({ length: 8 }, () => ({
            direction: 0,
            value: 0
        }));
        let total = 0;
        for (let i = 0; i < d.length; i++) {
            let newX = ant.x + d[i][0];
            let newY = ant.y + d[i][1];

            if (newX >= 0 && newX < canvasWidth && newY >= 0 && newY < canvasHeight && !matrix[newX][newY].obstacle) {
                let pheromones = 0;
                let heuristic = 0;

                if (ant.memory.some(step => step.x === newX && step.y === newY)) {
                    continue;
                }

                if (ant.state === 'search') {
                    pheromones = matrix[newX][newY].pheromones_food;
                    ant.steps += 1;
                    heuristic = 1;
                } else if (ant.state === 'food') {
                    pheromones = matrix[newX][newY].pheromones_home;
                    ant.steps += 1;
                    // let distanceToColony = Math.abs(newX - colony[0]) + Math.abs(newY - colony[1]);
                    // heuristic = 1 / (distanceToColony + 1);
                    //
                    // let angleHeuristic = calculateAngleHeuristic(ant, newX, newY);
                    // heuristic *= angleHeuristic;
                    heuristic = 1;
                }

                let probability = Math.pow(pheromones, alpha) * Math.pow(heuristic, beta);
                probabilities[i] = { direction: i, value: probability };
                total += probability;
            }
        }

        if (total === 0) {
            let availableDirections = [];
            for (let i = 0; i < d.length; i++) {
                let newX = ant.x + d[i][0];
                let newY = ant.y + d[i][1];

                if (newX >= 0 && newX < canvasWidth && newY >= 0 && newY < canvasHeight && !matrix[newX][newY].obstacle) {
                    availableDirections.push(i);
                }
            }

            if (availableDirections.length > 0) {
                return availableDirections[Math.floor(Math.random() * availableDirections.length)];
            }

            return -1;
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

            ants[i].memory.push({ x: ants[i].x, y: ants[i].y });

            if (ants[i].memory.length > 20) {
                ants[i].memory.shift();
            }

            if (isFood(ants[i].x, ants[i].y)) {
                ants[i].nutrition = matrix[ants[i].x][ants[i].y].food;
                ants[i].state = 'food';
                ants[i].memory = [];
                ants[i].steps = 1;
            }
            if (isColony(ants[i].x, ants[i].y))
            {
                ants[i].nutrition = 100;
                ants[i].state = 'search';
                ants[i].memory = [];
                ants[i].steps = 1;
            }

            matrix[ants[i].x][ants[i].y].ants++;
            updatePixel(ctx, matrix, ants[i].x, ants[i].y);
        }
    }

    function transpirePheromones() {
        // for (const cord in pheromonesHome) {
        //     pheromonesHome[cord].pheromones = pheromonesHome[cord].pheromones * (1 - 0.001);
        //     matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = pheromonesHome[cord].pheromones;
        //     updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
        //     if (pheromonesHome[cord].pheromones <= 0) {
        //         matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = 0;
        //         updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
        //         delete pheromonesHome[cord];
        //     }
        // }
        for (const cord in pheromonesFood) {
            pheromonesFood[cord].pheromones = pheromonesFood[cord].pheromones * (1 - 0.01);
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
        ant.nutrition = 100 / ant.steps;
        matrix[x][y].pheromones_home += pheromones;
    }

    function leavePheromoneFood(ant) {
        let x = ant.x, y = ant.y, pheromones = ant.nutrition / ant.steps;
        const key = `${x},${y}`;
        if (matrix[x][y].pheromones_food === 0) pheromonesFood[key] = {pheromones, x, y};
        else pheromonesFood[key].pheromones += pheromones;
        matrix[x][y].pheromones_food = Math.max(pheromones, matrix[x][y].pheromones_food);
    }

    async function ants_algorithm() {
        while (true) {
            updatePos();
            transpirePheromones();
            await delay(1);
        }
    }
})
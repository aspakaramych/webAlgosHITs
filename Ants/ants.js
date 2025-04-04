import {
    drawRect,
    generateColony,
    updatePixel,
    correctPos,
    delay
} from './help.js'

let canvasHeight = 200;
let canvasWidth = 200;

let cnt_ants = 1000;

let d = [[-1, 0], [0, -1], [1, 0], [0, 1]];

let pheromones_step = 1;
let coef_transpire = 0.01;

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
        let colony_size = 20;

        if (
            x >= colony_size / 2  && x + colony_size / 2 <= canvasWidth &&
            y >= colony_size / 2 && y + colony_size / 2 <= canvasHeight
        ) {
            drawRect(ctx, x, y, 'orange', colony_size);
            for (let dy = -colony_size / 2; dy < colony_size / 2; dy++) {
                for (let dx = -colony_size / 2; dx < colony_size / 2; dx++) {
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
        const foodWidth = 10;
        const foodHeight = 10;

        const x = event.offsetX;
        const y = event.offsetY;

        const nutrition = 100;

        if (
            x >= foodWidth / 2  && x + foodWidth / 2 <= canvasWidth &&
            y >= foodHeight / 2 && y + foodHeight / 2 <= canvasHeight
        ) {
            drawRect(ctx, x, y, 'green', foodWidth);
            for (let dy = -foodHeight / 2; dy < foodHeight / 2; dy++) {
                for (let dx =  - foodWidth / 2; dx < foodWidth / 2; dx++) {
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

    function nextCeil(ant) {
        let probability = [1, 1, 1, 1];
        let cnt = 0;
        if (ant.state === 'search') {
            for (let i = 0; i < d.length; i++) {
                probability[i] += matrix[ant.x][ant.y].pheromones_food;
                cnt += probability[i];
            }
        }
        else if (ant.state === 'food') {
            for (let i = 0; i < d.length; i++) {
                probability[i] +=  matrix[ant.x][ant.y].pheromones_food;
                cnt += probability[i];
            }
        }
        let path = Math.floor(Math.random() * cnt);
        let sum = 0;
        for (let i = 0; i < d.length; i++) {
            sum += probability[i];
            if (Math.abs(sum) > Math.abs(path)) return i;
        }
        return Math.floor(Math.random() * 3.99);
    }

    function updatePos() {
        for (let i = 0; i < cnt_ants; i++) {
            let path = nextCeil(ants[i]);

            matrix[ants[i].x][ants[i].y].ants--;
            if (ants[i].state === 'search') leavePheromoneHome(ants[i].x, ants[i].y);
            else if (ants[i].state === 'food') leavePheromoneFood(ants[i].x, ants[i].y);
            updatePixel(ctx, matrix, ants[i].x, ants[i].y);

            let cord = correctPos(canvasHeight, canvasWidth, ants[i].x, ants[i].y, d[path]);
            ants[i].x = cord[0];
            ants[i].y = cord[1];

            if (isFood(ants[i].x, ants[i].y)) ants[i].state = 'food';

            matrix[ants[i].x][ants[i].y].ants++;
            updatePixel(ctx, matrix, ants[i].x, ants[i].y);
        }
    }

    function transpirePheromones() {
        for (const cord in pheromonesHome) {
            pheromonesHome[cord].pheromones_step = pheromonesHome[cord].pheromones_step - pheromones_step * coef_transpire;
            matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = pheromonesHome[cord].pheromones_step;
            updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
            if (pheromonesHome[cord] <= 0) {
                delete pheromonesHome[cord];
                matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = 0;
                updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
            }
        }
        for (const cord in pheromonesFood) {
            pheromonesFood[cord].pheromones_step = pheromonesFood[cord].pheromones_step - pheromones_step * coef_transpire;
            matrix[pheromonesFood[cord].x][pheromonesFood[cord].y].pheromones_food = pheromonesFood[cord].pheromones_step;
            updatePixel(ctx, matrix, pheromonesFood[cord].x, pheromonesFood[cord].y);
            if (pheromonesFood[cord] <= 0) {
                delete pheromonesFood[cord];
                matrix[pheromonesFood[cord].x][pheromonesFood[cord].y].pheromones_food = 0;
                updatePixel(ctx, matrix, pheromonesFood[cord].x, pheromonesFood[cord].y);
            }
        }
    }

    function leavePheromoneHome(x, y) {
        const key = `${x},${y}`;
        if (matrix[x][y].pheromones_home === 0) pheromonesHome[key] = {pheromones_step, x, y};
        else pheromonesHome[key].pheromones_step += pheromones_step;
        matrix[x][y].pheromones_home++;
    }

    function leavePheromoneFood(x, y) {
        const key = `${x},${y}`;
        if (matrix[x][y].pheromones_food === 0) pheromonesFood[key] = {pheromones_step, x, y};
        else pheromonesFood[key].pheromones_step += pheromones_step;
        matrix[x][y].pheromones_food++;
    }

    async function ants_algorithm() {
        while (true) {
            updatePos();
            transpirePheromones();
            await delay(1);
        }
    }

})
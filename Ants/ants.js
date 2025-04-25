import {correctPos, delay, drawRect, generateColony, updatePixel} from './help.js'
import {generatePerlinMaze} from './Maze.js'

let canvasHeight = 100;
let canvasWidth = 100;

let cnt_ants = 500;

let d = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -1], [1, -1], [1, 1], [-1, 1]];

let coef_transpire = 0.001;

let alpha = 6;
let beta = 7;

let foodZones = [];

let MAX_STEPS = 1000000;

document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('table');
    let ctx = canvas.getContext('2d');
    let startButton = document.getElementById('startButton');
    let foodButton = document.getElementById('foodButton');
    let clearButton = document.getElementById('clearButton');
    let obstacleButton = document.getElementById('obstacleButton');
    let colonyButton = document.getElementById('colonyButton');
    const errorModal = document.getElementById('error-modal');
    const closeErrorModal = document.getElementById('close-error-modal');
    const parentContainer = document.getElementById('parent-container');
    let generateMazeButton = document.getElementById('generateMazeButton');
    let cleanButton = document.getElementById('cleanButton');
    const slider = document.getElementById('alpha');
    const sliderValue = document.getElementById('labelInput');
    const counter_ants = document.getElementById('counter');
    counter_ants.value = 500;

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

    function deactivateButtons() {
        colonyButton.style.background = 'lightgray';
        foodButton.style.background = 'lightgray';
        obstacleButton.style.background = 'lightgray';
        cleanButton.style.background = 'lightgray';
    }

    slider.addEventListener('input', () => {
        sliderValue.textContent = slider.value;
        alpha = slider.value;
    });

    canvas.addEventListener('click', (event) => {
        if (mode === 'colony') addColony(event);
        if (mode === 'food') addFood(event);
        if (mode === 'obstacle') addObstacle(event);
        if (mode === 'clean') cleanCanvas(event);
    })

    colonyButton.addEventListener('click', () => {
        mode = 'colony';
        deactivateButtons();
        colonyButton.style.background = 'springgreen';
    })

    foodButton.addEventListener('click', () => {
        mode = 'food';
        deactivateButtons();
        foodButton.style.background = 'springgreen';
    })

    obstacleButton.addEventListener('click', () => {
        mode = 'obstacle';
        deactivateButtons();
        obstacleButton.style.background = 'springgreen';
    })

    canvas.addEventListener('mousedown', (event) => {
        if (mode === 'obstacle') {
            isDrawingObstacle = true;
            addObstacle(event);
        }
        if (mode === 'clean') {
            isDrawingObstacle = true;
            cleanCanvas(event);
        }
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDrawingObstacle && mode === 'obstacle') {
            addObstacle(event);
        }
        if (isDrawingObstacle && mode === 'clean') {
            cleanCanvas(event);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDrawingObstacle = false; // Остановить рисование при отпускании кнопки мыши
    });

    startButton.addEventListener('click', () => {
        if (colony.length === 0) {
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
        } else if (ants.length === 0) {
            cnt_ants = parseInt(counter_ants.value);
            ants = generateColony(colony, cnt_ants);
            matrix[colony[0]][colony[1]].ants = cnt_ants;
            ants_algorithm();
        } else if (ants.length > 0) {
            for (let i = 0; i < ants.length; i++) {
                matrix[ants[i].x][ants[i].y].ants = 0;
            }
            ants = [];
            setTimeout(() => {
                console.log("Новый запуск");
            }, 2000);
            for (let i = 0; i < canvasHeight; i++) {
                for (let j = 0; j < canvasWidth; j++) {
                    matrix[i][j].pheromones_home = 0;
                    matrix[i][j].pheromones_food = 0;
                    updatePixel(ctx, matrix, i, j);
                }
            }
            pheromonesHome = {};
            pheromonesFood = {};
            cnt_ants = parseInt(counter_ants.value);
            ants = generateColony(colony, cnt_ants);
            matrix[colony[0]][colony[1]].ants = cnt_ants;
            ants_algorithm();
        }
    })

    generateMazeButton.addEventListener('click', () => {
        clearCanvas();
        const maze = generatePerlinMaze(canvasHeight, canvasWidth, 10, 0.15);
        for (let i = 0; i < maze.length; i++) {
            for (let j = 0; j < maze[i].length; j++) {
                matrix[i][j].obstacle = maze[i][j];
                updatePixel(ctx, matrix, i, j);
            }
        }
    })

    cleanButton.addEventListener('click', () => {
        mode = 'clean';
        deactivateButtons();
        cleanButton.style.background = 'springgreen';
    })

    closeErrorModal.addEventListener('click', () => {
        errorModal.style.display = 'none';
        parentContainer.classList.remove('blur');
    });

    let activeInputField = null;
    canvas.addEventListener('mousemove', (event) => {
        let scaleX = canvas.width / canvas.clientWidth;
        let scaleY = canvas.height / canvas.clientHeight;
        let x = Math.floor(event.offsetX * scaleX);
        let y = Math.floor(event.offsetY * scaleY);

        let isFoodZone = foodZones.find(zone => {
            return (
                x >= zone.centerX - zone.width / 2 &&
                x < zone.centerX + zone.width / 2 &&
                y >= zone.centerY - zone.height / 2 &&
                y < zone.centerY + zone.height / 2
            );
        });

        if (isFoodZone) {
            if (activeInputField) {
                activeInputField.value = isFoodZone.nutrition;
                activeInputField.style.left = `${event.pageX + 10}px`;
                activeInputField.style.top = `${event.pageY + 10}px`;

                const descriptionElement = document.getElementById(`description-${activeInputField.id}`);
                if (descriptionElement) {
                    descriptionElement.style.left = `${event.pageX + 10}px`;
                    descriptionElement.style.top = `${event.pageY - 10}px`;
                }
            } else {
                const inputField = document.createElement('input');
                inputField.type = 'number';
                inputField.value = isFoodZone.nutrition;
                inputField.style.position = 'absolute';
                inputField.style.left = `${event.pageX + 10}px`;
                inputField.style.top = `${event.pageY + 10}px`;
                inputField.style.width = '50px';
                inputField.className = 'input-food';

                inputField.id = `nutrition-input-${Date.now()}`;
                const descriptionElement = document.createElement('div');
                descriptionElement.textContent = `Питательность источника:`;
                descriptionElement.style.position = 'absolute';
                descriptionElement.style.left = `${event.pageX + 10}px`;
                descriptionElement.style.top = `${event.pageY - 10}px`;
                descriptionElement.style.color = 'black';
                descriptionElement.style.fontSize = '12px';
                descriptionElement.style.pointerEvents = 'none';
                descriptionElement.id = `description-${inputField.id}`;
                descriptionElement.className = 'description-food';

                document.body.appendChild(descriptionElement);
                document.body.appendChild(inputField);

                activeInputField = inputField;

                inputField.addEventListener('change', () => {
                    const newNutrition = parseFloat(inputField.value) || 1;
                    isFoodZone.nutrition = newNutrition;

                    for (let dy = -Math.ceil(isFoodZone.height / 2); dy < Math.ceil(isFoodZone.height / 2); dy++) {
                        for (let dx = -Math.ceil(isFoodZone.width / 2); dx < Math.ceil(isFoodZone.width / 2); dx++) {
                            const currentX = isFoodZone.centerX + dx;
                            const currentY = isFoodZone.centerY + dy;
                            if (matrix[currentX] && matrix[currentX][currentY]) {
                                matrix[currentX][currentY].food = newNutrition;
                                updatePixel(ctx, matrix, currentX, currentY);
                            }
                        }
                    }
                });

                canvas.addEventListener('mouseout', () => {
                    setTimeout(() => {
                        if (!inputField.matches(':hover')) {
                            inputField.remove();
                            descriptionElement.remove();
                            activeInputField = null;
                        }
                    }, 100);
                });

                inputField.addEventListener('blur', () => {
                    inputField.remove();
                    descriptionElement.remove();
                    activeInputField = null;
                });
            }
        }
    });

    clearButton.addEventListener('click', clearCanvas);

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        matrix = Array.from({ length: canvasHeight }, () =>
            Array.from({ length: canvasWidth }, () => ({
                pheromones_food: 0,
                pheromones_home: 0,
                food: 0,
                ants: 0,
                colony: false,
                obstacle: false
            }))
        );

        colony = [];
        ants = [];
        pheromonesHome = {};
        pheromonesFood = {};
        foodZones = [];

        console.log("Canvas cleared and reset.");
    }

    function addColony(event) {
        let colony_size = 4;
        let ch = 2;
        if (colony.length > 0) {
            for (let dy = -ch; dy < ch; dy++) {
                for (let dx = -ch; dx < ch; dx++) {
                    const currentX = colony[0] + dx;
                    const currentY = colony[1] + dy;
                    matrix[currentX][currentY].colony = false;
                    updatePixel(ctx, matrix, currentX, currentY);
                }
            }
            for (const cord in pheromonesHome) {
                matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = 0;
                updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
                delete pheromonesHome[cord];
            }
            colony = [];
        }
        let scaleX = canvas.width / canvas.clientWidth;
        let scaleY = canvas.height / canvas.clientHeight;

        let x = Math.floor(event.offsetX * scaleX);
        let y = Math.floor(event.offsetY * scaleY);

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

        foodZones.push({
            centerX: x,
            centerY: y,
            width: foodWidth,
            height: foodHeight,
            nutrition: nutrition
        });
    }

    function addObstacle(event) {
        let scaleX = canvas.width / canvas.clientWidth;
        let scaleY = canvas.height / canvas.clientHeight;

        let x = Math.floor(event.offsetX * scaleX);
        let y = Math.floor(event.offsetY * scaleY);

        let ch = 2;

        if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
            drawRect(ctx, x, y, 'gray', ch * 2);
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

    function cleanCanvas(event) {
        let scaleX = canvas.width / canvas.clientWidth;
        let scaleY = canvas.height / canvas.clientHeight;

        let x = Math.floor(event.offsetX * scaleX);
        let y = Math.floor(event.offsetY * scaleY);

        let ch = 2;

        if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
            drawRect(ctx, x, y, 'white', ch * 2);
            for (let dy = -ch; dy < ch; dy++) {
                for (let dx =  - ch; dx < ch; dx++) {
                    const currentX = x + dx;
                    const currentY = y + dy;
                    matrix[currentX][currentY] = {
                        pheromones_food: 0,
                        pheromones_home: 0,
                        food: 0,
                        ants: 0,
                        colony: false,
                        obstacle: false
                    };
                    updatePixel(ctx, matrix, x, y);
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

    function nextCeil(ant) {
        let probabilities = Array.from({ length: 8 }, () => ({
            direction: 0,
            value: 0
        }));

        if (ant.steps > MAX_STEPS && ant.state === "search") {
            ant.state = 'food';
            ant.memory = [];
            ant.steps = 1;
            ant.nutrition = 0;
        }

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
                    heuristic = 1 / (matrix[newX][newY].pheromones_home + 1);
                } else if (ant.state === 'food') {
                    //if (Math.random() < 0.005) return Math.floor(Math.random() * d.length);
                    pheromones = matrix[newX][newY].pheromones_home;
                    ant.steps += 1;
                    // let distanceToColony = Math.abs(newX - colony[0]) + Math.abs(newY - colony[1]);
                    // heuristic = 1 / (distanceToColony + 1);
                    //
                    // let angleHeuristic = calculateAngleHeuristic(ant, newX, newY);
                    // heuristic *= angleHeuristic;
                    heuristic = 1;
                }

                let noise = Math.random() * 0.01;
                let probability = Math.pow(pheromones + noise, alpha) * Math.pow(heuristic, beta);
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
                ants[i].nutrition = 10000;
                ants[i].state = 'search';
                ants[i].memory = [];
                ants[i].steps = 1;
            }

            matrix[ants[i].x][ants[i].y].ants++;
            updatePixel(ctx, matrix, ants[i].x, ants[i].y);
        }
    }

    function transpirePheromones() {
        for (const cord in pheromonesHome) {
            pheromonesHome[cord].pheromones = pheromonesHome[cord].pheromones * (1 - 0.01);
            matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = pheromonesHome[cord].pheromones;
            // updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
            if (pheromonesHome[cord].pheromones <= 0) {
                matrix[pheromonesHome[cord].x][pheromonesHome[cord].y].pheromones_home = 0;
                // updatePixel(ctx, matrix, pheromonesHome[cord].x, pheromonesHome[cord].y);
                delete pheromonesHome[cord];
            }
        }
        for (const cord in pheromonesFood) {
            pheromonesFood[cord].pheromones = pheromonesFood[cord].pheromones * (1 - 0.005);
            matrix[pheromonesFood[cord].x][pheromonesFood[cord].y].pheromones_food = pheromonesFood[cord].pheromones;
            //updatePixel(ctx, matrix, pheromonesFood[cord].x, pheromonesFood[cord].y);
            // if (pheromonesFood[cord].pheromones <= 0) {
            //     matrix[pheromonesFood[cord].x][pheromonesFood[cord].y].pheromones_food = 0;
            //     // updatePixel(ctx, matrix, pheromonesFood[cord].x, pheromonesFood[cord].y);
            //     delete pheromonesFood[cord];
            // }
        }
    }

    function leavePheromoneHome(ant) {
        let x = ant.x, y = ant.y, pheromones = ant.nutrition;
        const key = `${x},${y}`;
        if (matrix[x][y].pheromones_home === 0) pheromonesHome[key] = {pheromones, x, y};
        else pheromonesHome[key].pheromones += pheromones;
        ant.nutrition = 10000 / ant.steps;
        matrix[x][y].pheromones_home += ant.nutrition;
    }

    function leavePheromoneFood(ant) {
        let x = ant.x, y = ant.y, pheromones = ant.nutrition / ant.steps;
        const key = `${x},${y}`;
        if (matrix[x][y].pheromones_food === 0) pheromonesFood[key] = {pheromones, x, y};
        else pheromonesFood[key].pheromones += pheromones;
        matrix[x][y].pheromones_food += pheromones;
    }

    async function ants_algorithm() {
        while (true) {
            if (ants.length === 0) return;
            updatePos();
            transpirePheromones();
            await delay(1);
        }
    }
})
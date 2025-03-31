let colony = [];
let cnt_ants = 50;
let cnt_iter = 100000;
let ants = [];
let ants_positions = [];
let render = 1;
let mode = 'colony';
let food_sources = [];
let pheromones = [];

const width = 500;
const height = 500;

const matrix = Array.from({ length: 500 }, () =>
    Array.from({ length: 500 }, () => ({
        pheromones: 0,
        food: null,
        ants: []
    }))
);

function delay(ms) {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

function isNearFood(antPosition) {
    return matrix[antPosition.x][antPosition.y].food !== null;
}

function searchFood(num) {
    let x = ants_positions[num].x;
    let y = ants_positions[num].y;
    ants_positions[num].path.push({x, y});

    let direct = Math.random();
    if (direct <= 0.25) ants_positions[num].y--;
    else if (direct <= 0.5) ants_positions[num].x++;
    else if (direct <= 0.75) ants_positions[num].y++;
    else ants_positions[num].x--;

    ants_positions[num].x = Math.max(0, Math.min(width, ants_positions[num].x));
    ants_positions[num].y = Math.max(0, Math.min(height, ants_positions[num].y));
}

function returnColony(num) {
    if (ants_positions[num].path.length >= 1) {
        const {x, y} = ants_positions[num].path.pop();

        ants_positions[num].x = x;
        ants_positions[num].y = y;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let table = document.getElementById('table');
    let startButton = document.getElementById('startButton');
    let foodButton = document.getElementById('foodButton');

    function addColony(event) {
        const x = event.offsetX;
        const y = event.offsetY;

        let colony_view = document.createElement('div');
        colony_view.id = 'colony';

        colony_view.style.left = `${x}px`;
        colony_view.style.top = `${y}px`;

        table.appendChild(colony_view);

        colony.push(x);
        colony.push(y);
    }

    function addFood(event) {
        const foodWidth = 10;
        const foodHeight = 10;
        const tableRect = table.getBoundingClientRect();

        const x = Math.floor(event.clientX - tableRect.left);
        const y = Math.floor(event.clientY - tableRect.top);

        const nutrition = Math.floor(Math.random() * 50 + 50); // Случайная питательность от 50 до 100

        if (
            x >= foodWidth / 2  && x + foodWidth / 2 <= 500 &&
            y >= foodHeight / 2 && y + foodHeight / 2 <= 500
        ) {
            for (let dy = -foodHeight / 2; dy < foodHeight / 2; dy++) {
                for (let dx =  - foodWidth / 2; dx < foodWidth / 2; dx++) {
                    const currentX = x + dx;
                    const currentY = y + dy;

                    matrix[currentX][currentY].food = nutrition;
                }
            }

            let foodView = document.createElement('div');
            foodView.className = 'food';
            foodView.style.left = `${x}px`;
            foodView.style.top = `${y}px`;

            table.appendChild(foodView);
        }
        console.log(x, y);
    }

    function leavePheromone(num, x, y) {
        matrix[x][y].pheromones += ants_positions[num].nutrition / 100;

        let pheromoneView = document.createElement('div');

        pheromoneView.className = 'pheromone';
        pheromoneView.style.left = `${x}px`;
        pheromoneView.style.top = `${y}px`;

        table.appendChild(pheromoneView);

        pheromones.push(pheromoneView);
    }

    table.addEventListener('click', (event) => {
        if (mode === 'colony') addColony(event);
        if (mode === 'food') addFood(event);
    })

    startButton.addEventListener('click', () => {
        for (let i = 0; i < cnt_ants; i++) {
            let ant = document.createElement('div');
            ant.className = 'ant';

            ant.style.left = `${colony[0]}px`;
            ant.style.top = `${colony[1]}px`;

            table.appendChild(ant);

            ants.push(ant);

            let x = colony[0];
            let y = colony[1];
            let state = 'search';
            let path = [];
            let nutrition = 0;
            ants_positions.push({x, y, state, path, nutrition});
        }
        search();
    })

    foodButton.addEventListener('click', () => {
        mode = 'food';
    })

    function search() {

        async function alghorithm() {
            for (let i = 0; i < cnt_iter; i++) {
                for (let j = 0; j < cnt_ants; j++) {
                    if (ants_positions[j].state === 'search') {
                        searchFood(j);
                        let food = isNearFood(ants_positions[j]);
                        if (food) {
                            ants_positions[j].state = 'return';
                            ants_positions[j].nutrition = matrix[ants_positions[j].x][ants_positions[j].y].food;
                        }
                    }
                    else {
                        leavePheromone(j, ants_positions[j].path[ants_positions[j].path.length - 1].x, ants_positions[j].path[ants_positions[j].path.length - 1].y);
                        returnColony(j);
                        if (ants_positions[j].path.length === 0) {
                            ants_positions[j].state = 'search';
                            ants_positions[j].nutrition = 0;
                        }
                    }
                }

                for (let j = 0; j < cnt_ants; j++) {
                    ants[j].style.left = `${ants_positions[j].x}px`;
                    ants[j].style.top = `${ants_positions[j].y}px`;
                }

                if (i % 10 === 0) await delay(render);
            }
        }
        alghorithm();
    }
})

//TODO:
//переписать на канвас
//ещё много чего...
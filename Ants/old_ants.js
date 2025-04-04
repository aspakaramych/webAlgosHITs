let transpiration = 0.005;
let alpha = 1;
let beta = 0.05;
let cnt_ants = 1000;

let colony = [];

let cnt_iter = 100000;
let old_ants = [];
let render = 1;
let mode = 'colony';
let pheromones = [];
let max_pheromones = 5;

const width = 500;
const height = 500;

const matrix = Array.from({ length: 500 }, () =>
    Array.from({ length: 500 }, () => ({
        pheromones: 0.1,
        food: null,
        ants: 0,
        colony: false
    }))
);

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isNearFood(antPosition) {
    return matrix[antPosition.x][antPosition.y].food !== null;
}

function probabilityCeil(x, y) {
    let prob = Math.random();

    let leftPheromones = (x - 1 >= 0) ? matrix[x - 1][y].pheromones : 0;
    let rightPheromones = (x + 1 < matrix.length) ? matrix[x + 1][y].pheromones : 0;
    let upPheromones = (y - 1 >= 0) ? matrix[x][y - 1].pheromones : 0;
    let downPheromones = (y + 1 < matrix[0].length) ? matrix[x][y + 1].pheromones : 0;

    let del = (leftPheromones + rightPheromones + upPheromones + downPheromones) ** alpha;

    let prob1 = leftPheromones ** alpha / del;
    let prob2 = rightPheromones ** alpha / del;
    let prob3 = upPheromones ** alpha / del;
    let prob4 = downPheromones ** alpha / del;

    if (prob <= prob1 && x - 1 >= 0) {
        x--;
    } else if (prob <= prob1 + prob2 && x + 1 < matrix.length) {
        x++;
    } else if (prob <= prob1 + prob2 + prob3 && y - 1 >= 0) {
        y--;
    } else if (prob <= prob1 + prob2 + prob3 + prob4 && y + 1 < matrix[0].length) {
        y++;
    }

    return [x, y];
}

function getPheromoneColor(pheromones, minPheromones, maxPheromones) {
    let t = (pheromones - minPheromones) / (maxPheromones - minPheromones);
    t = Math.max(0, Math.min(1, t));

    let lightPink = [255, 182, 193];
    let darkPink = [139, 0, 71];

    let r = Math.round(lightPink[0] + t * (darkPink[0] - lightPink[0]));
    let g = Math.round(lightPink[1] + t * (darkPink[1] - lightPink[1]));
    let b = Math.round(lightPink[2] + t * (darkPink[2] - lightPink[2]));

    return [r, g, b];
}

document.addEventListener('DOMContentLoaded', () => {
    let table = document.getElementById('table');
    const context = table.getContext('2d');
    let startButton = document.getElementById('startButton');
    let foodButton = document.getElementById('foodButton');
    const tableRect = table.getBoundingClientRect();

    function changePixel(x, y, color) {
        const colorMap = {
            'black': [0, 0, 0, 255],
            'white': [255, 255, 255, 255],
            'red': [255, 0, 0, 255],
            'green': [0, 255, 0, 255],
            'blue': [0, 0, 255, 255],
            'yellow': [255, 255, 0, 255],
            'purple': [128, 0, 128, 255],
            'transparent': [0, 0, 0, 0],
            'orange' : [255, 165, 0, 255],
            'deeppink': [255, 20, 147, 255]
        };

        const rgba = colorMap[color.toLowerCase()];
        if (!rgba) {
            console.error(`Цвет "${color}" не поддерживается.`);
            return;
        }

        const imageData = context.getImageData(x, y, 1, 1);
        const data = imageData.data;

        data[0] = rgba[0];
        data[1] = rgba[1];
        data[2] = rgba[2];
        data[3] = rgba[3];

        context.putImageData(imageData, x, y);
    }

    function changePixelRGB(x, y, r, g, b) {
        const imageData = context.getImageData(x, y, 1, 1);
        const data = imageData.data;

        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = 255;

        context.putImageData(imageData, x, y);
    }

    function updatePixel(x, y) {
        matrix[x][y].ants--;
        if (matrix[x][y].ants === 0) {
            if (matrix[x][y].colony) changePixel(x, y, "yellow");
            else if (matrix[x][y].pheromones > 0.1) {
                let [r, g, b] = getPheromoneColor(matrix[x][y].pheromones, 0.1, max_pheromones);
                changePixelRGB(x, y, r, g, b);
            }
            else if (matrix[x][y].food) changePixel(x, y, "green");
            else changePixel(x, y, "white");
        }
    }

    function addColony(event) {
        if (colony.length > 0) {
            return;
        }
        const x = Math.round(event.clientX - tableRect.left);
        const y = Math.round(event.clientY - tableRect.top);
        let colony_width = 20;

        context.fillStyle = 'orange';
        context.fillRect(x - colony_width / 2, y - colony_width / 2, colony_width, colony_width);
        context.closePath();

        console.log(x, y);

        if (
            x >= colony_width / 2  && x + colony_width / 2 <= 500 &&
            y >= colony_width / 2 && y + colony_width / 2 <= 500
        ) {
            for (let dy = -colony_width / 2; dy < colony_width / 2; dy++) {
                for (let dx = -colony_width / 2; dx < colony_width / 2; dx++) {
                    const currentX = x + dx;
                    const currentY = y + dy;

                    matrix[currentX][currentY].colony = true;
                }
            }
        }
        colony.push(x);
        colony.push(y);
    }

    function addFood(event) {
        const foodWidth = 10;
        const foodHeight = 10;

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

            context.fillStyle = 'green';
            context.fillRect(x - foodWidth / 2, y - foodWidth / 2, foodHeight, foodWidth);
            context.closePath();

        }
        console.log(x, y);
    }

    function leavePheromone(num, x, y) {
        if (matrix[x][y].pheromones === 0.1) pheromones.push({x, y});
        matrix[x][y].pheromones += old_ants[num].nutrition / 50 * (1 + pheromones.length / 100);

        let [r, g, b] = getPheromoneColor(matrix[x][y].pheromones, 0.1, max_pheromones);
        changePixelRGB(x, y, r, g, b);
    }

    function transparent() {
        for (let i = 0; i < pheromones.length; i++) {
            const { x, y } = pheromones[i];
            matrix[x][y].pheromones -= matrix[x][y].pheromones * transpiration;
            if (matrix[x][y].pheromones <= 0.1) {
                pheromones.splice(i, 1);
                i--;
                changePixel(x, y, 'white');
            }
            else {
                let [r, g, b] = getPheromoneColor(matrix[x][y].pheromones, 0.1, max_pheromones);
                if (matrix[x][y].ants === 0) changePixelRGB(x, y, r, g, b);
            }
        }
    }

    function searchFood(num) {
        let x = old_ants[num].x;
        let y = old_ants[num].y;
        old_ants[num].path.push({x, y});

        updatePixel(x, y);

        [old_ants[num].x, old_ants[num].y] = probabilityCeil(x, y);

        old_ants[num].x = Math.max(0, Math.min(width, old_ants[num].x));
        old_ants[num].y = Math.max(0, Math.min(height, old_ants[num].y));

        matrix[old_ants[num].x][old_ants[num].y].ants++;
        changePixel(old_ants[num].x, old_ants[num].y, "black");
    }

    function returnColony(num) {
        if (old_ants[num].path.length > 0) {

            leavePheromone(num, old_ants[num].x, old_ants[num].y);
            updatePixel(old_ants[num].x, old_ants[num].y);

            const {x, y} = old_ants[num].path.pop();
            old_ants[num].x = x;
            old_ants[num].y = y;

            matrix[old_ants[num].x][old_ants[num].y].ants++;
            changePixel(old_ants[num].x, old_ants[num].y, "black");
        }
    }

    table.addEventListener('click', (event) => {
        if (mode === 'colony') addColony(event);
        if (mode === 'food') addFood(event);
    })

    startButton.addEventListener('click', () => {
        for (let i = 0; i < cnt_ants; i++) {
            let x = colony[0];
            let y = colony[1];
            let state = 'search';
            let path = [];
            let nutrition = 0;
            old_ants.push({x, y, state, path, nutrition});
            matrix[x][y].ants += 1;
            changePixel(x, y, 'black');
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
                    if (old_ants[j].state === 'search') {
                        searchFood(j);
                        let food = isNearFood(old_ants[j]);
                        if (food) {
                            old_ants[j].state = 'return';
                            old_ants[j].nutrition = matrix[old_ants[j].x][old_ants[j].y].food;
                        }
                    }
                    else {
                        returnColony(j);
                        if (old_ants[j].path.length === 0) {
                            old_ants[j].state = 'search';
                            old_ants[j].nutrition = 0;
                        }
                    }
                }

                transparent();

                if (i % 1 === 0) await delay(render);
            }
        }
        alghorithm();
    }
})

//TODO:
//переписать на канвас
//ещё много чего...
let dots = [];
let isProcessing = false;

let cnt_population = 100;
let cnt_epoch = 1000;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function countDistances(arrayTowns) {
    const n = arrayTowns.length;
    const dist = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < arrayTowns.length; i++) {
        for (let j = i + 1; j < arrayTowns.length; j++) {
            dist[i][j] = (arrayTowns[i].x - arrayTowns[j].x) ** 2 + (arrayTowns[i].y - arrayTowns[j].y) ** 2;
            dist[j][i] = (arrayTowns[i].x - arrayTowns[j].x) ** 2 + (arrayTowns[i].y - arrayTowns[j].y) ** 2;
        }
    }
    return dist;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function fitness(dist, way) {
    let cnt = 0;
    for (let i = 1; i < way.length; i++) {
        cnt += dist[way[i - 1]][way[i]];
    }
    return cnt + dist[way.length - 1][way[0]];
}

function mutation(array) {
    const i = Math.floor(Math.random() * (array.length));
    const j = Math.floor(Math.random() * (array.length));
    [array[i], array[j]] = [array[j], array[i]];
}

function crossover(parent1, parent2) {
    let used = Array(parent1.length).fill(0);

    let child = Array(parent1.length).fill(0);

    let start = Math.floor(Math.random() * (parent1.length - 1));
    let end  = start + Math.floor(Math.random() * (parent1.length - 1 - start));

    for (let i = start; i < end; i++) {
        child[i] = parent1[i];
        used[parent1[i]] = 1;
    }

    let ptr = 0;

    for (let i = 0; i < child.length; i++) {
        if (i >= start && i < end) continue;

        while (ptr !== child.length &&  ptr < parent2.length && used[parent2[ptr]] === 1 ) {
            ptr++;
        }

        if (ptr === child.length) {
            break;
        }

        child[i] = parent2[ptr];
        used[parent2[ptr]] = 1;

    }

    return child;
}

function generatePopulation(cntIndivid, numTowns) {
    let rightOrder = Array.from({length: numTowns}, (_, index) => index);
    let population = [];
    for (let i = 0; i < cntIndivid; i++) {
        shuffleArray(rightOrder);
        population.push([...rightOrder]);
    }
    return population;
}

document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('table');
    const startButton = document.getElementById('startButton');
    const output = document.getElementById('output');
    const linesSvg = document.getElementById('lines');

    table.addEventListener('click', (event) => {
        if (isProcessing) {
            return;
        }
        const x = event.offsetX;
        const y = event.offsetY;

        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;

        table.appendChild(dot);

        dots.push({x, y});
    })

    startButton.addEventListener('click', (event) => {
        if (isProcessing) {
            return;
        }
        isProcessing = true;
        geneticAlgorithm();
    })

    function addLine(dot1, dot2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', dot1.x);
        line.setAttribute('y1', dot1.y);
        line.setAttribute('x2', dot2.x);
        line.setAttribute('y2', dot2.y);
        line.setAttribute('stroke', 'blue');
        line.setAttribute('stroke-width', '2');
        linesSvg.appendChild(line);
    }

    function drawLines(seqDots = Array.from({length: dots.length}, (_, index) => index)) {
        linesSvg.innerHTML = '';

        if (dots.length > 1) {
            for (let i = 0; i < dots.length - 1; i++) {
                addLine(dots[seqDots[i]], dots[seqDots[i + 1]]);
            }
            addLine(dots[seqDots[dots.length - 1]], dots[seqDots[0]]);
        }
    }

    function geneticAlgorithm() {
        let dist = countDistances(dots);
        let rightOrder = Array.from({length: dots.length}, (_, index) => index);
        let population = generatePopulation(cnt_population, dots.length);
        drawLines(population[0]);
        async function alghorythm() {
            for (let i = 0; i < cnt_epoch; i++) {
                population.sort((a, b) => fitness(dist, a) - fitness(dist, b));
                for (let j = 0; j < cnt_population / 2; j++) {
                    population[j + cnt_population / 2] = crossover(population[j], population[j + 1]);
                }
                drawLines(population[0]);

                await delay(500);
            }
        }
        alghorythm();
        console.log('пытка кончилась');
    }
})

//TODO:
//add deletion dots
//scale the table in process
//add mutation
//add inbreeding
//поиграться с количеством особей и количеством эпох

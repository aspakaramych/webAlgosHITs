let dots = [];
let isProcessing = false;

let cnt_population = 1000;
let cnt_epoch = 10000;
let mutation_rate = 0.3;
let tournament_size = cnt_population / 100;
let cnt_pairs = cnt_population / 4;

//реализуем алгоритм Эшелмана (CHC (Cross-generational Selection, Heterogeneous Recombination, and Cataclysmic Mutation))
//

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

// алгоритм кроссовера по Эшелману, берём по половине генов от обоих родителей
function halfUniformCrossover(parent1, parent2) {
    const length = parent1.length;
    let child = Array(length).fill(null);
    let used = new Set();

    const positions = Array.from({ length }, (_, i) => i);
    shuffleArray(positions);
    const selectedPositions = positions.slice(0, Math.floor(length / 2));

    for (let pos of selectedPositions) {
        child[pos]  = parent1[pos];
        used.add(parent1[pos]);
    }

    let ptr = 0;
    for (let i = 0; i < length; i++) {
        if (child[i] === null) {
            while (used.has(parent2[ptr])) {
                ptr++;
            }
            child[i] = parent2[ptr];
            used.add(parent2[ptr]);
        }
    }

    return child;
}

//выбор особи турнирным способом
function selectParent(population, dist) {
    let candidates = [];
    for (let i = 0; i < tournament_size; i++) {
        candidates.push(population[Math.floor(Math.random() * (population.length - 1))]);
    }

    let winner = 0;
    let min_fitness = fitness(dist, candidates[0]);
    for (let i = 1; i < candidates.length; i++) {
        let temp = fitness(dist, candidates[i])
        if (temp < min_fitness) {
            winner = i;
            min_fitness = temp;
        }
    }
    return candidates[winner];
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
                for (let j = 0; j < cnt_pairs; j++) {
                    population[population.length - j - 1] = halfUniformCrossover(selectParent(population, dist), selectParent(population, dist));
                }

                for (let j = 1; j < 1 + Math.floor(mutation_rate * cnt_population); j++) {
                    mutation(population[j]);
                }

                drawLines(population[0]);

                await delay(100);
            }
            console.log('пытка кончилась');
        }
        alghorythm();

    }
})

//TODO:
//add deletion dots
//scale the table in process
//add mutation
//add inbreeding
//поиграться с количеством особей и количеством эпох

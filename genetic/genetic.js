let dots = [];
let isProcessing = false;
let controller = new AbortController();

let cnt_population = 1000;
<<<<<<< HEAD
let cnt_epoch = 10000;
let mutation_rate = 0.3;
let tournament_size = 10;
let cnt_pairs = cnt_population / 2;
let threshold_stagnation = 50;

let render = 1;

//реализуем алгоритм Эшелмана (CHC (Cross-generational Selection, Heterogeneous Recombination, and Cataclysmic Mutation))

=======
let cnt_epoch = 50000;
let mutation_rate = 0.6;
let tournament_size = 20;
let cnt_pairs = 500;
let threshold_stagnation = 200;
let inbreeding = 0.5;

let render = 1;

>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function stopAlgorithm() {
    controller.abort();
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
<<<<<<< HEAD
    return cnt + dist[way.length - 1][way[0]];
}

function mutation(array) {
    const i = Math.floor(Math.random() * (array.length - 1));
    const j = Math.floor(Math.random() * (array.length - 1));
    [array[i], array[j]] = [array[j], array[i]];
}

// алгоритм кроссовера по Эшелману, берём по половине генов от обоих родителей
function halfUniformCrossover(parent1, parent2) {
    const length = parent1.length;
    const lengthPar1 = Math.floor(parent1.length / 2);
=======
    cnt += dist[way[way.length - 1]][way[0]]
    return cnt;
}

function mutation(array) {
    const i = Math.floor(Math.random() * (array.length));
    const j = Math.floor(Math.random() * (array.length));
    [array[i], array[j]] = [array[j], array[i]];
}

function otherMutation(array) {
    const start = Math.floor(Math.random() * (array.length));
    const end = Math.floor(Math.random() * (array.length - start)) + start;
    for (let i = start; i < (end - start) / 2; i++) {
        [array[i], array[end - i + start]] = [array[end - i + start], array[i]];
    }
}

// алгоритм кроссовера по Эшелману, берём по половине генов от обоих родителей
function halfUniformCrossover(parent1, parent2) {
    const length = parent1.length;
    const lengthPar1 = Math.floor(parent1.length * Math.random());
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
    let child = Array(length).fill(null);
    let used = new Set();

    const start = Math.floor(Math.random() * (lengthPar1 - 1));
    const end = start + Math.floor(Math.random() * (lengthPar1 - 1 - start));

    for (let i = start; i < end; i++) {
<<<<<<< HEAD
        child[i]  = parent1[i];
=======
        child[i - start]  = parent1[i];
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
        used.add(parent1[i]);
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

<<<<<<< HEAD
=======
    if (Math.random() < mutation_rate){
        let index1 = Math.floor(Math.random() * length);
        let index2 = Math.floor(Math.random() * length);

        if (index1 !== index2) {
            [child[index1], child[index2]] = [child[index2], child[index1]];
        }
    }

>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
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

//расстояние хэмминга (различие между родителями) для предотвращения инбридинга
function distHamming(parent1, parent2) {
    let distance = 0;
    for (let i = 0; i < parent1.length; i++) {
        if (parent1[i] !== parent2[i]) {
            distance++;
        }
    }
    return distance;
}

function greedyAlgorithm(dist, start) {
    let way = [];
    let used = new Set();
    used.add(start);
    way.push(start);
    let last = start;
    for (let i = 0; i < dist.length - 1; i++) {
        let min = Number.MAX_VALUE;
        let ver = -1;
        for (let j = 0; j < dist[last].length; j++) {
            if (last !== j) {
                if (min > dist[last][j] && !used.has(j)) {
                    ver = j;
                    min = dist[last][j];
                }
            }
        }
        last = ver;
        way.push(ver);
        used.add(ver);
    }
    return way;
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

function cataclysmicMutation(population) {
    for (let i = 1; i < 10; i++) {
<<<<<<< HEAD
        population[i] = halfUniformCrossover(population[0], population[i])
    }
    for (let i = 10; i < population.length; i++) {
=======
        population[i] = halfUniformCrossover(population[0], population[i]);
    }
    for (let i = 1; i < population.length; i++) {
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
        shuffleArray(population[i]);
    }
}

function twoOptSwap(route, i, k) {
    return route.slice(0, i)
        .concat(route.slice(i, k + 1).reverse())
        .concat(route.slice(k + 1));
}

function localSearch(dist, route) {
    let improved = true;

    while (improved) {
        improved = false;

        for (let i = 1; i < route.length; i++) {
            for (let k = i + 1; k < route.length; k++) {
                const newRoute = twoOptSwap(route, i, k);

                if (fitness(dist, newRoute) < fitness(dist, route)) {
                    route = newRoute;
                    improved = true;
                }
            }
        }
    }

    return route;
}

document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('table');
    const startButton = document.getElementById('startButton');
<<<<<<< HEAD
    const output = document.getElementById('output');
=======
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
    const linesSvg = document.getElementById('lines');

    table.addEventListener('click', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;

        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;

        table.appendChild(dot);

        dots.push({x, y});
        if (isProcessing) {
            stopAlgorithm();
            setTimeout(() => {
                geneticAlgorithm();
            }, render * 10);
        }
    })

<<<<<<< HEAD
    startButton.addEventListener('click', (event) => {
=======
    startButton.addEventListener('click', () => {
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
        if (isProcessing) {
            startButton.textContent = 'Поиск оптимального пути';
            stopAlgorithm();
            isProcessing = false;
        }
        else {
<<<<<<< HEAD
=======
            //generateRandomDots(40, 600, 600);
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
            geneticAlgorithm();
            startButton.textContent = 'Остановить процесс поиска';
        }
    })

<<<<<<< HEAD
=======
    function generateRandomDots(count, width, height) {
        dots = [];
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            dots.push({ x, y });

            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
            table.appendChild(dot);
        }
        drawLines();
    }

>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
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

    async function geneticAlgorithm() {
        isProcessing = true;
        let dist = countDistances(dots);
        let population = generatePopulation(cnt_population, dots.length);
        for (let i = 0; i < dist.length; i++) {
<<<<<<< HEAD
            population[i] = greedyAlgorithm(dist, i);
        }
        drawLines(population[0]);
        controller = new AbortController();
        let alpha = greedyAlgorithm(dist, 0);
=======
            population.push(greedyAlgorithm(dist, i));
        }
        drawLines(population[0]);
        controller = new AbortController();
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e

        async function alghorythm() {
            let stagnation = 0;
            let elite = population[0];

            for (let i = 0; i < cnt_epoch; i++) {
                if (controller.signal.aborted) {
                    console.log("Алгоритм остановлен");
                    return;
                }
<<<<<<< HEAD
                population.push(alpha);
=======
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
                population.sort((a, b) => fitness(dist, a) - fitness(dist, b));

                population = population.slice(0, cnt_population);
                if (population[0] === elite) stagnation++;
                elite = population[0];

<<<<<<< HEAD
                elite = localSearch(dist, elite);
=======
                //elite = localSearch(dist, elite);
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e

                if (stagnation > threshold_stagnation) {
                    stagnation = 0;
                    cataclysmicMutation(population);
                } else {
                    for (let j = 0; j < cnt_pairs; j++) {
                        if (controller.signal.aborted) {
                            console.log("Алгоритм остановлен");
                            return;
                        }
                        let parent1 = selectParent(population, dist);
                        let parent2 = selectParent(population, dist);
<<<<<<< HEAD
                        if (distHamming(parent1, parent2) > Math.floor(Math.random() * (parent1.length - 1) * 0.5)) {
                            population.push(halfUniformCrossover(parent1, parent2));
                            population.push(halfUniformCrossover(parent1, parent2));
                            mutation(population[population.length - 1]);
                            mutation(population[population.length - 2]);
=======
                        if (distHamming(parent1, parent2) > Math.floor((parent1.length - 1) * inbreeding)) {
                            population.push(halfUniformCrossover(parent1, parent2));
                            population.push(halfUniformCrossover(parent2, parent1));
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
                        }
                    }
                }

<<<<<<< HEAD
                for (let j = 1; j < 1 + Math.floor(mutation_rate * cnt_population); j++) {
                    mutation(population[j]);
=======
                for (let j = 10; j < 10 + Math.floor(mutation_rate * cnt_population); j++) {
                    otherMutation(population[j]);
>>>>>>> f23e25e3afd6ddb8a7f9b7bafaa1802e6a1be12e
                    if (controller.signal.aborted) {
                        console.log("Алгоритм остановлен");
                        return;
                    }
                }

                drawLines(elite);

                console.log(fitness(dist, elite));

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(resolve, render);
                    controller.signal.addEventListener("abort", () => {
                        clearTimeout(timeout);
                        reject(new Error("Остановлено"));
                    });
                })
            }
            console.log('Алгоритм завершен');
        }

        try {
            await alghorythm();
        } catch (error) {
            console.log("Алгоритм остановлен:", error.message);
        } finally {
            isProcessing = false;
        }
    }
})

//TODO:
//add deletion dots
//scale the table in process

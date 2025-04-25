import {mutationRate, tournamentSize} from './config.js'

//функция, которая перемешиваает геном случайным образом
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//считает длину всего маршрута, чем меньше тем лучше
export function fitness(dist, way) {
    let cnt = 0;
    for (let i = 1; i < way.length; i++) {
        cnt += dist[way[i - 1]][way[i]];
    }
    cnt += dist[way[way.length - 1]][way[0]]
    return cnt;
}

//обычная мутация, переставляет местами два гена
export function mutation(array) {
    const i = Math.floor(Math.random() * (array.length));
    const j = Math.floor(Math.random() * (array.length));
    [array[i], array[j]] = [array[j], array[i]];
}

//продвинутая мутация, инвертирует подпоследовательность внутри генома
export function inversionMutation(array) {
    const start = Math.floor(Math.random() * (array.length));
    const end = Math.floor(Math.random() * (array.length - start)) + start;
    for (let i = start; i < (end - start) / 2; i++) {
        [array[i], array[end - i + start]] = [array[end - i + start], array[i]];
    }
}

// алгоритм кроссовера (скрещивания), берём по половине генов от обоих родителей
export function halfUniformCrossover(parent1, parent2) {
    const length = parent1.length;
    const lengthPar1 = Math.floor(parent1.length * Math.random());
    let child = Array(length).fill(null);
    let used = new Set();

    const start = Math.floor(Math.random() * (lengthPar1 / 2));
    const end = start + lengthPar1 / 2;

    for (let i = start; i < end; i++) {
        child[i - start]  = parent1[i];
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

    //с определённой вероятностью мутируем ребёнка
    if (Math.random() < mutationRate){
        mutation(child);
    }

    return child;
}

//выбор особи турнирным способом
export function selectParent(population, dist) {
    let candidates = [];

    //выбираем tournamentSize кандидатов
    for (let i = 0; i < tournamentSize; i++) {
        candidates.push(population[Math.floor(Math.random() * (population.length - 1))]);
    }

    //ищем лучшего
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

//расстояние Хэмминга (различие между родителями) для предотвращения инбридинга
export function distHamming(parent1, parent2) {
    let distance = 0;
    for (let i = 0; i < parent1.length; i++) {
        if (parent1[i] !== parent2[i]) {
            distance++;
        }
    }
    return distance;
}

export function greedyAlgorithm(dist, start) {
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

//создаём случайную популяцию
export function generatePopulation(cntIndivid, numTowns) {
    let rightOrder = Array.from({length: numTowns}, (_, index) => index);
    let population = [];
    for (let i = 0; i < cntIndivid; i++) {
        shuffleArray(rightOrder);
        population.push([...rightOrder]);
    }
    return population;
}

//катаклизм, оставляем несколько лучших особей, остальные - случайные
export function cataclysmicMutation(population) {
    for (let i = 1; i < 10; i++) {
        population[i] = halfUniformCrossover(population[0], population[i]);
    }
    for (let i = 1; i < population.length; i++) {
        shuffleArray(population[i]);
    }
}
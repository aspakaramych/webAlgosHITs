import {fitness, halfUniformCrossover, selectParent, distHamming, generatePopulation, greedyAlgorithm,
    inversionMutation, cataclysmicMutation} from './geneticEngineering.js'

import {cntPopulation, render, cntPairs, cntEpoch, radDots, mutationRate, inbreeding,
    thresholdStagnation} from './config.js'

//массивы для хранения информации о точках
let dots = [];
let divsDots = []

//переменные для асинхронной работы алгоритма
let isProcessing = false;
let controller = new AbortController();

function stopAlgorithm() {
    controller.abort();
}

//считает расстояние между всеми городами, возвращает матрицу смежности
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

document.addEventListener('DOMContentLoaded', () => {
    //элементы для взаимодействия
    const plane = document.getElementById('plane');
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const linesSvg = document.getElementById('lines');
    
    //окно с ошибкой
    const errorModal = document.getElementById('error-modal');
    const closeErrorModal = document.getElementById('close-error-modal');
    const parentContainer = document.getElementById('parent-container');

    //расставляем точки на плоскости
    plane.addEventListener('click', (event) => {
        const rect = plane.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        //проверяем есть ли в этой зоне уже точка
        for (let i = 0; i < dots.length; i++) {
            if (Math.abs(dots[i].x - x) <= radDots && Math.abs(dots[i].y - y) <= radDots) {
                divsDots[i].remove();
                divsDots.splice(i, 1);
                dots.splice(i, 1);

                //если алгоритм работает, перезапускаем
                if (isProcessing) {
                    stopAlgorithm();
                    setTimeout(() => {
                        geneticAlgorithm();
                    }, render * 10);
                }
                return;
            }
        }

        //добавление точки на плокскость
        let dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        plane.appendChild(dot);
        
        divsDots.push(dot);

        dots.push({x, y});

        //если алгоритм работает, перезапускаем
        if (isProcessing) {
            stopAlgorithm();
            setTimeout(() => {
                geneticAlgorithm();
                startButton.textContent = 'Остановить процесс поиска';
                startButton.style.backgroundColor = '#e46262';
            }, render * 50);
        }
    })

    //кнопка запуска и остановки
    startButton.addEventListener('click', () => {
        if (isProcessing) {
            startButton.textContent = 'Поиск оптимального пути';
            stopAlgorithm();
            isProcessing = false;
            startButton.style.backgroundColor = 'springgreen';
        }
        else {
            if (dots.length < 2) { //если точек мало, чтобы построить путь, выкидывем модальное окно
                errorModal.style.display = 'flex';
                parentContainer.classList.add('blur');
            } else {
                geneticAlgorithm();
                startButton.textContent = 'Остановить процесс поиска';
                startButton.style.backgroundColor = '#e46262';
            }
        }
    })

    //перезагрузка (очистка) поля
    resetButton.addEventListener('click', () => {
        resetField();
    });

    //уйти из модального окна
    closeErrorModal.addEventListener('click', () => {
        errorModal.style.display = 'none';
        parentContainer.classList.remove('blur');
    });

    function resetField() {
        if (isProcessing) {
            stopAlgorithm();
        }
        dots = [];
        divsDots = [];

        const existingDots = document.querySelectorAll('.dot');
        existingDots.forEach(dot => dot.remove());

        linesSvg.innerHTML = '';
        isProcessing = false;
        startButton.textContent = 'Поиск оптимального пути';
        startButton.style.backgroundColor = 'springgreen';
    }

    //функция для отладки, генерирует n случайных точек
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
            plane.appendChild(dot);
        }
        drawIndividual();
    }

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

    //для отрисовки пути
    function drawIndividual(seqDots = Array.from({length: dots.length}, (_, index) => index)) {
        linesSvg.innerHTML = '';

        if (dots.length > 1) {
            for (let i = 0; i < dots.length - 1; i++) {
                addLine(dots[seqDots[i]], dots[seqDots[i + 1]]);
            }
            addLine(dots[seqDots[dots.length - 1]], dots[seqDots[0]]);
        }
    }

    async function geneticAlgorithm() {
        //для асинхронности
        isProcessing = true;
        controller = new AbortController();

        let dist = countDistances(dots);
        let population = generatePopulation(cntPopulation, dots.length);

        //генерируем какое-то количество особей с помощью жадного алгоритма, ответ скорее всего не среди них, но в них
        //точно есть оптимизированные участки пути
        for (let i = 0; i < dist.length; i++) {
            population.push(greedyAlgorithm(dist, i));
        }

        //отрисовываем какую-то особь
        drawIndividual(population[0]);

        //основной алгоритм для просчёта поколений
        async function alghorythm() {
            let stagnation = 0;
            let elite = population[0];

            for (let i = 0; i < cntEpoch; i++) {
                if (controller.signal.aborted) { //проверка контроллер на остановку
                    console.log("Алгоритм остановлен");
                    return;
                }

                //ранжируем особей по приспособленности
                population.sort((a, b) => fitness(dist, a) - fitness(dist, b));

                //выкидываем из популяции лишних особей
                population = population.slice(0, cntPopulation);

                //проверка на смену лучшей особи
                if (population[0] === elite) stagnation++;

                elite = population[0];

                if (stagnation > thresholdStagnation) {
                    stagnation = 0;
                    cataclysmicMutation(population);
                } else {
                    for (let j = 0; j < cntPairs; j++) {
                        if (controller.signal.aborted) {
                            console.log("Алгоритм остановлен");
                            return;
                        }

                        //выбираем родителей
                        let parent1 = selectParent(population, dist);
                        let parent2 = selectParent(population, dist);

                        //проверяем родителей на близкородственность
                        if (distHamming(parent1, parent2) > Math.floor((parent1.length - 1) * inbreeding)) {
                            //получаем 2 детей
                            population.push(halfUniformCrossover(parent1, parent2));
                            population.push(halfUniformCrossover(parent2, parent1));
                        }
                    }
                }

                //мутиируем какую-то часть популяции
                for (let j = 10; j < 10 + Math.floor(mutationRate * cntPopulation); j++) {
                    inversionMutation(population[j]);
                    if (controller.signal.aborted) {
                        console.log("Алгоритм остановлен");
                        return;
                    }
                }

                drawIndividual(elite);

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(resolve, render);
                    controller.signal.addEventListener("abort", () => {
                        clearTimeout(timeout);
                    });
                })
            }
            console.log('Алгоритм завершен');
        }

        await alghorythm();
        isProcessing = false;
        startButton.style.backgroundColor = 'springgreen';
        startButton.textContent = 'Поиск оптимального пути';
    }
})
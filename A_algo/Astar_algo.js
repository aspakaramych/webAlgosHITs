import {
    PriorityQueue
} from './PriorityQueue.js'

document.addEventListener('DOMContentLoaded', function() {
    getGrid();
});

document.getElementById("generate").addEventListener("click", getGrid);
document.getElementById("clear").addEventListener("click", clearField);
document.getElementById("start").addEventListener("click", instantShow);
document.getElementById("step").addEventListener("click", showAlgorhytm);
document.getElementById("showBySteps").addEventListener("click", showBySteps);
document.getElementById("close-error-modal").addEventListener("click", handleError);

let errorContainer = document.getElementById("error-modal");
let message = document.getElementById("error-text");

let PAINTEDCELLS = [];
let PATHCELLS = [];
let SIZE;
let GRID;
let USERSTEP = 0;

let STARTPOINT = null;
let FINISHPOINT = null;

let PATH = new Map();       // клетки искомого пути ключ - текущая клетка, значение - клетка, из которой пришли
let FINALPATH = [];         // координаты клеток искомого пути
let CHOOSEDCELLS = [];           // какая клетка выбиралась алгоритмом на каждой итерации
let SEARCHAROUND = new Map();       // отображение на экране - выбор между какими точками происходил на данном шаге

function showError(errorMessage) {
    errorContainer.style.display = 'flex';
    message.innerHTML = errorMessage;
}

function handleError() {
    errorContainer.style.display = 'none';
}

function clearPreviousPath() {
    for(let i = 0; i < SIZE; i++) {
        for(let j = 0; j < SIZE; j++) {
            GRID.children[i * SIZE + j].classList.remove('path');
            GRID.children[i * SIZE + j].classList.remove('deadlock');
            GRID.children[i * SIZE + j].classList.remove('mark');
        }
    }
}

function clearField() {
    GRID.children[STARTPOINT.row * SIZE + STARTPOINT.col].classList.remove('start');
    GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.remove('finish');
    GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.remove('reached');
    GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.remove('mark');
    
    clearPreviousPath();

    STARTPOINT = null;
    FINISHPOINT = null;
    PATH.clear();
    CHOOSEDCELLS = [];
    SEARCHAROUND.clear();
    FINALPATH = [];
    USERSTEP = 0;
}

// генерируем поле (все клетки закрашены - это для алгоритма Прима)
function getGrid() {
    clear();
    STARTPOINT = null;
    FINISHPOINT = null;
    PAINTEDCELLS = [];
    PATHCELLS = [];
    GRID = document.getElementById('grid');
    SIZE = parseInt(document.getElementById('size').value);
    document.documentElement.style.setProperty('--size', SIZE);

    GRID.innerHTML= '';

    for (let i = 0; i < SIZE * SIZE; i++) {
        let cell = document.createElement('div'); // "клетка" представляет собой div, в который мы добавляем классы "👍"
        cell.classList.add('cell');
        cell.classList.add('wall')

        const row = Math.floor(i / SIZE); 
        const col = i % SIZE;
        PAINTEDCELLS.push({ row, col });

        cell.addEventListener('click', function() { // лкм - ставим/убираем стену
            cell.classList.toggle('wall');

            if (cell.classList.contains('wall')) {
                PAINTEDCELLS.push({ row, col });
            } else {
                const index = PAINTEDCELLS.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    PAINTEDCELLS.splice(index, 1);
                }
            }
        });
        
        cell.addEventListener('contextmenu', function() { // на пкм ставим/убираем начальную/конечную точку
            if(cell.classList.contains('start')) {
                cell.classList.remove('start');
                STARTPOINT = null;
            }
            else {
                if(STARTPOINT === null) {
                    cell.classList.add('start');
                    STARTPOINT = {row: row, col: col};
                }
            }
            if(cell.classList.contains('finish')) {
                cell.classList.remove('finish');
                FINISHPOINT = null;
            }
            else {
                if(FINISHPOINT === null && STARTPOINT !== null && !cell.classList.contains('start')) {
                    cell.classList.add('finish');
                    FINISHPOINT = {row: row, col: col};
                }
            }

            if(cell.classList.contains('wall')) {         // если там была стена - убираем
                cell.classList.remove('wall');
                const index = PAINTEDCELLS.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    PAINTEDCELLS.splice(index, 1);
                }
            }
        });
        
        GRID.appendChild(cell);
    }
    PrimAlgorhitm(); // алгоритм Прима расчищает клетки-стены
}

let graph = new Map();

// матрица смежности
function fillTheGraph() {       
    graph.clear();
    for(let i = 0; i < SIZE; i++) {
        for(let j = 0; j < SIZE; j++) {
            if(!PAINTEDCELLS.some(cell => cell.row === i && cell.col === j)) {
                graph.set(`${i},${j}`, getNeighbors(i, j));
            }
        }
    }
}

// соседи слева-снизу-справа-сверху
function getNeighbors(x, y) {
    let neigh = [];
    if(!PAINTEDCELLS.some(cell => cell.row === x+1 && cell.col === y) && x+1 < SIZE) {
        neigh.push({row: x+1, col: y});
    }
    if(!PAINTEDCELLS.some(cell => cell.row === x && cell.col === y+1) && y+1 < SIZE) {
        neigh.push({row: x, col: y+1});
    }
    if(!PAINTEDCELLS.some(cell => cell.row === x-1 && cell.col === y) && x-1 >= 0) {
        neigh.push({row: x-1, col: y});
    }
    if(!PAINTEDCELLS.some(cell => cell.row === x && cell.col === y-1) && y-1 >= 0) {
        neigh.push({row: x, col: y-1});
    }
    return neigh;
}

// эвристическая оценка - метрика Манхеттена - оцениваем расстояние до конечной точки
function evrEval(a , b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function AstarAlgo() {
    if(STARTPOINT === null || FINISHPOINT === null) {
        showError("Поставьте точки начала и конца 🙏");
        return;
    }
    clear();
    fillTheGraph();
    FINALPATH.push(STARTPOINT)
    FINALPATH.push(FINISHPOINT)

    let borders = new PriorityQueue();

    let start = STARTPOINT;
    let goal = FINISHPOINT;
    let step = 0;
    let reached = false;
    let visited = [];

    PATH.set(`${start.row},${start.col}`, 0);    
    borders.add(start, 0);

    while(!borders.isEmpty()) {
        let curr = borders.peek();
        borders.pop();
        CHOOSEDCELLS[step] = curr;

        if(curr.row === goal.row && curr.col === goal.col) {
            reached = true;
            break;
        }

        let currFind = [];
        for(let next of graph.get(`${curr.row},${curr.col}`)) {
            if(!visited[`${next.row},${next.col}`]) {
                borders.add(next, evrEval(goal, next)); // если еще не посетили - добавляем в клетки на границах с соотв. приоритетом
                PATH.set(`${next.row},${next.col}`, curr);
                visited[`${next.row},${next.col}`] = true;
                currFind.push(next);
            }
        }
        SEARCHAROUND.set(step, currFind);   // для текущего шага сохраняем, между какими клетакми проходил выбор
        step++;
    }

    if(reached) {
        getPath();
    } else {
        showError("Путь не найден ❌");
        document.getElementById("error").textContent = "Путь не найден";
    }
}

function instantShow() {
    GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.remove('reached');
    clearPreviousPath();
    AstarAlgo();
    displayPath();
    GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.add('reached');
}

// заполняет путь
function getPath() { 
    let curr = FINISHPOINT;
    curr = PATH.get(`${curr.row},${curr.col}`); 
    while(curr != STARTPOINT) {
        FINALPATH.push(curr);
        curr = PATH.get(`${curr.row},${curr.col}`); 
    }
}

function displayPath() {
    if(FINALPATH.length === 0) {
        getPath();
    }
    let curr = FINISHPOINT;
    curr = PATH.get(`${curr.row},${curr.col}`); 
    while(curr != STARTPOINT) {
        GRID.children[curr.row * SIZE + curr.col].classList.toggle('path');
        curr = PATH.get(`${curr.row},${curr.col}`); 
    }
}

function showAlgorhytm() {
    if(USERSTEP === 0) {
        GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.remove('reached');
        clearPreviousPath();
        AstarAlgo();
        getPath();
    }
    if(USERSTEP > 0) {
        if(USERSTEP >= SEARCHAROUND.size) {
            GRID.children[CHOOSEDCELLS[USERSTEP-1].row * SIZE + CHOOSEDCELLS[USERSTEP-1].col].classList.remove('curr');
            GRID.children[CHOOSEDCELLS[USERSTEP - 1].row * SIZE + CHOOSEDCELLS[USERSTEP - 1].col].classList.add('path');
            GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.add('reached');
            USERSTEP++;
            return;
        }

        GRID.children[CHOOSEDCELLS[USERSTEP - 1].row * SIZE + CHOOSEDCELLS[USERSTEP - 1].col].classList.add('path'); 
        for(let i of SEARCHAROUND.get(USERSTEP-1)) {                                                               
            GRID.children[i.row * SIZE + i.col].classList.remove('mark');
        }
        
        if(!FINALPATH.find(el => el.row === CHOOSEDCELLS[USERSTEP].row && el.col === CHOOSEDCELLS[USERSTEP].col)) {
            GRID.children[CHOOSEDCELLS[USERSTEP].row * SIZE + CHOOSEDCELLS[USERSTEP].col].classList.add('deadlock');
        }
    }
    GRID.children[CHOOSEDCELLS[USERSTEP].row * SIZE + CHOOSEDCELLS[USERSTEP].col].classList.add('path'); // клетка - главный герой

    for(let i of SEARCHAROUND.get(USERSTEP)) {
        GRID.children[i.row * SIZE + i.col].classList.add('mark');
    }
    USERSTEP++;
}

function clear() {
    PATH.clear();
    CHOOSEDCELLS = [];
    SEARCHAROUND.clear();
    FINALPATH = [];
    USERSTEP = 0;
}

async function showBySteps() {
    let delay = document.getElementById("inputDelay").value;
    USERSTEP = 0;

    while(USERSTEP <= SEARCHAROUND.size) {
        await new Promise(resolve => {
            setTimeout(() => {               
                showAlgorhytm();        
                resolve();
            }, delay);
        });
    }
}

function PrimAlgorhitm() {
    let startRow = Math.floor(Math.random() * SIZE);    // начинаем с рандомной клетки
    let startCol = Math.floor(Math.random() * SIZE);
    let queue = [];
    queue.push({row: startRow, col: startCol}); // добавляем в очередь, убираем статус стены
    
    PATHCELLS.push({row: startRow, col: startCol});
    GRID.children[startRow * SIZE + startCol].classList.remove('wall');
    PAINTEDCELLS.splice(PAINTEDCELLS.findIndex(cell => cell.row === startRow && cell.col === startCol), 1);


    while(queue.length > 0) {
        let current = queue.splice(Math.floor(Math.random() * queue.length), 1)[0]; // берём из очереди первую клетку
        let directions = [  // во всех направлениях выбираем клетку через стену
            [2,0],
            [0,2],
            [-2,0],
            [0,-2]
        ];

        for(let dir of directions) {
            // проверяем что выбранная клетка в пределах поля и ещё не является "тропинкой"
            if(current.row + dir[0] >= 0 && current.row + dir[0] < SIZE && current.col + dir[1] >= 0 && current.col + dir[1] < SIZE) {
                if(!PATHCELLS.some(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1])) {
                    
                    // если она действивтельно стена - пробуриваем к ней тропинку
                    GRID.children[(current.row + dir[0]) * SIZE + current.col + dir[1]].classList.remove('wall');
                    GRID.children[(current.row + dir[0]/2) * SIZE + current.col + dir[1]/2].classList.remove('wall');
                    
                    // убираем статус стены
                    PAINTEDCELLS.splice(PAINTEDCELLS.findIndex(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1]), 1);
                    PAINTEDCELLS.splice(PAINTEDCELLS.findIndex(cell => cell.row === current.row + dir[0]/2 && cell.col === current.col + dir[1]/2), 1);
                    
                    // добавляем в "тропинки"
                    PATHCELLS.push({row: current.row + dir[0], col: current.col + dir[1]});
                    PATHCELLS.push({row: current.row + dir[0]/2, col: current.col + dir[1]/2});
                    
                    // добавляем в очередь пикнутую по направлению клетку
                    queue.push({row: current.row + dir[0], col: current.col + dir[1]});
                }
            }
        }
    }
}

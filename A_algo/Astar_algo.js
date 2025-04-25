import * as utils from './Utils.js'

document.addEventListener('DOMContentLoaded', function() {
    getGrid();
});

document.getElementById("generate").addEventListener("click", getGrid);
document.getElementById("clear").addEventListener("click", clearField);
document.getElementById("start").addEventListener("click", instantShow);
document.getElementById("step").addEventListener("click", makeStep);
document.getElementById("showBySteps").addEventListener("click", showBySteps);
document.getElementById("close-error-modal").addEventListener("click", function() {utils.handleError(errorContainer)});

let errorContainer = document.getElementById("error-modal");
let messageHolder = document.getElementById("error-text");

const CELL_CLASSES = {
    WALL: 'wall',
    START: 'start',
    FINISH: 'finish',
    PATH: 'path',
    DEADLOCK: 'deadlock',
    MARK: 'mark',
    REACHED: 'reached',
    CURR: 'curr'
};

class Point {
    constructor(row, col) {
      this.row = row;
      this.col = col;
    }
  
    toString() {
      return `${this.row},${this.col}`;
    }
  
    equals(other) {
      return this.row === other.row && this.col === other.col;
    }
  }

let WALLS = [];
let SIZE;
let GRID;
let USERSTEP = 0;

let STARTPOINT = null;
let FINISHPOINT = null;

let PATH = new Map();       // клетки искомого пути ключ - текущая клетка, значение - клетка, из которой пришли
let FINALPATH = [];         // координаты клеток искомого пути
let CHOSENPOINTS = [];           // какая клетка пути выбиралась алгоритмом на каждой итерации
let NEIGHBOURSEXPLORED = new Map();       // отображение на экране - выбор между какими точками происходил на данном шаге

// генерируем поле (все клетки закрашены - это для алгоритма Прима)
function getGrid() {
    clear();
    STARTPOINT = null;
    FINISHPOINT = null;
    WALLS = [];
    
    GRID = document.getElementById('grid');
    SIZE = parseInt(document.getElementById('size').value);
    document.documentElement.style.setProperty('--size', SIZE);

    GRID.innerHTML= '';

    for (let i = 0; i < SIZE * SIZE; i++) {
        let cell = document.createElement('div'); // "клетка" представляет собой div, в который мы добавляем классы "👍"
        cell.classList.add('cell');
        cell.classList.add(CELL_CLASSES.WALL)

        const row = Math.floor(i / SIZE); 
        const col = i % SIZE;
        let currCell = new Point(row, col);

        WALLS.push(new Point(row, col));

        cell.addEventListener('click', function() { // лкм - ставим/убираем стену
            cell.classList.toggle(CELL_CLASSES.WALL);

            if (cell.classList.contains(CELL_CLASSES.WALL)) {
                WALLS.push(new Point(row, col));
            } else {
                const index = WALLS.findIndex(point => currCell.equals(point));
                if (index > -1) {
                    WALLS.splice(index, 1);
                }
            }
        });
        
        cell.addEventListener('contextmenu', function() { // на пкм ставим/убираем начальную/конечную точку
            if(cell.classList.contains(CELL_CLASSES.START)) {
                cell.classList.remove(CELL_CLASSES.START);
                STARTPOINT = null;
            }

            else {
                if(STARTPOINT === null) {
                    cell.classList.add(CELL_CLASSES.START);
                    STARTPOINT = new Point(row, col);
                }
            }

            if(cell.classList.contains(CELL_CLASSES.FINISH)) {
                cell.classList.remove(CELL_CLASSES.FINISH);
                FINISHPOINT = null;
            }

            else {
                if(FINISHPOINT === null && STARTPOINT !== null && !cell.classList.contains(CELL_CLASSES.START)) {
                    cell.classList.add(CELL_CLASSES.FINISH);
                    FINISHPOINT = new Point(row, col);
                }
            }

            if(cell.classList.contains(CELL_CLASSES.WALL)) {         // если там была стена - убираем
                cell.classList.remove(CELL_CLASSES.WALL);
                const index = WALLS.findIndex(point => currPoint.equals(point));
                if (index > -1) {
                    WALLS.splice(index, 1);
                }
            }
        });
        
        GRID.appendChild(cell);
    }
    
    utils.PrimAlgorhitm(GRID, WALLS, SIZE); // алгоритм Прима расчищает клетки-стены
}

// матрица смежности
function fillTheGraph() { 
    let graph = new Map();      
    for(let i = 0; i < SIZE; i++) {
        for(let j = 0; j < SIZE; j++) {
            let currPoint = new Point(i,j);
            if(!WALLS.find(point => currPoint.equals(point))) {
                graph.set(currPoint.toString(), getNeighbors(i, j));
            }
        }
    }
    return graph;
}

// соседи слева-снизу-справа-сверху
function getNeighbors(x, y) {
    let neigh = [];
    if(!WALLS.some(cell => cell.row === x+1 && cell.col === y) && x+1 < SIZE) {
        neigh.push(new Point(x+1, y));
    }
    if(!WALLS.some(cell => cell.row === x && cell.col === y+1) && y+1 < SIZE) {
        neigh.push(new Point(x, y+1));
    }
    if(!WALLS.some(cell => cell.row === x-1 && cell.col === y) && x-1 >= 0) {
        neigh.push(new Point(x-1, y));
    }
    if(!WALLS.some(cell => cell.row === x && cell.col === y-1) && y-1 >= 0) {
        neigh.push(new Point(x, y-1));
    }
    return neigh;
}

// эвристическая оценка - метрика Манхеттена - оцениваем расстояние до конечной точки
function manhattenDistance(a , b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function AstarAlgo() {
    clear();
    let graph = fillTheGraph();
    FINALPATH.push(STARTPOINT)
    FINALPATH.push(FINISHPOINT)

    let borders = new utils.PriorityQueue();

    let step = 0;
    let reached = false;
    let visited = new Set();

    PATH.set(STARTPOINT.toString(), 0);    
    borders.add(STARTPOINT, 0);

    while(!borders.isEmpty()) {
        let curr = borders.peek();
        borders.pop();
        CHOSENPOINTS[step] = curr;

        if(curr.equals(FINISHPOINT)) {
            reached = true;
            break;
        }

        let currFind = [];
        for(let next of graph.get(curr.toString())) {
            if(!visited.has(next.toString())) {
                borders.add(next, manhattenDistance(FINISHPOINT, next)); // если еще не посетили - добавляем в клетки на границах с соотв. приоритетом
                PATH.set(next.toString(), curr);
                visited.add(next.toString());
                currFind.push(next);
            }
        }
        NEIGHBOURSEXPLORED.set(step, currFind);   // для текущего шага сохраняем, между какими клетакми проходил выбор
        step++;
    }

    if(!reached) {
        utils.showError("Путь не найден ❌", errorContainer, messageHolder);
    }
}

// заполняет путь
function getPath() { 
    let curr = FINISHPOINT;
    curr = PATH.get(curr.toString()); 
    while(curr != STARTPOINT) {
        FINALPATH.push(curr);
        curr = PATH.get(curr.toString()); 
    }
}

function instantShow() {
    validateState();
    GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.remove(CELL_CLASSES.REACHED);
    clearPreviousPath();
    AstarAlgo();
    displayPath();
    GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.add(CELL_CLASSES.REACHED);
}

function makeStep() {
    if(USERSTEP === 0) {
        validateState();
        GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.remove(CELL_CLASSES.REACHED);
        clearPreviousPath();
        AstarAlgo();
        getPath();
    }
    if(USERSTEP > 0) {
        if(USERSTEP >= NEIGHBOURSEXPLORED.size) {
            GRID.children[CHOSENPOINTS[USERSTEP-1].row * SIZE + CHOSENPOINTS[USERSTEP-1].col].classList.remove(CELL_CLASSES.CURR);
            GRID.children[CHOSENPOINTS[USERSTEP - 1].row * SIZE + CHOSENPOINTS[USERSTEP - 1].col].classList.add(CELL_CLASSES.PATH);
            GRID.children[FINISHPOINT.row * SIZE + FINISHPOINT.col].classList.add(CELL_CLASSES.REACHED);
            USERSTEP++;
            return;
        }

        GRID.children[CHOSENPOINTS[USERSTEP - 1].row * SIZE + CHOSENPOINTS[USERSTEP - 1].col].classList.add(CELL_CLASSES.PATH); 
        for(let i of NEIGHBOURSEXPLORED.get(USERSTEP-1)) {                                                               
            GRID.children[i.row * SIZE + i.col].classList.remove(CELL_CLASSES.MARK);
        }
        
        if(!FINALPATH.find(el => el.row === CHOSENPOINTS[USERSTEP].row && el.col === CHOSENPOINTS[USERSTEP].col)) {
            GRID.children[CHOSENPOINTS[USERSTEP].row * SIZE + CHOSENPOINTS[USERSTEP].col].classList.add(CELL_CLASSES.DEADLOCK);
        }
    }
    GRID.children[CHOSENPOINTS[USERSTEP].row * SIZE + CHOSENPOINTS[USERSTEP].col].classList.add(CELL_CLASSES.PATH); // клетка - главный герой

    for(let i of NEIGHBOURSEXPLORED.get(USERSTEP)) {
        GRID.children[i.row * SIZE + i.col].classList.add(CELL_CLASSES.MARK);
    }
    USERSTEP++;
}

async function showBySteps() {
    validateState();
    let delay = document.getElementById("inputDelay").value;
    if(USERSTEP >= NEIGHBOURSEXPLORED.size) {
        USERSTEP = 0;
    }

    while(USERSTEP <= NEIGHBOURSEXPLORED.size) {
        await new Promise(resolve => {
            setTimeout(() => {               
                makeStep();        
                resolve();
            }, delay);
        });
    }
}

function displayPath() {
    if(FINALPATH.length === 0) {
        getPath();
    }
    let curr = FINISHPOINT;
    curr = PATH.get(curr.toString()); 
    while(curr != STARTPOINT) {
        GRID.children[curr.row * SIZE + curr.col].classList.toggle(CELL_CLASSES.PATH);
        curr = PATH.get(curr.toString()); 
    }
}

function validateState() {
    if(STARTPOINT === null || FINISHPOINT === null) {
        clearPreviousPath();
        utils.showError("Поставьте точки начала и конца 🙏", errorContainer, messageHolder);
        return;
    }
}

function clear() {
    PATH.clear();
    CHOSENPOINTS = [];
    NEIGHBOURSEXPLORED.clear();
    FINALPATH = [];
    USERSTEP = 0;
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
    CHOSENPOINTS = [];
    NEIGHBOURSEXPLORED.clear();
    FINALPATH = [];
    USERSTEP = 0;
}
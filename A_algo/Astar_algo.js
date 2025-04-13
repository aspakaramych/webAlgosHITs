import {
    PriorityQueue
} from './PriorityQueue.js'

document.getElementById("generate").addEventListener("click", getGrid);
document.getElementById("clear").addEventListener("click", clearField);
document.getElementById("start").addEventListener("click", instantShow);
document.getElementById("step").addEventListener("click", showAlgorhytm);
document.getElementById("showBySteps").addEventListener("click", showBySteps);
document.getElementById("ok").addEventListener("click", handleError);

let errorContainer = document.getElementById("error_container");
let message = document.getElementById("message");

function showError(errorMessage) {
    errorContainer.style.display = 'flex';
    message.innerHTML = errorMessage;
}

function handleError() {
    errorContainer.style.display = 'none';
}

function clearField() {
    grid.children[startPoint.row * size + startPoint.col].classList.remove('start');
    grid.children[finishPoint.row * size + finishPoint.col].classList.remove('finish');
    grid.children[finishPoint.row * size + finishPoint.col].classList.remove('reached');
    grid.children[finishPoint.row * size + finishPoint.col].classList.remove('mark');

    for(let cell of finalPath) {
        grid.children[cell.row * size + cell.col].classList.remove('path');
    }

    for(let ddlc of deadlocks) {
        grid.children[ddlc.row * size + ddlc.col].classList.remove('path');
        grid.children[ddlc.row * size + ddlc.col].classList.remove('deadlock');
    }

    if(find.has(userStep-1)) {
        for(let i of find.get(userStep-1)) {                                                               
            grid.children[i.row * size + i.col].classList.remove('mark');
        }
    }
    
    startPoint = null;
    finishPoint = null;
    path.clear();
    choosed = [];
    find.clear();
    finalPath = [];
    userStep = 0;
}

let paintedCells = [];
let pathCells = [];
let size;
let grid;
let userStep = 0;

let startPoint = null;
let finishPoint = null;

document.addEventListener('DOMContentLoaded', function() {
    getGrid();
});

// генерируем поле (все клетки закрашены - это для алгоритма Прима)
function getGrid() {
    clear();
    paintedCells = [];
    pathCells = [];
    grid = document.getElementById('grid');
    size = parseInt(document.getElementById('size').value);
    document.documentElement.style.setProperty('--size', size);

    grid.innerHTML= '';

    for (let i = 0; i < size * size; i++) {

        let cell = document.createElement('div'); // "клетка" представляет собой div, в который мы добавляем классы "👍"
        cell.classList.add('cell');
        cell.classList.add('wall')

        const row = Math.floor(i / size); 
        const col = i % size;
        paintedCells.push({ row, col });

        cell.addEventListener('click', function() { // лкм - ставим/убираем стену
            cell.classList.toggle('wall');

            if (cell.classList.contains('wall')) {
                paintedCells.push({ row, col });
            } else {
                const index = paintedCells.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    paintedCells.splice(index, 1);
                }
            }
        });
        
        cell.addEventListener('contextmenu', function() { // на пкм ставим/убираем начальную/конечную точку
            if(cell.classList.contains('start')) {
                cell.classList.remove('start');
                startPoint = null;
            }
            else {
                if(startPoint === null) {
                    cell.classList.add('start');
                    startPoint = {row: row, col: col};
                }
            }
            if(cell.classList.contains('finish')) {
                cell.classList.remove('finish');
                finishPoint = null;
            }
            else {
                if(finishPoint === null && startPoint !== null && !cell.classList.contains('start')) {
                    cell.classList.add('finish');
                    finishPoint = {row: row, col: col};
                }
            }

            if(cell.classList.contains('wall')) {         // если там была стена - убираем
                cell.classList.remove('wall');
                const index = paintedCells.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    paintedCells.splice(index, 1);
                }
            }
        });
        
        grid.appendChild(cell);
    }
    PrimAlgorhitm(); // алгоритм Прима расчищает клетки-стены
}

let graph = new Map();

function fillTheGraph() {       
    graph.clear();
    for(let i = 0; i < size; i++) {
        for(let j = 0; j < size; j++) {
            if(!paintedCells.some(cell => cell.row === i && cell.col === j)) {  // для каждой клетки-не-стены добавляем соседей
                graph.set(`${i},${j}`, getNeighbors(i, j));
            }
        }
    }
}

function getNeighbors(x, y) {   // соседи слева-снизу-справа-сверху
    let neigh = [];
    if(!paintedCells.some(cell => cell.row === x+1 && cell.col === y) && x+1 < size) {
        neigh.push({row: x+1, col: y});
    }
    if(!paintedCells.some(cell => cell.row === x && cell.col === y+1) && y+1 < size) {
        neigh.push({row: x, col: y+1});
    }
    if(!paintedCells.some(cell => cell.row === x-1 && cell.col === y) && x-1 >= 0) {
        neigh.push({row: x-1, col: y});
    }
    if(!paintedCells.some(cell => cell.row === x && cell.col === y-1) && y-1 >= 0) {
        neigh.push({row: x, col: y-1});
    }
    return neigh;
}

function evrEval(a , b) {   // эвристическая оценка - метрика Манхеттена - оцениваем расстояние до конечной точки
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

let path = new Map();       // клетки искомого пути ключ - текущая клетка, значение - клетка, из которой пришли
let finalPath = [];         // координаты клеток искомого пути
let choosed = [];           // какая клетка выбиралась алгоритмом на каждой итерации
let find = new Map();       // отображение на экране - выбор между какими точками происходил на данном шаге
let deadlocks = [];

function AstarAlgo() {
    if(startPoint === null || finishPoint === null) {
        showError("Поставьте точки начала и конца 🙏");
        return;
    }
    clear();
    fillTheGraph();
    finalPath.push(startPoint)
    finalPath.push(finishPoint)

    let borders = new PriorityQueue();

    let start = startPoint;
    let goal = finishPoint;
    let step = 0;
    let reached = false;
    let visited = [];

    path.set(`${start.row},${start.col}`, 0);    
    borders.add(start, 0);

    while(!borders.isEmpty()) {
        let curr = borders.peek();
        borders.pop();
        choosed[step] = curr;

        if(curr.row === goal.row && curr.col === goal.col) {
            reached = true;
            break;
        }

        let currFind = [];
        for(let next of graph.get(`${curr.row},${curr.col}`)) {
            if(!visited[`${next.row},${next.col}`]) {
                borders.add(next, evrEval(goal, next)); // если еще не посетили - добавляем в клетки на границах с соотв. приоритетом
                path.set(`${next.row},${next.col}`, curr);
                visited[`${next.row},${next.col}`] = true;
                currFind.push(next);
            }
        }
        find.set(step, currFind);   // для текущего шага сохраняем, между какими клетакми проходил выбор
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
    AstarAlgo();
    displayPath();
    grid.children[finishPoint.row * size + finishPoint.col].classList.add('reached');
}

// отображает путь
function getPath() { 
    let curr = finishPoint;
    curr = path.get(`${curr.row},${curr.col}`); 
    while(curr != startPoint) {
        finalPath.push(curr);
        // grid.children[curr.row * size + curr.col].classList.toggle('path');
        curr = path.get(`${curr.row},${curr.col}`); 
    }
}

function displayPath() {
    if(finalPath.length === 0) {
        getPath();
    }
    let curr = finishPoint;
    curr = path.get(`${curr.row},${curr.col}`); 
    while(curr != startPoint) {
        grid.children[curr.row * size + curr.col].classList.toggle('path');
        curr = path.get(`${curr.row},${curr.col}`); 
    }
}

function showAlgorhytm() {
    if(path.size == 0) {
        AstarAlgo();
        getPath();
    }
    if(userStep > 0) {
        if(userStep >= find.size) {
            grid.children[choosed[userStep-1].row * size + choosed[userStep-1].col].classList.remove('curr');
            grid.children[choosed[userStep - 1].row * size + choosed[userStep - 1].col].classList.add('path');
            grid.children[finishPoint.row * size + finishPoint.col].classList.add('reached');
            userStep++;
            return;
        }

        grid.children[choosed[userStep - 1].row * size + choosed[userStep - 1].col].classList.add('path'); 
        for(let i of find.get(userStep-1)) {                                                               
            grid.children[i.row * size + i.col].classList.remove('mark');
        }
        
        if(!finalPath.find(el => el.row === choosed[userStep].row && el.col === choosed[userStep].col)) {
            grid.children[choosed[userStep].row * size + choosed[userStep].col].classList.add('deadlock');
            deadlocks.push(choosed[userStep]);
        }
    }
    grid.children[choosed[userStep].row * size + choosed[userStep].col].classList.add('path'); // клетка - главный герой

    for(let i of find.get(userStep)) {
        grid.children[i.row * size + i.col].classList.add('mark');
    }
    userStep++;
}

function clear() {
    path.clear();
    choosed = [];
    find.clear();
    finalPath = [];
    userStep = 0;
}

async function showBySteps() {
    let delay = document.getElementById("inputDelay").value;
    if(path.size == 0) {
        AstarAlgo();
        getPath();
        getPath();
    }

    while(userStep <= find.size) {
        await new Promise(resolve => {      // устанавливаем пользовательскую задержку 
            setTimeout(() => {              // await ждёт вызова resolve() 
                showAlgorhytm();        
                resolve();
            }, delay);
        });
    }
}

function PrimAlgorhitm() {
    let startRow = Math.floor(Math.random() * size);    // начинаем с рандомной клетки
    let startCol = Math.floor(Math.random() * size);
    let queue = [];
    queue.push({row: startRow, col: startCol}); // добавляем в очередь, убираем статус стены
    
    pathCells.push({row: startRow, col: startCol});
    grid.children[startRow * size + startCol].classList.remove('wall');
    paintedCells.splice(paintedCells.findIndex(cell => cell.row === startRow && cell.col === startCol), 1);


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
            if(current.row + dir[0] >= 0 && current.row + dir[0] < size && current.col + dir[1] >= 0 && current.col + dir[1] < size) {
                if(!pathCells.some(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1])) {
                    
                    // если она действивтельно стена - пробуриваем к ней тропинку
                    grid.children[(current.row + dir[0]) * size + current.col + dir[1]].classList.remove('wall');
                    grid.children[(current.row + dir[0]/2) * size + current.col + dir[1]/2].classList.remove('wall');
                    
                    // убираем статус стены
                    paintedCells.splice(paintedCells.findIndex(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1]), 1);
                    paintedCells.splice(paintedCells.findIndex(cell => cell.row === current.row + dir[0]/2 && cell.col === current.col + dir[1]/2), 1);
                    
                    // добавляем в "тропинки"
                    pathCells.push({row: current.row + dir[0], col: current.col + dir[1]});
                    pathCells.push({row: current.row + dir[0]/2, col: current.col + dir[1]/2});
                    
                    // добавляем в очередь пикнутую по направлению клетку
                    queue.push({row: current.row + dir[0], col: current.col + dir[1]});
                }
            }
        }
    }
}

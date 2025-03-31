import {
    PriorityQueue
} from './PriorityQueue.js'

document.getElementById("generate").addEventListener("click", getGrid);
document.getElementById("start").addEventListener("click", AstarAlgo);
document.getElementById("step").addEventListener("click", showAlgorhytm);
document.getElementById("showBySteps").addEventListener("click", showBySteps);

let paintedCells = [];
let pathCells = [];
let mainCells = [];
let size;
let grid;
let userStep = 0;

// генерируем поле (все клетки закрашены - это для алгоритма Прима)
function getGrid() {
    clear();
    paintedCells = [];
    mainCells = [];
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
            cell.classList.toggle('main');

            if(cell.classList.contains('wall')) {         // если там была стена - убираем
                cell.classList.remove('wall');
                const index = paintedCells.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    paintedCells.splice(index, 1);
                }
            }

            if(cell.classList.contains('main')) {
                if(mainCells.length < 2) {                 // если "главных" точек <= 2 - всё ок, иначе - выдаём ошибку
                    mainCells.push({row, col});
                    document.getElementById("error").textContent = "";
                } else {
                    cell.classList.toggle('main');
                    document.getElementById("error").textContent = "Главных точек должно быть две - начальная и конечная";
                }
            } else {
                const index = mainCells.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    mainCells.splice(index);
                }
            }
        });
        
        grid.appendChild(cell);
    }
    PrimAlgorhitm(); // алгоритм Прима расчиащает клетки-стены
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

let path = new Map();       // клетки искомого пути
let finalPath = [];         // координаты клеток искомого пути
let choosed = [];           // какая клетка выбиралась алгоритмом на каждой итерации
let find = new Map();       // отображение на экране - выбор между какими точками происходил на данном шаге

function AstarAlgo() {
    if(mainCells.length < 2) {
        document.getElementById("error").textContent = "Главных точек должно быть две - начальная и конечная";
        return;
    }
    clear();
    fillTheGraph();

    let borders = new PriorityQueue();

    let start = mainCells[0];
    let goal = mainCells[1];
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
                borders.add(next, evrEval(goal, next));
                path.set(`${next.row},${next.col}`, curr);
                visited[`${next.row},${next.col}`] = true;
                currFind.push(next);
            }
        }
        find.set(step, currFind);
        step++;
    }

    if(reached) {
        getPath();  
    } else {
        document.getElementById("error").textContent = "Путь не найден";
    }
}

function getPath() {
    let curr = mainCells[1];
    curr = path.get(`${curr.row},${curr.col}`); 
    while(curr != mainCells[0]) {
        finalPath.push(`${curr.row},${curr.col}`);
        grid.children[curr.row * size + curr.col].classList.toggle('path');
        curr = path.get(`${curr.row},${curr.col}`); 
    }
}

function isNear(x1, y1, x2, y2) {
    return ((Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1) && !(Math.abs(x1 - x2) == 1 && Math.abs(y1 - y2) == 1));
}

async function showAlgorhytm() {
    if(path.size == 0) {
        AstarAlgo();
        AstarAlgo();
    }
    if(userStep > 0) {
        if(userStep >= find.size) {
            return;
        }
        grid.children[choosed[userStep-1].row * size + choosed[userStep-1].col].classList.remove('curr');  // снимаем полномочия лидирующей клетки с предыдущей
        grid.children[choosed[userStep - 1].row * size + choosed[userStep - 1].col].classList.add('show'); // текущие пройденные клетки (это
        for(let i of find.get(userStep-1)) {                                                               // при выборе последовательной анимации)
            grid.children[i.row * size + i.col].classList.remove('mark'); // помечаем точки, между готорыми происхожит выбор
        }
        // если прошлая клетка не рядом с текущей - она считается тупиком, или "невыгодной точке на текущем шагу" - 
        // может быть, к ней ещё вернёмся
        if(!isNear(choosed[userStep - 1].row, choosed[userStep - 1].col, choosed[userStep].row, choosed[userStep].col) && !finalPath.find(el => el ==`${choosed[userStep - 1].row},${choosed[userStep - 1].col}`)) {
            grid.children[choosed[userStep-1].row * size + choosed[userStep-1].col].classList.add('deadlock');
        }
    }
    grid.children[choosed[userStep].row * size + choosed[userStep].col].classList.add('curr'); // клетка - главный герой

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
}

async function showBySteps() {
    let delay = document.getElementById("inputDelay").value;
    userStep = 0;
    if(path.size == 0) {
        AstarAlgo();
        AstarAlgo();
    }

    while(userStep < find.size) {
        await new Promise(resolve => {      // устанавливаем пользовательскую задержку 
            setTimeout(() => {              // await ждёт вызова resolve() 
                showAlgorhytm();        
                resolve();
            }, delay);
        });
    }
}

function PrimAlgorhitm() {
    let startRow = Math.floor(Math.random() * size);
    let startCol = Math.floor(Math.random() * size);
    let queue = [];
    queue.push({row: startRow, col: startCol});
    
    pathCells.push({row: startRow, col: startCol});
    grid.children[startRow * size + startCol].classList.remove('wall');
    paintedCells.splice(paintedCells.findIndex(cell => cell.row === startRow && cell.col === startCol), 1);


    while(queue.length > 0) {
        let current = queue.splice(Math.floor(Math.random() * queue.length), 1)[0];
        let directions = [
            [2,0],
            [0,2],
            [-2,0],
            [0,-2]
        ];

        for(let dir of directions) {
            if(current.row + dir[0] >= 0 && current.row + dir[0] < size && current.col + dir[1] >= 0 && current.col + dir[1] < size) {
                if(!pathCells.some(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1])) {
                    
                    grid.children[(current.row + dir[0]) * size + current.col + dir[1]].classList.remove('wall');
                    grid.children[(current.row + dir[0]/2) * size + current.col + dir[1]/2].classList.remove('wall');

                    paintedCells.splice(paintedCells.findIndex(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1]), 1);
                    paintedCells.splice(paintedCells.findIndex(cell => cell.row === current.row + dir[0]/2 && cell.col === current.col + dir[1]/2), 1);

                    pathCells.push({row: current.row + dir[0], col: current.col + dir[1]});
                    pathCells.push({row: current.row + dir[0]/2, col: current.col + dir[1]/2});

                    queue.push({row: current.row + dir[0], col: current.col + dir[1]});
                }
            }
        }
    }
}

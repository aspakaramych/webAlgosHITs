import {
    PriorityQueue
} from './PriorityQueue.js'

document.getElementById("generate").addEventListener("click", getGrid);
document.getElementById("start").addEventListener("click", AstarAlgo);
document.getElementById("step").addEventListener("click", showAlgorhytm);

let paintedCells = [];
let mainCells = [];
let size;
let grid;
let userStep = 0;
function getGrid() {
    paintedCells = [];
    mainCells = [];
    grid = document.getElementById('grid');
    size = parseInt(document.getElementById('size').value);
    document.documentElement.style.setProperty('--size', size);

    grid.innerHTML= '';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        if(Math.random() > 0.5) {
            cell.classList.toggle('active');
            const row = Math.floor(i / size); 
            const col = i % size;
            paintedCells.push({ row, col });
        }

        cell.addEventListener('click', function() {
            cell.classList.toggle('active');

            const row = Math.floor(i / size); 
            const col = i % size;

            if (cell.classList.contains('active')) {
                paintedCells.push({ row, col });
            } else {
                const index = paintedCells.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    paintedCells.splice(index, 1);
                }
            }
        });
        
        cell.addEventListener('contextmenu', function() {
            cell.classList.toggle('main');

            const row = Math.floor(i / size); 
            const col = i % size;

            if(cell.classList.contains('active')) {
                cell.classList.remove('active');
                const index = paintedCells.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    paintedCells.splice(index, 1);
                }
            }

            if(cell.classList.contains('main')) {
                if(mainCells.length < 2) {
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
        
        grid.appendChild(cell); // Добавляем клетку в контейнер
    }

}

let graph = new Map();

function fillTheGraph() {
    graph.clear();
    for(let i = 0; i < size; i++) {
        for(let j = 0; j < size; j++) {
            if(!paintedCells.some(cell => cell.row === i && cell.col === j)) {
                graph.set(`${i},${j}`, getNeighbors(i, j));
            }
        }
    }
}

function getNeighbors(x, y) {
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

function evrEval(a , b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

let path = new Map();
let finalPath = [];
let choosed = [];
let find = new Map();

function AstarAlgo() {
    console.log(mainCells);
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
        borders.get();
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

function showAlgorhytm() {
    console.log(userStep);
    if(path.size == 0) {
        AstarAlgo();
        AstarAlgo();
    }
    if(userStep > 0) {
        grid.children[choosed[userStep-1].row * size + choosed[userStep-1].col].classList.remove('curr');
        grid.children[choosed[userStep - 1].row * size + choosed[userStep - 1].col].classList.add('show');
        for(let i of find.get(userStep-1)) {
            grid.children[i.row * size + i.col].classList.remove('mark');
        }
        if(!isNear(choosed[userStep - 1].row, choosed[userStep - 1].col, choosed[userStep].row, choosed[userStep].col) && !finalPath.find(el => el ==`${choosed[userStep - 1].row},${choosed[userStep - 1].col}`)) {
            grid.children[choosed[userStep-1].row * size + choosed[userStep-1].col].classList.add('deadlock');
        }
    }
    grid.children[choosed[userStep].row * size + choosed[userStep].col].classList.add('curr');

    for(let i of find.get(userStep)) {
        grid.children[i.row * size + i.col].classList.add('mark');
    }
    userStep++;
}

function clear() {
    path.clear();
    choosed = [];
    find.clear();
}

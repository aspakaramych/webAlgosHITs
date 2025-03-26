document.getElementById("generate").addEventListener("click", getGrid);
// document.getElementById("getNeigh").addEventListener('click', fillTheGraph);
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
            if(cell.classList.contains('active')) {
                cell.classList.toggle('active');
            }
            cell.classList.toggle('main');

            const row = Math.floor(i / size); 
            const col = i % size;

            if(cell.classList.contains('main')) {
                if(mainCells.length < 2) {
                    mainCells.push({row, col});
                    // console.log(mainCells);
                    document.getElementById("error").textContent = "";
                } else {
                    cell.classList.toggle('main');
                    document.getElementById("error").textContent = "Главных точек может быть только две - начальная и конечная";
                }
            } else {
                // document.getElementById("error").textContent = "";
                const index = mainCells.findIndex(cell => cell.row === row && cell.col === col);
                if (index > -1) {
                    mainCells.splice(index);
                }
            }
        });
        
        grid.appendChild(cell); // Добавляем клетку в контейнер
    }

    // console.log(paintedCells);  
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
    // console.log(graph);
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
    // console.log(x + ' ,' + y + ': \n' + neigh);
    return neigh;
}

function evrEval(a , b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

class PriorityQueue {
    constructor() {
        this.items = [];
    }

    add(element, priority) {
        const queueElement = { element, priority };
        let added = false;

        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(queueElement);
        }
    }

    get() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.shift().element;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    peek() {
        if (this.isEmpty()) {
            return null
        }
        return this.items[0].element;
    }

    size() {
        return this.items.length;
    }
}
let path = new Map();

let choosed = [];
let find = new Map();

function AstarAlgo() {
    path.clear();
    fillTheGraph();
    borders = new PriorityQueue();
    let start = mainCells[0];
    let goal = mainCells[1];
    path.set(`${start.row},${start.col}`, 0);    
    borders.add(start, 0);
    let visited = [];
    let reached = false;

    let step = 0;

    while(!borders.isEmpty()) {
        curr = borders.peek();
        borders.get();
        choosed[step] = curr;

        if(curr.row === goal.row && curr.col === goal.col) {
            reached = true;
            break;
        }
        // console.log(graph);
        // console.log(curr);
        // console.log(graph.get(`${curr.row},${curr.col}`));
        currFind = [];
        for(let next of graph.get(`${curr.row},${curr.col}`)) {
            // console.log(next);
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
    console.log(choosed);
    console.log(find);
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
        // let cell = document.createElement('div');
        // cell.classList.toggle('path');
        grid.children[curr.row * size + curr.col].classList.toggle('path');
        curr = path.get(`${curr.row},${curr.col}`); 
        // console.log(curr);
    }
}

function isNear(x1, y1, x2, y2) {
    return (Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1);
}

function showAlgorhytm() {
    console.log(userStep);
    if(path.size == 0) {
        AstarAlgo();
        AstarAlgo();
    }
    if(userStep > 0) {
        grid.children[choosed[userStep - 1].row * size + choosed[userStep - 1].col].classList.add('path');
        for(let i of find.get(userStep-1)) {
            grid.children[i.row * size + i.col].classList.remove('mark');
        }
        if(!isNear(choosed[userStep - 1].row, choosed[userStep - 1].col, choosed[userStep].row, choosed[userStep].col)) {
            grid.children[choosed[userStep-1].row * size + choosed[userStep-1].col].classList.add('deadlock');              //TODO: если не visited - помечать
        }
    }
    grid.children[choosed[userStep].row * size + choosed[userStep].col].classList.add('curr');

    for(let i of find.get(userStep)) {
        grid.children[i.row * size + i.col].classList.add('mark');
    }
    userStep++;
}

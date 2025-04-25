export function showError(errorMessage, errorContainer, messageHolder) {
    errorContainer.style.display = 'flex';
    messageHolder.innerHTML = errorMessage;
}

export function handleError(errorContainer) {
    errorContainer.style.display = 'none';
}

export function PrimAlgorhitm(grid, walls, size) {
    let startRow = Math.floor(Math.random() * size);    // начинаем с рандомной клетки
    let startCol = Math.floor(Math.random() * size);
    let queue = [];
    queue.push({row: startRow, col: startCol}); // добавляем в очередь, убираем статус стены
    
    let availableCells = [];
    availableCells.push({row: startRow, col: startCol});
    grid.children[startRow * size + startCol].classList.remove('wall');
    walls.splice(walls.findIndex(cell => cell.row === startRow && cell.col === startCol), 1);


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
                if(!availableCells.some(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1])) {
                    
                    // если она действивтельно стена - пробуриваем к ней тропинку
                    grid.children[(current.row + dir[0]) * size + current.col + dir[1]].classList.remove('wall');
                    grid.children[(current.row + dir[0]/2) * size + current.col + dir[1]/2].classList.remove('wall');
                    
                    // убираем статус стены
                    walls.splice(walls.findIndex(cell => cell.row === current.row + dir[0] && cell.col === current.col + dir[1]), 1);
                    walls.splice(walls.findIndex(cell => cell.row === current.row + dir[0]/2 && cell.col === current.col + dir[1]/2), 1);
                    
                    // добавляем в "тропинки"
                    availableCells.push({row: current.row + dir[0], col: current.col + dir[1]});
                    availableCells.push({row: current.row + dir[0]/2, col: current.col + dir[1]/2});
                    
                    // добавляем в очередь пикнутую по направлению клетку
                    queue.push({row: current.row + dir[0], col: current.col + dir[1]});
                }
            }
        }
    }
}

export class PriorityQueue {
    constructor() {
        this.coords = [];
    }

    add(element, priority) {
        let newElement = { element, priority };
        let isInserted = false;

        for (let i = 0; i < this.coords.length; i++) {
            if (newElement.priority < this.coords[i].priority) {
                this.coords.splice(i, 0, newElement);
                isInserted = true;
                break;
            }
        }

        if (!isInserted) {
            this.coords.push(newElement);
        }
    }

    pop() {
        if (this.isEmpty()) {
            return null;
        }
        return this.coords.shift().element;
    }

    isEmpty() {
        return this.coords.length == 0;
    }

    peek() {
        if (this.isEmpty()) {
            return null
        }
        return this.coords[0].element;
    }

    size() {
        return this.coords.length;
    }
}

export class Queue {
    constructor() {
        this.coords = [];
    }

    add(element) {
        let newElement = element;
        this.coords.splice(this.coords.length, 0, newElement);
    }

    pop() {
        if (this.isEmpty()) {
            return null;
        }
        return this.coords.shift();
    }

    isEmpty() {
        return this.coords.length == 0;
    }

    peek() {
        if (this.isEmpty()) {
            return null
        }
        return this.coords[0].element;
    }

    size() {
        return this.coords.length;
    }
}
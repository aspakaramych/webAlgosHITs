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
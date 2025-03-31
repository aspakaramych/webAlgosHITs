let colony = [];
let cnt_ants = 2500;
let cnt_iter = 100000;
let ants = [];
let ants_positions = [];
let render = 1;
let mode = 'colony';
let food_sources = [];

function delay(ms) {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

document.addEventListener('DOMContentLoaded', () => {
    let table = document.getElementById('table');
    let startButton = document.getElementById('startButton');
    let foodButton = document.getElementById('foodButton');

    function addColony(event) {
        const x = event.offsetX;
        const y = event.offsetY;

        let colony_view = document.createElement('div');
        colony_view.id = 'colony';

        colony_view.style.left = `${x}px`;
        colony_view.style.top = `${y}px`;

        table.appendChild(colony_view);

        colony.push(x);
        colony.push(y);
    }

    function addFood(event) {
        const x = event.offsetX;
        const y = event.offsetY;

        let foodView = document.createElement('div');
        foodView.className = 'food';

        foodView.style.left = `${x}px`;
        foodView.style.top = `${y}px`;

        table.appendChild(foodView);

        // Сохраняем координаты и питательность еды
        const nutrition = Math.floor(Math.random() * 50 + 50); // Случайная питательность от 50 до 100
        food_sources.push({ x, y, nutrition });
    }

    table.addEventListener('click', (event) => {
        if (mode === 'colony') addColony(event);
        if (mode === 'food') addFood(event);
    })

    startButton.addEventListener('click', () => {
        for (let i = 0; i < cnt_ants; i++) {
            let ant = document.createElement('div');
            ant.className = 'ant';

            ant.style.left = `${colony[0]}px`;
            ant.style.top = `${colony[1]}px`;

            table.appendChild(ant);

            ants.push(ant);

            let x = colony[0];
            let y = colony[1];
            ants_positions.push({x, y});
        }
        search();
    })

    foodButton.addEventListener('click', () => {
        mode = 'food';
    })

    function search() {
        const width = table.clientWidth;
        const height = table.clientHeight;

        async function alghorithm() {
            for (let i = 0; i < cnt_iter; i++) {
                for (let j = 0; j < cnt_ants; j++) {
                    let direct = Math.random();
                    if (direct <= 0.25) ants_positions[j].y--;
                    else if (direct <= 0.5) ants_positions[j].x++;
                    else if (direct <= 0.75) ants_positions[j].y++;
                    else ants_positions[j].x--;

                    ants_positions[j].x = Math.max(0, Math.min(width, ants_positions[j].x));
                    ants_positions[j].y = Math.max(0, Math.min(height, ants_positions[j].y));
                }

                for (let j = 0; j < cnt_ants; j++) {
                    ants[j].style.left = `${ants_positions[j].x}px`;
                    ants[j].style.top = `${ants_positions[j].y}px`;
                }

                if (i % 10 === 0) await delay(render);
            }
        }
        alghorithm();
    }
})
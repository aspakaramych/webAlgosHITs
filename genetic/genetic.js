document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('table');

    table.addEventListener('click', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;

        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;

        table.appendChild(dot);

        console.log(`dot ${x} ${y}`);
    })
})
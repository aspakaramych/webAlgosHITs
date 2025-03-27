document.addEventListener('DOMContentLoaded', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const table = document.getElementById('table');

    table.style.width = `${width}px`;
    table.style.height = `${Math.round(height * 0.7)}px`;
})
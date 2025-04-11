document.addEventListener('DOMContentLoaded', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const table = document.getElementById('table');

    table.style.width = `${Math.round(height * 0.7)}px`;
    table.style.height = `${Math.round(height * 0.7)}px`;
})
let max_pheromones = 1000;

export let colors = {
    'orange': [255, 165, 0, 255],
    'black': [0, 0, 0, 255],
    'green': [0, 128, 0, 255],
    'deepgreen': [0, 255, 0, 255],
    'white': [255, 255, 255, 255],
    'pink': [255, 20, 147, 255],
    'blue': [0, 0, 255, 255],
    'gray': [128, 128, 128, 255],
}

export function generateColony(colony, cnt_ants) {
    let ants = [];
    for (let i = 0; i < cnt_ants; i++) {
        let x = colony[0];
        let y = colony[1];
        let state = 'search';
        let nutrition = 1000;
        let memory = [];
        let steps = 1;
        ants.push({ x, y, state, nutrition, memory, steps });
    }
    return ants;
}

export function correctPos(height, width, x, y, d) {
    let newX = x + d[0], newY = y + d[1];
    if (newX < 0 || newX >= width) newX = x - d[0];
    if (newY < 0 || newY >= height) newY = y - d[1];
    return [newX, newY];
}

export function drawRect(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.closePath();
}

export function changeColorPixel(ctx, x, y, color) {
    const imageData = ctx.getImageData(x, y, 1, 1);
    let data = imageData.data;

    data[0] = color[0];
    data[1] = color[1];
    data[2] = color[2];
    data[3] = color[3];

    ctx.putImageData(imageData, x, y);
}

export function updatePixel(ctx, matrix, x, y) {
    let ceil = matrix[x][y];
    if (ceil.ants > 0) changeColorPixel(ctx, x, y, colors['black']);
    else if (ceil.obstacle) changeColorPixel(ctx, x, y, colors['gray']);
    else if (ceil.food > 0) changeColorPixel(ctx, x, y, colors['green']);
    else if (ceil.colony === true) changeColorPixel(ctx, x, y, colors['orange']);
    else if (ceil.pheromones_food > 0 && ceil.pheromones_food > 10) changeColorPixel(ctx, x, y, colorIntensity(colors['deepgreen'], matrix[x][y].pheromones_food, max_pheromones));
    else if (ceil.pheromones_home > 0) changeColorPixel(ctx, x, y, colorIntensity(colors['blue'], matrix[x][y].pheromones_home, max_pheromones));
    else changeColorPixel(ctx, x, y, colors['white']);
}

export function colorIntensity(color, value, max) {
    let newColor = [...color];
    newColor[3] = Math.min(Math.floor(value / max * 255), 255);
    return newColor;
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function drawGrid(ctx, matrix, cellSize) {
    const rows = matrix.length;
    const cols = matrix[0].length;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (matrix[i][j] === 1) {
                ctx.fillStyle = 'black'; // Препятствие
            } else {
                ctx.fillStyle = 'white'; // Проход
            }
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
}

export function generatePerlinMaze(rows, cols, scale, threshold) {
    const maze = [];

    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const value = perlin.get(i / scale, j / scale);
            row.push(Math.abs(value) > threshold ? 1 : 0);
        }
        maze.push(row);
    }


    maze[0][0] = 0;
    maze[rows - 1][cols - 1] = 0;

    return maze;
}
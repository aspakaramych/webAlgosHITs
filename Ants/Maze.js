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
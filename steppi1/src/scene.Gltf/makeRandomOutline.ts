export function makeRandomOutline(random: () => number): number[] | undefined {
    // Define the grid size (multiple of two for walls)
    const gridWidth = Math.floor((random() % 5) + 3) * 2;
    const gridHeight = Math.floor((random() % 7) + 3) * 2;

    // Create the grid and initialize as empty
    const grid: boolean[][] = Array.from({ length: gridHeight }, () =>
        Array(gridWidth).fill(false)
    );

    // Randomly place rectangles
    const rectangleCount = Math.floor(random() % 4) + 1;
    for (let i = 0; i < rectangleCount; i++) {
        const rectWidth = Math.floor((random() % (gridWidth / 2 - 1)) + 1) * 2; // Width as multiple of 2
        const rectHeight =
            Math.floor((random() % (gridHeight / 2 - 1)) + 1) * 2; // Height as multiple of 2

        const startX = Math.floor((random() % (gridWidth - rectWidth)) * 0.5);
        const startY = Math.floor((random() % (gridHeight - rectHeight)) * 0.5);

        for (let y = startY; y < startY + rectHeight; y++) {
            for (let x = startX; x < startX + rectWidth; x++) {
                grid[y][x] = true; // Mark the grid cells as filled
            }
        }
    }

    // Trace the outline of the filled area
    const outline: number[] = [];
    const deltas = [
        [1, 0], // Right
        [0, 1], // Down
        [-1, 0], // Left
        [0, -1], // Up
    ];

    function traceOutline(startX: number, startY: number): void {
        let x = startX;
        let y = startY;
        let direction = 0; // Start direction (0 = right, 1 = down, 2 = left, 3 = up)
        let segmentLength = 0;

        const isFilled = (cx: number, cy: number): boolean =>
            cx >= 0 &&
            cx < gridWidth &&
            cy >= 0 &&
            cy < gridHeight &&
            grid[cy][cx];

        do {
            const [rightDx, rightDy] = deltas[(direction + 1) % 4];
            const [forwardDx, forwardDy] = deltas[direction];
            const [leftDx, leftDy] = deltas[(direction + 3) % 4];

            if (isFilled(x + rightDx, y + rightDy)) {
                if (segmentLength > 0)
                    outline.push(
                        segmentLength *
                            (direction === 2 || direction === 3 ? -1 : 1)
                    );
                direction = (direction + 1) % 4;
                x += rightDx;
                y += rightDy;
                segmentLength = 1;
            } else if (isFilled(x + forwardDx, y + forwardDy)) {
                x += forwardDx;
                y += forwardDy;
                segmentLength++;
            } else if (isFilled(x + leftDx, y + leftDy)) {
                outline.push(
                    segmentLength *
                        (direction === 2 || direction === 3 ? -1 : 1)
                );
                direction = (direction + 3) % 4;
                x += leftDx;
                y += leftDy;
                segmentLength = 1;
            } else {
                throw new Error("Can't turn 180 deg!");
            }

            if (outline.length > 1000) {
                throw new Error("Endless loop detected");
                debugger;
            }
        } while (x !== startX || y !== startY);

        if (segmentLength > 0) outline.push(segmentLength); // Final segment
    }

    // Find the starting point
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (
                grid[y][x] && // Current cell is filled
                (x === 0 || !grid[y][x - 1]) && // Cell to the left is empty or out of bounds
                grid[y][x + 1] && // Cell to the right is filled
                (y + 1 >= gridHeight || !grid[y + 1]?.[x]) // Cell below is empty or out of bounds
            ) {
                traceOutline(x, y);

                if (false) {
                    const debug = grid
                        .map((line) =>
                            line
                                .map((item) => {
                                    return item ? "#" : ".";
                                })
                                .join("")
                        )
                        .join("\n");
                    console.log("\n" + debug, outline);
                }

                return outline;
            }
        }
    }

    return undefined;
}

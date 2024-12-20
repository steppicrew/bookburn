// FIXME: does not belong in nodeLib

export type CornerSegment = {
    type: "corner";
    cx: number;
    cy: number;
    dir: number;
};

export type WallSegment = {
    type: "wall";
    cx: number;
    cy: number;
    dir: number;
};

export type StairsSegment = {
    type: "stairs";
    cx: number;
    cy: number;
    dir: number;
    turn?: number;
};

export type ElevatorSegment = {
    type: "elevator";
    cx: number;
    cy: number;
    dir: number;
};

export type Segment =
    | CornerSegment
    | WallSegment
    | StairsSegment
    | ElevatorSegment;

// 0 = +x, 1 = -y, 2 = -x, 3 = +y
export const dirXY = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
] as const;

type Points = Array<[x: number, y: number, index: number]>;

type Walls = {
    x: number;
    y: number;
    nextX: number;
    nextY: number;
    dir: number;
    points: Points;
};

type FloorArea = Array<[x: number, y: number]>;

export type WallContour = Record<number, number>;

export type MakeWalls = {
    segments: Segment[];
    floorArea: FloorArea;
    x: number;
    y: number;
    width: number;
    depth: number;
    contourMinX: WallContour;
    contourMaxX: WallContour;
};

type StairsFeature = {
    type: "stairs";
    turn?: number;
    index: number;
};

type ElevatorFeature = {
    type: "elevator";
    index: number;
};

type Feature = StairsFeature | ElevatorFeature;
export type WallFeatures = Feature[];

export const makeWalls = (
    outline: number[],
    features: WallFeatures = []
): MakeWalls => {
    if (outline.length & 1) {
        throw new Error("outline must have even count of elements");
    }
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < outline.length; i += 2) {
        sumX += outline[i];
        sumY += outline[i + 1];
    }
    if (sumX !== 0 && sumY !== 0) {
        outline.push(-sumX, -sumY);
    }

    const walls: Walls[] = [];

    let x = 0;
    let y = 0;
    let dir: number;
    let area: Record<string, [x: number, y: number]> = {};

    const contourMinX: WallContour = {};
    const contourMaxX: WallContour = {};

    let fillX: number;
    let fillY: number;

    if (outline[outline.length - 1] < 0) {
        dir = 1;
        fillY = -1;
    } else {
        dir = 3;
        fillY = 1;
    }
    if (outline[0] < 0) {
        fillX = -1;
    } else {
        fillX = 1;
    }
    dir = 1;
    let pointIndex = 0;

    const addToArea = (nextX: number, nextY: number) => {
        area[`${nextX}:${nextY}`] = [nextX, nextY];
        if (!(nextX in contourMinX) || contourMinX[nextX] > nextY)
            contourMinX[nextX] = nextY;
        if (!(nextX in contourMaxX) || contourMaxX[nextX] < nextY)
            contourMaxX[nextX] = nextY;
    };

    for (let i = 0; i < outline.length; i++) {
        let nextDir: number;
        if (outline[i] < 0 !== dir <= 1) {
            nextDir = (dir + 3) & 3;
        } else {
            nextDir = (dir + 1) & 3;
        }

        let nextX = x;
        let nextY = y;
        const points: Points = [];
        addToArea(nextX, nextY);
        for (let j = Math.abs(outline[i]) * 2; j > 0; --j) {
            nextX += dirXY[nextDir][0];
            nextY += dirXY[nextDir][1];
            if (j > 1) {
                points.push([nextX, nextY, pointIndex++]);
            }
            addToArea(nextX, nextY);
        }

        walls.push({
            x,
            y,
            nextX,
            nextY,
            dir: nextDir,
            points,
        });

        x = nextX;
        y = nextY;
        dir = nextDir;
    }

    // console.table(walls);

    // const isRightTurn = (dir1: number, dir2: number) =>
    //     ((dir1 + dir2 * 3) & 3) === 3;

    const segments: Segment[] = [];

    const cornerDirs = [
        [-1, 2, -1, 3],
        [0, -1, 3, -1],
        [-1, 1, -1, 0],
        [1, -1, 2, -1],
    ];

    for (let i = 0; i < walls.length; i++) {
        const wall = walls[i];
        const lastWall = walls[(i + walls.length - 1) % walls.length];

        {
            const p1 = wall.points[0];
            const p2 = lastWall.points[lastWall.points.length - 1];
            const cx = (p1[0] + p2[0]) / 2;
            const cy = (p1[1] + p2[1]) / 2;
            const dir = cornerDirs[wall.dir][lastWall.dir];
            if (dir < 0) {
                throw new Error("dir < 0");
            }

            // prettier-ignore
            // console.log("DIR",cx,cy,"\t",dir,wall.dir,lastWall.dir,nextWall.dir);

            segments.push({
                type: "corner",
                cx,
                cy,
                dir,
            });
        }

        const checkFeature = ([cx, cy, index]: Points[number], dir: number) =>
            features
                .filter((feature) => feature.index === index)
                .forEach((feature) => {
                    if (feature.type === "stairs") {
                        segments.push({
                            type: "stairs",
                            cx,
                            cy,
                            dir,
                            turn: feature.turn,
                        });
                        return;
                    }
                    if (feature.type === "elevator") {
                        segments.push({
                            type: "elevator",
                            cx,
                            cy,
                            dir,
                        });
                        return;
                    }
                    throw new Error(`Unknown feature type: ${feature}`);
                });

        for (let j = 0; j < wall.points.length; ++j) {
            checkFeature(wall.points[j], wall.dir);
            if (j + 2 < wall.points.length) {
                checkFeature(wall.points[j + 1], wall.dir);
                const p1 = wall.points[j];
                j += 1;
                const p2 = wall.points[j + 1];
                const cx = (p1[0] + p2[0]) / 2;
                const cy = (p1[1] + p2[1]) / 2;
                segments.push({
                    type: "wall",
                    cx,
                    cy,
                    dir: wall.dir,
                });
            } else {
                // throw new Error(`Gap detected ${j}/${wall.points.length}`);
            }
        }
    }

    const floorArea: FloorArea = Object.values(area);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const [x, y] of floorArea) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    // console.log("MAXXXXX", minX, minY, maxX, maxY);

    const nextFill: Array<[number, number]> = [[fillX, fillY]];

    while (nextFill.length) {
        const xy = nextFill.pop() as [number, number];
        const [x, y] = xy;
        if (`${x}:${y}` in area) {
            continue;
        }
        area[`${x}:${y}`] = [x, y];
        floorArea.push([x, y]);
        for (let j = 0; j < 4; ++j) {
            const x1 = x + dirXY[j][0];
            const y1 = y + dirXY[j][1];
            if (`${x1}:${y1}` in area) {
                continue;
            }
            if (x1 < minX || x1 > maxX || y1 < minY || y1 > maxY) {
                throw new Error(
                    `x/y out of bounds ${x1}/${y1} ${minX}/${minY}..${maxX}/${maxY}`
                );
            }
            nextFill.push([x1, y1]);
        }
    }

    // FIXME: normalize floorArea / segments by adding -maxX/-minY

    return {
        segments,
        floorArea,
        x: -minX,
        y: -minY,
        width: maxX - minX + 1,
        depth: maxY - minY + 1,
        contourMinX,
        contourMaxX,
    };
};

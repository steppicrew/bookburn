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
};

export type Segment = CornerSegment | WallSegment | StairsSegment;

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

type FloorArea = Set<[x: number, y: number]>;

type MakeWalls = {
    segments: Segment[];
    floorArea: FloorArea;
};

type StairsFeature = {
    type: "stairs";
    index: number;
};

type Feature = StairsFeature;
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
    } else if (sumX !== 0 || sumY !== 0) {
        throw new Error(
            `sumX=${sumX}, sumY=${sumY} - can't autocorrect (${outline})`
        );
    }

    const walls: Walls[] = [];

    let x = 0;
    let y = 0;
    let dir: number;
    let area: Record<string, [x: number, y: number]> = {};

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
        dir = 1;
        fillX = -1;
    } else {
        dir = 3;
        fillX = 1;
    }

    let pointIndex = 0;

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
        area[`${nextX}:${nextY}`] = [nextX, nextY];
        for (let j = Math.abs(outline[i]) * 2; j > 0; --j) {
            nextX += dirXY[nextDir][0];
            nextY += dirXY[nextDir][1];
            if (j > 1) {
                points.push([nextX, nextY, pointIndex++]);
            }
            area[`${nextX}:${nextY}`] = [nextX, nextY];
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

        const checkFeature = ([cx, cy, index]: Points[number], dir: number) => {
            features
                .filter((feature) => feature.index === index)
                .forEach((feature) => {
                    if (feature.type === "stairs") {
                        segments.push({
                            type: "stairs",
                            cx,
                            cy,
                            dir,
                        });
                        return;
                    }
                    throw new Error(`Unknown Feature.type: ${feature.type}`);
                });
        };

        for (let j = 0; j < wall.points.length; ++j) {
            if (j + 2 < wall.points.length) {
                const p1 = wall.points[j];
                checkFeature(p1, wall.dir);
                checkFeature(wall.points[j + 1], wall.dir);
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

    // Calculate bound for error checking
    const allX = Array.from(Object.values(area), ([x]) => x);
    const allY = Array.from(Object.values(area), ([, y]) => y);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const floorArea: FloorArea = new Set(Object.values(area));
    const nextFill: Array<[number, number]> = [[fillX, fillY]];

    while (nextFill.length) {
        const xy = nextFill.pop() as [number, number];
        const [x, y] = xy;
        area[`${x}:${y}`] = [x, y];
        floorArea.add([x, y]);
        for (let j = 0; j < 4; ++j) {
            const x1 = x + dirXY[j][0];
            const y1 = y + dirXY[j][1];
            if (`${x1}:${y1}` in area) {
                continue;
            }
            if (x1 < minX || x1 > maxX || y1 < minY || y1 > maxY) {
                throw new Error(
                    `x/y out of bounds ${x1}/${y1} ${minX}/${minY}-${maxX}/${maxY}`
                );
            }
            nextFill.push([x1, y1]);
        }
    }

    return { segments, floorArea };
};

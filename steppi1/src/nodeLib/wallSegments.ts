const createRandom = (seed: number) => {
    return (): number => {
        // Linear Congruential Generator constants
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        seed = (a * seed + c) % m;
        return seed;
    };
};

export type CornerSegment = {
    type: "corner";
    cx: number;
    cy: number;
    dir: number;
    random: number;
};

export type WallSegment = {
    type: "wall";
    cx: number;
    cy: number;
    dir: number;
    random: number;
};

export type Segment = CornerSegment | WallSegment;

// 0 = +x, 1 = -y, 2 = -x, 3 = +y
const dxy = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
] as const;

type Walls = {
    x: number;
    y: number;
    nextX: number;
    nextY: number;
    dir: number;
    points: Array<[x: number, y: number]>;
};

export const createWallSegments = (outline: number[]): Segment[] => {
    console.log(outline);
    const nextRandom = createRandom(
        outline.reduce((a, b) => (a * a * Math.abs(b + 1)) & 0xfffff)
    );

    const walls: Walls[] = [];

    let x = 0;
    let y = 0;
    let dir: number;

    if (outline[outline.length - 1] < 0) {
        dir = 1;
    } else {
        dir = 3;
    }
    for (let i = 0; i < outline.length; i++) {
        let nextDir: number;
        if (outline[i] < 0 !== dir <= 1) {
            nextDir = (dir + 3) & 3;
        } else {
            nextDir = (dir + 1) & 3;
        }

        let nextX = x;
        let nextY = y;
        const points: Array<[x: number, y: number]> = [];
        for (let j = Math.abs(outline[i]) * 2; j > 0; --j) {
            nextX += dxy[nextDir][0];
            nextY += dxy[nextDir][1];
            if (j > 1) {
                points.push([nextX, nextY]);
            }
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

    const cornerRots = [
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
            const dir = cornerRots[wall.dir][lastWall.dir];
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
                random: nextRandom(),
            });
        }

        for (let j = 0; j < wall.points.length; ++j) {
            if (j + 2 < wall.points.length) {
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
                    random: nextRandom(),
                });
            }
        }
    }

    return segments;
};

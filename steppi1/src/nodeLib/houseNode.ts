import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { dirXY, makeWalls, WallFeatures } from "./makeWalls";
import { getAssetThinInstance } from "../scene.Gltf/assetLoader";
import { AssetKey } from "../lib/AssetKey";

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

const chooseFrom = <T>(random: number, cands: T[]) =>
    cands[random % cands.length];

type FloorArea = Array<[x: number, y: number]>;

type TeleportationCell = [x: number, y: number, z: number];

type TeleportationCells = TeleportationCell[];

const teleportationCells: TeleportationCells = [];

type MergedRectangle = {
    groupDim: number;
    groupValue: number;
    pos0: number; // Center of primary dimension
    pos1: number; // Center of secondary dimension
    size0: number; // Size along primary dimension
    size1: number; // Size along secondary dimension
};

function mergeCellsToRectangles(
    cells: [number, number, number][],
    groupDim: number
): MergedRectangle[] {
    // Determine the grouping and sorting dimensions
    const dims = [0, 1, 2]; // [x, y, z]
    const [primary, secondary] = dims.filter((d) => d !== groupDim);
    const tertiary = groupDim;

    // Sort cells by secondary, then primary
    cells.sort(
        (a, b) => a[secondary] - b[secondary] || a[primary] - b[primary]
    );

    // Create a set for quick lookup and track used cells
    const cellSet = new Set(cells.map(([x, y, z]) => `${x},${y},${z}`));
    const used = new Set<string>();

    const rectangles: MergedRectangle[] = [];

    // Process cells to merge them into rectangles
    for (const cell of cells) {
        const cellKey = `${cell[0]},${cell[1]},${cell[2]}`;
        if (used.has(cellKey)) continue;

        const start = [...cell]; // Start of the rectangle
        const end = [...cell]; // End of the rectangle
        const groupValue = cell[groupDim]; // The value of the group dimension

        used.add(cellKey);

        // Expand along the primary dimension
        while (true) {
            const nextPrimary = end[primary] + 1;
            const nextKey = [...end];
            nextKey[primary] = nextPrimary;
            const nextKeyStr = `${nextKey[0]},${nextKey[1]},${nextKey[2]}`;
            if (cellSet.has(nextKeyStr) && !used.has(nextKeyStr)) {
                end[primary] = nextPrimary;
                used.add(nextKeyStr);
            } else {
                break;
            }
        }

        // Expand along the secondary dimension
        while (true) {
            const nextSecondary = end[secondary] + 1;
            let canExpand = true;
            for (let p = start[primary]; p <= end[primary]; p++) {
                const key = [...end];
                key[primary] = p;
                key[secondary] = nextSecondary;
                const keyStr = `${key[0]},${key[1]},${key[2]}`;
                if (!cellSet.has(keyStr) || used.has(keyStr)) {
                    canExpand = false;
                    break;
                }
            }
            if (canExpand) {
                end[secondary] = nextSecondary;
                for (let p = start[primary]; p <= end[primary]; p++) {
                    const key = [0, 0, 0];
                    key[primary] = p;
                    key[secondary] = nextSecondary;
                    key[tertiary] = groupValue;
                    used.add(`${key[0]},${key[1]},${key[2]}`);
                }
            } else {
                break;
            }
        }

        // Calculate center positions and sizes
        const size0 = end[primary] - start[primary] + 1;
        const size1 = end[secondary] - start[secondary] + 1;
        const pos0 = start[primary] + size0 / 2 - 0.5; // Center along primary
        const pos1 = start[secondary] + size1 / 2 - 0.5; // Center along secondary

        // Add the merged rectangle with the group dimension value
        rectangles.push({
            groupDim,
            groupValue,
            pos0,
            pos1,
            size0,
            size1,
        });
    }

    return rectangles;
}

const debugInstance = (
    scene: BABYLON.Scene,
    instance: BABYLON.AbstractMesh[]
) => {
    let angle = 0.01;
    scene.registerAfterRender(function () {
        instance.forEach((mesh) => {
            mesh.rotate(
                new BABYLON.Vector3(0, 1, 0),
                angle,
                BABYLON.Space.LOCAL
            );
        });
    });
};

type HouseOptions = {
    floors?: number;
    startFloor?: number;
    shadowGenerator?: BABYLON.ShadowGenerator;
    xrHelper?: BABYLON.WebXRDefaultExperience;
    features?: WallFeatures;
};

export const addHouse = async (
    scene: BABYLON.Scene,
    x: number,
    z: number,
    outline: number[],
    {
        floors = 1,
        startFloor = 0,
        shadowGenerator,
        xrHelper,
        features,
    }: HouseOptions
) => {
    const { segments, floorArea } = makeWalls(outline, features);
    const nextRandom = createRandom(
        outline.reduce((a, b) => (a * a * Math.abs(b + 1)) & 0xfffff)
    );
    const height = 2.4;

    let y = startFloor * height;
    for (let floor = 0; floor < floors; ++floor, y += height) {
        for (const segment of segments) {
            if (segment.type === "wall") {
                const assetKey = chooseFrom<AssetKey>(nextRandom(), [
                    "building/wall-doorway-round",
                    "building/wall",
                    "building/wall-window-round",
                    "building/wall-window-round-detailed",
                    "building/wall-window-square",
                ]);
                const matrix = BABYLON.Matrix.RotationYawPitchRoll(
                    ((5 - segment.dir) * Math.PI) / 2,
                    0,
                    0
                ).multiply(
                    BABYLON.Matrix.Translation(
                        x + segment.cx,
                        y,
                        z + segment.cy
                    )
                );
                await getAssetThinInstance(
                    scene,
                    assetKey,
                    matrix,
                    shadowGenerator
                );
                continue;
            }
            if (segment.type === "corner") {
                const matrix = BABYLON.Matrix.Translation(0.5, 0, -0.5)
                    .multiply(
                        BABYLON.Matrix.RotationYawPitchRoll(
                            ((6 - segment.dir) * Math.PI) / 2,
                            0,
                            0
                        ).multiply(BABYLON.Matrix.Translation(-0.5, 0, 0.5))
                    )
                    .multiply(
                        BABYLON.Matrix.Translation(
                            x + segment.cx + 0.5,
                            y,
                            z + segment.cy - 0.5
                        )
                    );
                await getAssetThinInstance(
                    scene,
                    "building/wall-corner-column-small",
                    matrix,
                    shadowGenerator
                );
                continue;
            }
            if (segment.type === "stairs") {
                const dir1 = (segment.dir + 2) & 3;
                const nextDir = (segment.dir + 1) & 3;
                const x1 =
                    dirXY[dir1][0] * 1.5 -
                    ((floor - floors + 1) * 4 - 1) * dirXY[nextDir][0];
                const y1 =
                    dirXY[dir1][1] * 1.5 -
                    ((floor - floors + 1) * 4 - 1) * dirXY[nextDir][1];

                const x2 = x + segment.cx + x1;
                const y2 = y;
                const z2 = z + segment.cy + y1;
                const matrix = BABYLON.Matrix.Translation(0.5, 0, -0.5)
                    .multiply(
                        BABYLON.Matrix.RotationYawPitchRoll(
                            ((6 - segment.dir) * Math.PI) / 2,
                            0,
                            0
                        ).multiply(BABYLON.Matrix.Translation(-0.5, 0, 0.5))
                    )
                    .multiply(
                        BABYLON.Matrix.Translation(x2 + 0.5, y2, z2 - 0.5)
                    );
                await getAssetThinInstance(
                    scene,
                    "building/stairs-open",
                    matrix,
                    shadowGenerator
                );

                for (let i = 0; i < 4; ++i) {
                    const x3 = x2 + dirXY[nextDir][0] * (i - 2);
                    const y3 = y2 + (4 - i) * 0.6;
                    const z3 = z2 + dirXY[nextDir][1] * (i - 2);

                    for (let j = 0; j < 2; ++j) {
                        for (let k = 0; k < 2; ++k) {
                            teleportationCells.push([
                                x3 + dirXY[dir1][0] * j + dirXY[nextDir][0] * k,
                                y3,
                                z3 + dirXY[dir1][1] * j + dirXY[nextDir][1] * k,
                            ]);
                        }
                    }
                }
                continue;
            }
        }
    }

    for (const [floorX, floorY] of floorArea) {
        var matrix = BABYLON.Matrix.Translation(x + floorX, y, z + floorY);
        await getAssetThinInstance(
            scene,
            "building/roof-flat-patch",
            matrix,
            shadowGenerator
        );
        teleportationCells.push([x + floorX, y, z + floorY]);
    }
};

export const flushTeleportationCells = (
    scene: BABYLON.Scene,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (xrHelper) {
        const rectangles = mergeCellsToRectangles(teleportationCells, 1);

        // console.log(teleportationCells.slice());
        // console.log(rectangles);

        for (const {
            groupDim,
            groupValue,
            pos0,
            pos1,
            size0,
            size1,
        } of rectangles) {
            const position = [0, 0, 0];
            position[groupDim] = groupValue; // Set the group dimension value
            position[(groupDim + 1) % 3] = pos0; // Set the primary dimension center
            position[(groupDim + 2) % 3] = pos1; // Set the secondary dimension center

            // Create the plane with width and height
            // FIXME: Faster with instances?
            const plane = BABYLON.MeshBuilder.CreatePlane(
                "plane",
                {
                    width: size0,
                    height: size1,
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                },
                scene
            );

            // Rotate the plane based on the group dimension
            if (groupDim === 0) {
                // Plane should face along the X-axis
                plane.rotation.y = -Math.PI / 2;
            } else if (groupDim === 1) {
                // Plane should face along the Y-axis
                plane.rotation.x = Math.PI / 2;
            } else if (groupDim === 2) {
                // Plane faces along the Z-axis by default; no rotation needed
            }

            // FIXME: Why sizzling?
            plane.position = new BABYLON.Vector3(
                -position[2],
                position[1] + 0.07,
                position[0]
            );
            plane.isVisible = false;
            xrHelper.teleportation.addFloorMesh(plane);
        }
    }
    teleportationCells.splice(0);
};

import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { dirXY, makeWalls, WallFeatures } from "./makeWalls";
import { getAssetThinInstance } from "../scene.Gltf/assetLoader";
import { AssetKey } from "../lib/AssetKey";
import { addElevator } from "../scene.Gltf/elevator";

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

type TeleportationCells = Array<[x: number, y: number, z: number]>;

const teleportationCells: TeleportationCells = [];
const fixups: Array<(xrHelper: BABYLON.WebXRDefaultExperience) => void> = [];

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

const debugInstance = (scene: BABYLON.Scene, mesh: BABYLON.AbstractMesh[]) => {
    let angle = 0.01;
    scene.registerAfterRender(function () {
        mesh.forEach((mesh) => {
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
    features?: WallFeatures;
};

export const addHouse = async (
    scene: BABYLON.Scene,
    x: number,
    z: number,
    outline: number[],
    { floors = 1, startFloor = 0, shadowGenerator, features }: HouseOptions
) => {
    const { segments, floorArea } = makeWalls(outline, features);
    const nextRandom = createRandom(
        outline.reduce((a, b) => (a * a * Math.abs(b + 1)) & 0xfffff)
    );
    const height = 2.4;

    let y = startFloor * height;
    let hasElevator = false;
    for (let floor = 0; floor < floors; ++floor, y += height) {
        for (const segment of segments) {
            if (segment.type === "wall") {
                const assetKey = chooseFrom<AssetKey>(nextRandom(), [
                    "building/wall",
                    "building/wall",
                    "building/wall",
                    "building/wall",
                    "building/wall-doorway-round",
                    "building/wall-doorway-square",
                    "building/wall-window-round",
                    "building/wall-window-round-detailed",
                    "building/wall-window-square",
                    "building/wall-window-square-detailed",
                    // "building/roof-flat-side",
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
                // const xy1 = dirXY[(segment.dir + 2) & 3];
                const xy1p = dirXY[(segment.dir + 3) & 3]; // 90deg of stairs
                const dir = (segment.dir + (segment.turn ?? 0) + 5) & 3; // dir of stairs
                const xy2 = dirXY[dir];
                const xy2p = dirXY[(dir + 1) & 3];

                // Dimensions of stairs models:
                const DX = 1.3;
                const DY = 2.5;
                const DZ = 4;
                const DIST_FROM_WALL = 1.2;

                const x2 =
                    x +
                    segment.cx -
                    xy1p[0] * DIST_FROM_WALL -
                    ((floor - floors + 1) * DZ + 0.5) * xy2[0];
                const y2 = y;
                const z2 =
                    z +
                    segment.cy -
                    xy1p[1] * DIST_FROM_WALL -
                    ((floor - floors + 1) * DZ + 0.5) * xy2[1];

                let matrix = BABYLON.Matrix.Translation(0, 0, (DX / 4 - DZ) / 2)
                    .multiply(
                        BABYLON.Matrix.RotationYawPitchRoll(
                            ((7 - dir) * Math.PI) / 2,
                            0,
                            0
                        )
                    )
                    .multiply(BABYLON.Matrix.Translation(x2, y2, z2));

                await getAssetThinInstance(
                    scene,
                    "building/stairs-open",
                    matrix,
                    shadowGenerator
                );

                for (let i = 0; i < 4; ++i) {
                    const x3 = x2 + xy2[0] * (i - 1);
                    const y3 = y2 + (4 - i) * 0.6;
                    const z3 = z2 + xy2[1] * (i - 1);

                    for (let j = -1; j < 2; ++j) {
                        for (let k = 1; k < 3; ++k) {
                            teleportationCells.push([
                                x3 + xy2p[0] * j + dirXY[dir][0] * k,
                                y3,
                                z3 + xy2p[1] * j + dirXY[dir][1] * k,
                            ]);
                        }
                    }
                }
                continue;
            }
            if (segment.type === "elevator" && floor === 0) {
                const xy1p = dirXY[(segment.dir + 1) & 3];

                fixups.push(
                    (
                        (y: number) =>
                        (xrHelper?: BABYLON.WebXRDefaultExperience) => {
                            addElevator(
                                scene,
                                -x - segment.cx + xy1p[0] * 1.5,
                                y,
                                z + segment.cy + xy1p[1] * 1.5,
                                (floors + 1) * 2.4,
                                xrHelper
                            );
                        }
                    )(y)
                );
                hasElevator = true;
                continue;
            }
        }
    }

    const soundPlane = [Infinity, Infinity, -Infinity, -Infinity];
    const soundBorder = 2;
    for (const [floorX, floorY] of floorArea) {
        var matrix = BABYLON.Matrix.Translation(x + floorX, y, z + floorY);
        await getAssetThinInstance(
            scene,
            "building/roof-flat-patch",
            matrix,
            shadowGenerator
        );
        teleportationCells.push([x + floorX, y, z + floorY]);
        if (hasElevator) {
            soundPlane[0] = Math.min(soundPlane[0], x + floorX - soundBorder);
            soundPlane[1] = Math.min(soundPlane[1], z + floorY - soundBorder);
            soundPlane[2] = Math.max(soundPlane[2], x + floorX + soundBorder);
            soundPlane[3] = Math.max(soundPlane[3], z + floorY + soundBorder);
        }
    }

    if (hasElevator) {
        fixups.push((xrHelper) => {
            const box = BABYLON.MeshBuilder.CreateBox(
                "elevatorSoundPlane",
                {
                    width: soundPlane[2] - soundPlane[0],
                    height: soundPlane[3] - soundPlane[1],
                    depth: 4,
                },
                scene
            );
            if (false) {
                //debug
                // box.material = new BABYLON.StandardMaterial("debugSound");
                // box.material.alpha = 0.5;
            } else {
                box.isVisible = false;
            }
            box.rotation.x = Math.PI / 2;
            box.position.x = -(soundPlane[0] + soundPlane[2]) / 2;
            box.position.y = y + 2;
            box.position.z = (soundPlane[1] + soundPlane[3]) / 2;

            const sound = new BABYLON.Sound(
                "music",
                "assets/sound/howling-wind.mp3",
                scene,
                null,
                {
                    loop: true,
                    autoplay: true,
                    spatialSound: true,
                    refDistance: Math.max(
                        soundPlane[2] - soundPlane[0],
                        soundPlane[3] - soundPlane[1]
                    ),
                    rolloffFactor: 1.2, // Math.max(1.3, Math.min(1.3, 40 / y)),
                    volume: Math.min(y / 60, 2),
                    maxDistance: y * 0.8,
                }
            );
            sound.attachToMesh(box);
            sound.switchPanningModelToHRTF();
        });
    }

    return fixups;
};

export const flushTeleportationCells = (
    scene: BABYLON.Scene,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (xrHelper) {
        const rectangles = mergeCellsToRectangles(teleportationCells, 1);

        const root = new BABYLON.TransformNode("teleportationHouse", scene);

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
                "teleportationHousePlane",
                {
                    width: size0,
                    height: size1,
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE, // FIXME: Needed?
                },
                scene
            );
            plane.parent = root;
            plane.isVisible = false;

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

            xrHelper.teleportation.addFloorMesh(plane);
        }

        fixups.forEach((fixup) => fixup(xrHelper));
    }
    teleportationCells.splice(0);
    fixups.splice(0);
};

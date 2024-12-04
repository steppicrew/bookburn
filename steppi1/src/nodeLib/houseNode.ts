import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { dirXY, makeWalls, WallFeatures } from "./makeWalls";
import {
    getAssetInstance,
    getAssetThinInstance,
} from "../scene.Gltf/assetLoader";
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
                            x + segment.cx + x1 + 0.5,
                            y,
                            z + segment.cy + y1 - 0.5
                        )
                    );
                await getAssetThinInstance(
                    scene,
                    "building/stairs-closed",
                    matrix,
                    shadowGenerator
                );

                // xrHelper?.teleportation.addFloorMesh(mesh);
                // debugInstance(scene, instance);
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
    }
};

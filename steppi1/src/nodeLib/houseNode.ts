import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { dirXY, makeWalls, WallFeatures } from "./makeWalls";
import { getAssetInstance } from "../scene.Gltf/assetLoader";
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
                const instance = await getAssetInstance(
                    scene,
                    assetKey,
                    shadowGenerator
                );

                // console.log(assetKey, getNodeWorldDimensions(instance));

                instance.forEach((mesh) => {
                    mesh.position = new BABYLON.Vector3(
                        x + segment.cx,
                        y,
                        z + segment.cy
                    );
                    // instance.setPivotPoint(new BABYLON.Vector3(-0.0, 0, 0.0));
                    mesh.rotate(
                        new BABYLON.Vector3(0, 1, 0),
                        ((5 - segment.dir) * Math.PI) / 2
                    );
                });
                continue;
            }
            if (segment.type === "corner") {
                const instance = await getAssetInstance(
                    scene,
                    "building/wall-corner-column-small",
                    shadowGenerator
                );
                instance.forEach((mesh) => {
                    mesh.position = new BABYLON.Vector3(
                        x + segment.cx + 0.5,
                        y,
                        z + segment.cy - 0.5
                    );
                    mesh.setPivotPoint(new BABYLON.Vector3(-0.5, 0, 0.5));
                    mesh.rotate(
                        new BABYLON.Vector3(0, 1, 0),
                        ((6 - segment.dir) * Math.PI) / 2
                    );
                });
                continue;
            }
            if (segment.type === "stairs") {
                const instance = await getAssetInstance(
                    scene,
                    "building/stairs-closed",
                    shadowGenerator
                );
                instance.forEach((mesh) => {
                    const dir1 = (segment.dir + 2) & 3;
                    const nextDir = (segment.dir + 1) & 3;
                    const x1 =
                        dirXY[dir1][0] * 1.5 -
                        ((floor - floors + 1) * 4 - 1) * dirXY[nextDir][0];
                    const y1 =
                        dirXY[dir1][1] * 1.5 -
                        ((floor - floors + 1) * 4 - 1) * dirXY[nextDir][1];
                    mesh.position = new BABYLON.Vector3(
                        x + segment.cx + x1 + 0.5,
                        y,
                        z + segment.cy + y1 - 0.5
                    );
                    mesh.setPivotPoint(new BABYLON.Vector3(-0.5, 0, 0.5));
                    mesh.rotate(
                        new BABYLON.Vector3(0, 1, 0),
                        ((6 - segment.dir) * Math.PI) / 2
                    );
                    xrHelper?.teleportation.addFloorMesh(mesh);
                });
                // debugInstance(scene, instance);
                continue;
            }
        }
    }

    for (const [floorX, floorY] of floorArea) {
        const instance = await getAssetInstance(
            scene,
            "building/roof-flat-patch",
            shadowGenerator
        );
        instance.forEach((mesh) => {
            mesh.position = new BABYLON.Vector3(x + floorX, y, z + floorY);
            shadowGenerator?.addShadowCaster(mesh);
            xrHelper?.teleportation.addFloorMesh(mesh);
        });
    }
};

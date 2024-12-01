import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { createWalls } from "./createWalls";
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

export const addHouse = async (
    scene: BABYLON.Scene,
    outline: number[],
    x: number,
    z: number,
    {
        floors = 1,
        startFloor = 0,
        shadowGenerator,
        xrHelper,
    }: {
        floors?: number;
        startFloor?: number;
        shadowGenerator?: BABYLON.ShadowGenerator;
        xrHelper?: BABYLON.WebXRDefaultExperience;
    }
) => {
    const { segments, floorArea } = createWalls(outline);
    const nextRandom = createRandom(
        outline.reduce((a, b) => (a * a * Math.abs(b + 1)) & 0xfffff)
    );
    const height = 2.4;

    let y = startFloor * height;
    for (let floor = 0; floor < floors; ++floor, y += height) {
        for (const seg of segments) {
            if (seg.type === "wall") {
                const assetKey = chooseFrom<AssetKey>(nextRandom(), [
                    "building/wall-doorway-round",
                    "building/wall",
                    "building/wall-window-round",
                    "building/wall-window-round-detailed",
                    "building/wall-window-square",
                ]);
                const instance = await getAssetInstance(scene, assetKey);

                // console.log(assetKey, getNodeWorldDimensions(instance));

                instance.forEach((mesh) => {
                    mesh.position = new BABYLON.Vector3(
                        x + seg.cx,
                        y,
                        z + seg.cy
                    );
                    // instance.setPivotPoint(new BABYLON.Vector3(-0.0, 0, 0.0));
                    mesh.rotate(
                        new BABYLON.Vector3(0, 1, 0),
                        ((5 - seg.dir) * Math.PI) / 2
                    );
                    shadowGenerator?.addShadowCaster(mesh);
                });
            }
            if (seg.type === "corner") {
                const instance = await getAssetInstance(
                    scene,
                    "building/wall-corner-column-small"
                );
                instance.forEach((mesh) => {
                    mesh.position = new BABYLON.Vector3(
                        x + seg.cx + 0.5,
                        y,
                        z + seg.cy - 0.5
                    );
                    mesh.setPivotPoint(new BABYLON.Vector3(-0.5, 0, 0.5));
                    // instance.parent = rootNode;
                    mesh.rotate(
                        new BABYLON.Vector3(0, 1, 0),
                        ((6 - +seg.dir) * Math.PI) / 2
                    );
                    shadowGenerator?.addShadowCaster(mesh);
                });

                /*
                let angle = 0.01;
                scene.registerAfterRender(function () {
                    instance.rotate(
                        new BABYLON.Vector3(0, 1, 0),
                        angle,
                        BABYLON.Space.LOCAL
                    );
                });
                */
            }
        }
    }

    for (const [floorX, floorY] of floorArea) {
        const instance = await getAssetInstance(
            scene,
            "building/roof-flat-patch"
        );
        instance.forEach((mesh) => {
            mesh.position = new BABYLON.Vector3(x + floorX, y, z + floorY);
            shadowGenerator?.addShadowCaster(mesh);
            xrHelper?.teleportation.addFloorMesh(mesh);
        });
    }
};

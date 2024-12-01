import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { createWallSegments } from "./wallSegments";
import { getAssetClone } from "../scene.Gltf/assetLoader";
import { AssetKey } from "../lib/AssetKey";

let houseIndex = 0;

const chooseFrom = <T>(random: number, cands: T[]) =>
    cands[random % cands.length];

export const addHouse = async (scene: BABYLON.Scene, outline: number[]) => {
    const segments = createWallSegments(outline);

    const rootNode = new BABYLON.TransformNode(`house_${++houseIndex}`, scene);

    for (const seg of segments) {
        if (seg.type === "wall") {
            const assetKey = chooseFrom<AssetKey>(seg.random, [
                "building/wall-doorway-round",
                "building/wall",
                "building/wall-window-round",
                "building/wall-window-round-detailed",
                "building/wall-window-square",
            ]);
            console.log("ASSETKEY", assetKey);
            const instance = await getAssetClone(scene, assetKey);
            instance.parent = rootNode;
            instance.position = new BABYLON.Vector3(seg.cx + 0, 0, seg.cy - 0);
            instance.setPivotPoint(new BABYLON.Vector3(-0.0, 0, 0.0));
            instance.rotate(
                new BABYLON.Vector3(0, 1, 0),
                ((5 - seg.dir) * Math.PI) / 2
            );
        }
        if (seg.type === "corner") {
            const instance = await getAssetClone(
                scene,
                "building/wall-corner-column-small"
            );
            instance.position = new BABYLON.Vector3(
                seg.cx + 0.5,
                0,
                seg.cy - 0.5
            );
            instance.setPivotPoint(new BABYLON.Vector3(-0.5, 0, 0.5));
            instance.parent = rootNode;
            instance.rotate(
                new BABYLON.Vector3(0, 1, 0),
                ((6 - +seg.dir) * Math.PI) / 2
            );

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

    return rootNode;
};

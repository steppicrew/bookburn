import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { createWallSegments } from "./wallSegments";
import { getAssetClone } from "../scene.Gltf/assetLoader";

let houseIndex = 0;

export const addHouse = async (scene: BABYLON.Scene, outline: number[]) => {
    const segments = createWallSegments(outline);

    const rootNode = new BABYLON.TransformNode(`house_${++houseIndex}`, scene);

    for (const seg of segments) {
        if (seg.type === "wall") {
            const instance = await getAssetClone(scene, "building/wall");
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

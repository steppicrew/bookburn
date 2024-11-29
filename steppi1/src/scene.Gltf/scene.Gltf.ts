import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { CreateCamera2 } from "../camera1";
import { CreateSceneFn } from "../sceneEx";
import { updateWrapper } from "../sceneUtils";
import { createGround, createSkybox } from "../baseScene";
import { assetLoader, getAsset } from "./assetLoader";

export const createScene1: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    scene.debugLayer.show();

    // ====================================

    if (true) {
        createSkybox(scene);

        const ground = createGround(scene);
        ground.isPickable = false;
        xrHelper.teleportation.addFloorMesh(ground);

        ground.checkCollisions = true;
    }

    // ====================================

    await assetLoader(scene);

    const useMeshInstances = async (assetName: string) => {
        const asset = await getAsset(scene, "furniture/books");

        for (let i = 0; i < 3; i++) {
            const instance = asset.clone(`instance_${i}`, null);
            if (instance) {
                instance.position = new BABYLON.Vector3(i * 2, 0, 1); // Offset each instance
                console.log(`Instance created: ${instance.name}`);
            }
        }
    };

    useMeshInstances("furniture/books");

    const updates = updateWrapper();

    // *** Light ***

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1.2, 1, 0),
        // new BABYLON.Vector3(0, 1, 0),
        scene
    );

    let angle = 0;

    updates.add(() => {
        angle += 0.01;

        light.direction = new BABYLON.Vector3(
            Math.sin(angle),
            1,
            Math.cos(angle)
        );
    });
    new BABYLON.HemisphericLight(
        "light2",
        new BABYLON.Vector3(-1.2, -1, 0),
        // new BABYLON.Vector3(0, 1, 0),
        scene
    );

    camera.node.setTarget(new BABYLON.Vector3(0, 0, 0));

    return updates.update;
};

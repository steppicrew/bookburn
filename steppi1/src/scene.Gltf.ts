import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { CreateCamera2 } from "./camera1";
import { CreateSceneFn } from "./sceneEx";
import { updateWrapper } from "./sceneUtils";

export const createScene1: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    scene.debugLayer.show();

    BABYLON.SceneLoader.Append(
        "assets/kenney_furniture-kit/",
        "books.glb",
        scene,
        () => {
            console.log("Model loaded successfully!");
        }
    );

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

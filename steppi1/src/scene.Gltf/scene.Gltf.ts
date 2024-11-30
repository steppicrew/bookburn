import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { CreateCamera2 } from "../lib/camera1";
import { CreateSceneFn } from "../lib/sceneEx";
import { createGround, createSkybox } from "../lib/baseScene";
import { sceneContent } from "./sceneContent";
import { updateWrapper } from "../lib/updateWrapper";

export const createScene: CreateSceneFn = async (
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

    await sceneContent(scene);

    // ====================================

    const updates = updateWrapper();

    new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 10, 0), // See update some lines down
        scene
    );

    camera.node.setTarget(new BABYLON.Vector3(0, 0, 0));

    return updates.update;
};

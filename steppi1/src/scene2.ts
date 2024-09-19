import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { createBook } from "./book";
import { CreateCamera2, createCamera2 } from "./camera1";
import { createPage } from "./book/page";
import { CreateSceneFn } from "./sceneEx";

const setupBook = async (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const page = createPage({
        scene,
        width: 21,
        height: 27,
        frontTexture: "assets/front.jpg",
        backTexture: "assets/back.jpg",
        floppyness: 1,
    });
    xrHelper.input.onControllerAddedObservable.add((controller) => {
        controller.onMotionControllerInitObservable.add((motionController) => {
            const triggerComponent = motionController.getComponent(
                "xr-standard-trigger"
            );
        });
    });
    return page;
};

export const createScene1: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    // *** Light ***

    const light = new BABYLON.DirectionalLight(
        "light",
        new BABYLON.Vector3(0, 0, 1),
        scene
    );

    // *** Book ***

    await setupBook(scene, xrHelper);

    const update = () => {};

    return update;
};

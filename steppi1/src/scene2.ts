import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { CreateCamera2 } from "./camera1";
import { CreateSceneFn } from "./sceneEx";
import { setupBook } from "./book/book";

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

    const book = setupBook(scene, xrHelper, { pageCount: 100 });

    scene.registerBeforeRender(book.update);

    book.node.position.y = -1;
    // book.node.rotation.x = -Math.PI / 2;

    return () => {};
};

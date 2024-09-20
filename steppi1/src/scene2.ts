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

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 1),
        scene
    );

    // *** Book ***

    const book = setupBook(scene, xrHelper, { pageCount: 100 });

    scene.registerBeforeRender(book.update);

    book.node.position.z = -10;
    book.node.position.x = 5;
    //book.node.rotation.z = -Math.PI / 2;
    book.node.rotation.y = Math.PI;
    book.node.rotation.x = Math.PI / 4;

    camera.node.setTarget(book.node.position);

    return () => {};
};

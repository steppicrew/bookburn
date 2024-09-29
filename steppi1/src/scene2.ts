import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { CreateCamera2 } from "./camera1";
import { CreateSceneFn } from "./sceneEx";
import { setupBook } from "./bookShader/book";
import { updateWrapper } from "./sceneUtils";

export const createScene1: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const updates = updateWrapper();

    // *** Light ***

    if (false) {
        if (false) {
            const light = new BABYLON.HemisphericLight(
                "light",
                new BABYLON.Vector3(0, 1, 0),
                scene
            );
        } else {
            const light = new BABYLON.PointLight(
                "light",
                new BABYLON.Vector3(0, 10000, 0),
                scene
            );
        }
        /*
        const light2 = new BABYLON.HemisphericLight(
            "light2",
            new BABYLON.Vector3(0, 0, 1),
            scene
        );
        */
    } else {
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(1.2, 1, 0),
            // new BABYLON.Vector3(0, 1, 0),
            scene
        );

        let angle = 0;

        updates.add(() => {
            // return;
            /*
            camera.node.position = new BABYLON.Vector3(
                -4.142467027972506,
                3.6664359864043488,
                6.308459603515606
            );
            camera.node.rotation = new BABYLON.Vector3(0, 0, 0);
            camera.node.fov = 0.8;
    */
            angle += 0.01;

            light.direction = new BABYLON.Vector3(
                Math.sin(angle),
                1,
                Math.cos(angle)
            );
        });
    }

    // *** Book ***

    const book = setupBook(scene, xrHelper, { pageCount: 100 });

    // scene.registerBeforeRender(book.update);

    if (false) {
        book.node.position.z = 0.5;
        book.node.position.x = 0.5;
        //book.node.rotation.z = -Math.PI / 2;
        // book.node.rotation.y = Math.PI / 4;
        book.node.rotation.x = -Math.PI / 4;
    }

    updates.add(book.update);

    camera.node.setTarget(book.node.position);

    // Create a simple sphere to interact with
    const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 1 },
        scene
    );
    sphere.position.x = 0;
    sphere.position.y = 1;
    sphere.position.z = 3;

    new BABYLON.AxesViewer(scene);

    return updates.update;
};

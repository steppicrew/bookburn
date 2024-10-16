import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { CreateCamera2 } from "./camera1";
import { CreateSceneFn } from "./sceneEx";
import { updateWrapper } from "./sceneUtils";
import { createAutoflipBook } from "./autoflipBook";

export const createScene1: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    scene.debugLayer.show();

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
        new BABYLON.HemisphericLight(
            "light2",
            new BABYLON.Vector3(-1.2, -1, 0),
            // new BABYLON.Vector3(0, 1, 0),
            scene
        );
    }

    // *** Book ***

    let book;
    for (let i = 0; i < 125; ++i) {
        console.log("BOOK", i);
        book = createAutoflipBook(scene, xrHelper);
        updates.addUpdates(book.updates);
        book.node.position.x += Math.floor(i / 5) * 5;
        book.node.position.y += (i % 5) * 5;
        book.node.position.z += Math.floor(i / 25) * 5;
    }

    /*
    if (false) {
        book.node.position.z = 1;
        book.node.position.x = 0.3;
        book.node.position.y = 0;
        //book.node.rotation.z = -Math.PI / 2;
        // book.node.rotation.y = Math.PI / 4;
        book.node.rotation.x = -Math.PI / 6;
    }
    */

    camera.node.setTarget(book!.node.position.clone());

    // Create a simple sphere to interact with
    const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 1 },
        scene
    );
    sphere.position.x = -2.5;
    sphere.position.y = 1;
    sphere.position.z = 0;

    new BABYLON.AxesViewer(scene);

    return updates.update;
};

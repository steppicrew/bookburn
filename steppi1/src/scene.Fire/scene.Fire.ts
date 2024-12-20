import * as BABYLON from "babylonjs";

import { CreateSceneFn } from "../lib/sceneEx";
import { CreateCamera2 } from "../lib/camera1";
import { createSkybox, createGround, createSphere } from "../lib/baseScene";
import { initXR } from "../lib/xr";
import { addAutoflipBook } from "../nodeLib/autoflipBookNode";
import { updateWrapper } from "../lib/updateWrapper";

import { makeCreateFire } from "./fire4";

const createLight = (scene: BABYLON.Scene) => {
    const light = new BABYLON.DirectionalLight(
        "light",
        new BABYLON.Vector3(0.01, -1, 0.01),
        scene
    );
    light.position = new BABYLON.Vector3(3, 20, 3);

    // light.intensity = 1.0;

    let angle = 0;

    const update = () => {
        /*
        camera.node.position = new BABYLON.Vector3(
            -4.142467027972506,
            3.6664359864043488,
            6.308459603515606
        );
        camera.node.rotation = new BABYLON.Vector3(0, 0, 0);
        camera.node.fov = 0.8;
        */
        /*
        angle += 0.01;

        light.direction = new BABYLON.Vector3(
            Math.sin(angle),
            -1,
            Math.cos(angle)
        );
        */
    };

    var shadowGenerator = new BABYLON.ShadowGenerator(512, light);

    return { light, update, shadowGenerator };
};

// Create a simple sphere to interact with
const createBox = (
    scene: BABYLON.Scene,
    shadowGenerator: BABYLON.ShadowGenerator
) => {
    const mesh = BABYLON.MeshBuilder.CreateBox(
        "sphere",
        { width: 0.5, height: 0.5, depth: 0.5 },
        scene
    );
    mesh.position.x = -3;
    mesh.position.y = 1;
    mesh.position.z = 2;
    shadowGenerator.addShadowCaster(mesh);

    const update = () => {
        // nothing
    };

    return { box: mesh, update };
};

export const createScene: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const updates = updateWrapper();

    scene.debugLayer.show();

    const { update: updateLight, shadowGenerator } = createLight(scene);
    updates.add(updateLight);

    createSkybox(scene);

    const ground = createGround(scene);
    ground.isPickable = false;
    xrHelper.teleportation.addFloorMesh(ground);

    const { update: updateSphere } = createSphere(scene, shadowGenerator);
    updates.add(updateSphere);

    createBox(scene, shadowGenerator);

    initXR(scene, xrHelper);

    // *** Book ***
    if (true) {
        const book = addAutoflipBook(scene, xrHelper, {});
        updates.addUpdates(book.updates);

        book.node.position.z = 3;
        book.node.position.x = -2.3;
        book.node.position.y = 2;
        // book.node.rotation.z = Math.PI / 2;
        book.node.rotation.y = -Math.PI / 4;
        book.node.rotation.x = -Math.PI / 6;
    }

    const createFire = makeCreateFire(scene);

    // ** Fire **
    const relX = 8;

    const fireNode1 = createFire(1000, 0.7);
    fireNode1.position.x -= relX * 1;

    /*
    const fireNode2 = createFire(50, 1);
    fireNode2.position.x -= relX * 2;

    const fireNode3 = createFire(50, 1);
    fireNode3.position.x -= relX * 3;

    const fireNode4 = createFire(10, 1);
    fireNode4.position.x -= relX * 4;
    */

    camera.node.setTarget(fireNode1.position);

    new BABYLON.AxesViewer(scene);

    return updates.update;
};

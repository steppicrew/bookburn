import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { globals } from "../bookBlockShader/globals";
import { CreateCamera2 } from "../lib/camera1";
import { CreateSceneFn } from "../lib/sceneEx";
import { addAutoflipBook } from "../nodeLib/autoflipBookNode";
import { initBookDebugGui } from "./bookDebugGui";
import { updateWrapper } from "../lib/updateWrapper";

import { getInitializedHavok } from "./physics";

export const createScene: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    scene.debugLayer.show();

    // Initialize physics
    {
        const havokInstance = await getInitializedHavok();
        const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
        const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
        scene.enablePhysics(gravityVector, havokPlugin);
    }

    initBookDebugGui(
        scene,
        (manual) => {
            globals.useDebugTime = manual;
        },
        (time) => {
            globals.debugTime = time;
        }
    );

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
    const startTime = Date.now();
    for (let i = 0; i < 1; ++i) {
        console.log("BOOK", i);
        book = addAutoflipBook(scene, xrHelper, {
            startTime,
            flipAngle: (Math.PI * 1) / 3,
        });
        updates.addUpdates(book.updates);
        const ii = i % 25;
        book.node.position = new BABYLON.Vector3(
            Math.floor(ii / 5) * 5,
            (ii % 5) * 5 + 0.5,
            Math.floor(i / 25) * 5
        );
        book.node.rotation = new BABYLON.Vector3(-0.8, 0, 0);
        const physicsAggregate = book.addPhysics();
    }

    // Try anti-aliasing
    if (false) {
        var pipeline = new BABYLON.DefaultRenderingPipeline(
            "default",
            false,
            scene,
            scene.cameras
        );

        // Anti-aliasing
        pipeline.samples = 4;
        pipeline.fxaaEnabled = true;
        pipeline.grainEnabled = true;
        pipeline.grain.intensity = 3;
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

    // camera.node.setTarget(book!.node.position.clone());
    camera.node.setTarget(new BABYLON.Vector3(0, 0, 0));

    // Sphere
    {
        // Create a simple sphere to interact with
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            "sphere",
            { diameter: 1 },
            scene
        );
        sphere.position.x = -2.5;
        sphere.position.y = 2;
        sphere.position.z = 0;

        // Add color
        {
            const sphereMaterial = new BABYLON.StandardMaterial(
                "sphereMaterial",
                scene
            );
            sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0); // Red color
            sphere.material = sphereMaterial; // Apply the material to the sphere
        }

        // Create a sphere shape and the associated body. Size will be determined automatically.
        const sphereAggregate = new BABYLON.PhysicsAggregate(
            sphere,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: 1, restitution: 0.75 },
            scene
        );
    }

    // Ground
    if (true) {
        // Our built-in 'ground' shape.
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground",
            { width: 100, height: 100 },
            scene
        );

        // Ground color
        {
            const groundMaterial = new BABYLON.StandardMaterial(
                "groundMaterial",
                scene
            );
            groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            groundMaterial.backFaceCulling = false;
            ground.material = groundMaterial;
        }

        // Create a static box shape.
        const groundAggregate = new BABYLON.PhysicsAggregate(
            ground,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0 },
            scene
        );
    }

    new BABYLON.AxesViewer(scene);

    return updates.update;
};

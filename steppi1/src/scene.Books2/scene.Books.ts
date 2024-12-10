import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { globals } from "../bookBlockShader/globals";
import { CreateCamera2 } from "../lib/camera1";
import { CreateSceneFn } from "../lib/sceneEx";
import { updateWrapper } from "../lib/updateWrapper";
import { initBookDebugGui } from "./bookDebugGui";

import { getPhysicsMesh } from "../bookBlockShader/bookPhysicsMesh2";
import { initXR } from "../lib/xr";
import { createHand, simulateHandMovement } from "../nodeLib/handSimulator";
import { setMetadatas } from "../nodeLib/nodeTools";
import { initializePhysics } from "./physics";

export const createScene: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    scene.debugLayer.show();

    // Initialize physics
    await initializePhysics(scene);

    initXR(scene, xrHelper);

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
    getPhysicsMesh(scene, 2.1, 2.7, 0.5);

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
        const startPhysics = () =>
            new BABYLON.PhysicsAggregate(
                sphere,
                BABYLON.PhysicsShapeType.SPHERE,
                { mass: 1, restitution: 0.75 },
                scene
            );
        const stopPhysics = () => {
            sphere.physicsImpostor?.dispose();
        };
        setMetadatas(sphere, { startPhysics, stopPhysics });
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

    if (false) {
        let grabbedMesh: BABYLON.Nullable<BABYLON.AbstractMesh> = null;
        let grabbedMaterial: BABYLON.Nullable<BABYLON.Material> = null;
        scene.onPointerDown = (event, pickResult) => {
            if (pickResult.hit) {
                const pickedMesh = pickResult.pickedMesh;
                if (pickedMesh) {
                    grabbedMesh = pickedMesh;
                    grabbedMaterial = pickedMesh.material;
                    const material = new BABYLON.StandardMaterial(
                        "highlight",
                        scene
                    );
                    material.diffuseColor = BABYLON.Color3.Red();
                    grabbedMesh.material = material;
                }
            }
        };
        scene.onPointerUp = (event, pickResult) => {
            if (grabbedMesh) {
                grabbedMesh.material = grabbedMaterial;
                grabbedMesh = grabbedMaterial = null;
            }
        };

        const plane = new BABYLON.Plane(0, 1, 0, 0); // Horizontal plane

        scene.onPointerMove = (evt) => {
            if (grabbedMesh) {
            }
        };

        {
            const leftHand = createHand(scene, "left-hand");
            simulateHandMovement(leftHand, scene);
            console.log(xrHelper.input);
            /*
            const handTracker = xrHelper.input.getHandById("right");
            if (handTracker) {
                handTracker.joints.forEach((joint) => {
                    const jointMesh = MeshBuilder.CreateSphere(
                        "joint",
                        { diameter: 0.1 },
                        scene
                    );
                    scene.registerBeforeRender(() => {
                        jointMesh.position = joint.position.clone();
                    });
                });
            }
            */
        }
    }

    return updates.update;
};

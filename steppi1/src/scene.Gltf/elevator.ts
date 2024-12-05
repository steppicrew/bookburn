import * as BABYLON from "babylonjs";
import { makeGlassMaterial, makeWoodMaterial } from "./materialUtils";

export const addElevator = (
    scene: BABYLON.Scene,
    x: number,
    y: number,
    z: number,
    height: number,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (!xrHelper) {
        return;
    }

    const xrCamera = xrHelper.baseExperience.camera;

    const shaft = BABYLON.MeshBuilder.CreateBox(
        "elevatorShaft",
        { width: 3, depth: 2, height },
        scene
    );
    shaft.position = new BABYLON.Vector3(x, y + height / 2 + 0.05, z);

    /*
    const shaftMaterial = new BABYLON.StandardMaterial("elevatorShaft", scene);
    shaftMaterial.alpha = 0.5;
    shaftMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 1); // Light blue
*/
    const shaftMaterial = makeGlassMaterial(scene);
    shaft.material = shaftMaterial;
    shaft.material.backFaceCulling = false;

    const platform = BABYLON.MeshBuilder.CreateBox(
        "elevatorPlatform",
        { width: 2.9, depth: 1.9, height: 0.2 },
        scene
    );
    /*
    const platformMaterial = new BABYLON.StandardMaterial(
        "elevatorPlatform",
        scene
    );
    platformMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 1);
    */
    const platformMaterial = makeWoodMaterial(scene);
    platform.material = platformMaterial;
    platform.parent = shaft;
    const bounds = shaft.getBoundingInfo().boundingBox;
    platform.position = new BABYLON.Vector3(0, bounds.minimum.y, 0);
    xrHelper.teleportation.addFloorMesh(platform);

    // Proxy mesh for XR camera
    const cameraProxy = BABYLON.MeshBuilder.CreateSphere(
        "cameraProxy",
        { diameter: 0.3 },
        scene
    );
    cameraProxy.isVisible = false;
    cameraProxy.parent = xrCamera;

    // Flags to control the elevator's state
    let userOnElevator = false;

    const updateFloorY = () => {
        const floorY =
            xrCamera.position.y -
            bounds.minimumWorld.y -
            xrCamera.realWorldHeight +
            bounds.minimum.y;
        platform.position.y = Math.min(
            bounds.maximum.y,
            Math.max(bounds.minimum.y, floorY)
        ); // Clamp within bounds
    };

    // Move elevator floor up
    const moveUserUp = () => {
        if (
            xrCamera.position.y - xrCamera.realWorldHeight <
            bounds.maximumWorld.y - 2.4
        ) {
            xrCamera.position.y += 0.1; // Adjust speed as needed
            updateFloorY();
        } else {
            scene.onBeforeRenderObservable.removeCallback(moveUserUp);
            console.log("Reached the top of the transporter!");
        }
    };

    // Move elevator floor down
    const moveElevatorDown = () => {
        if (platform.position.y > bounds.minimum.y) {
            platform.position.y -= 0.1; // Downward speed
        } else {
            platform.position.y = bounds.minimum.y;
            console.log("Elevator reached the bottom.");
            scene.onBeforeRenderObservable.removeCallback(moveElevatorDown);
        }
    };

    // Trigger on entering the elevator
    shaft.actionManager = new BABYLON.ActionManager(scene);
    shaft.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter: cameraProxy,
            },
            () => {
                console.log("User entered the transporter!");
                userOnElevator = true;
                scene.onBeforeRenderObservable.add(moveUserUp);
                scene.onBeforeRenderObservable.removeCallback(moveElevatorDown);
            }
        )
    );

    // Trigger on exiting the elevator
    shaft.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
                parameter: cameraProxy,
            },
            () => {
                console.log("User exited the transporter!");
                userOnElevator = false;
                scene.onBeforeRenderObservable.add(moveElevatorDown);
                scene.onBeforeRenderObservable.removeCallback(moveUserUp);
            }
        )
    );
};

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

    const shaftMaterial = makeGlassMaterial(scene);
    shaft.material = shaftMaterial;
    shaft.material.backFaceCulling = false;

    const platform = BABYLON.MeshBuilder.CreateBox(
        "elevatorPlatform",
        { width: 2.9, depth: 1.9, height: 0.2 },
        scene
    );
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

    const updateFloorY = (frame: XRFrame) => {
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

    const moveUserUp = (frame: XRFrame) => {
        if (
            xrCamera.position.y - xrCamera.realWorldHeight <
            bounds.maximumWorld.y - 2.4
        ) {
            xrCamera.position.y += 0.1; // Adjust speed as needed
            updateFloorY(frame);
        }
    };

    const moveElevatorDown = (frame: XRFrame) => {
        if (platform.position.y >= bounds.minimum.y) {
            platform.position.y = Math.max(
                bounds.minimum.y,
                platform.position.y - 0.15
            );
        }
    };

    xrHelper.baseExperience.sessionManager.onXRFrameObservable.add((frame) => {
        if (userOnElevator) {
            moveUserUp(frame);
        } else {
            moveElevatorDown(frame);
        }
    });

    // Trigger on entering the elevator
    shaft.actionManager = new BABYLON.ActionManager(scene);
    shaft.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter: cameraProxy,
            },
            () => {
                console.log("User entered the elevator!");
                userOnElevator = true;
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
                console.log("User exited the elevator!");
                userOnElevator = false;
            }
        )
    );
};

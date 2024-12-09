import * as BABYLON from "babylonjs";
import { makeConsoleLogger } from "./ConsoleLogger";

const cl = makeConsoleLogger("playerGravity", true);

const floorMeshes: BABYLON.AbstractMesh[] = [];

const getFloorHeightUsingMeshes = (ray: BABYLON.Ray): number => {
    let closestFloorHeight = 0;
    let closestDistance = Infinity;

    for (const mesh of floorMeshes) {
        const pickInfo = ray.intersectsMesh(mesh, false); // false: no bounding box check
        if (pickInfo.hit && pickInfo.pickedPoint) {
            const distance = BABYLON.Vector3.Distance(
                ray.origin,
                pickInfo.pickedPoint
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestFloorHeight = pickInfo.pickedPoint.y;
            }
        }
    }

    return closestFloorHeight;
};

const getFloorHeightUnderCamera = (
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const position = xrHelper.baseExperience.camera.position;
    return getFloorHeightUsingMeshes(
        new BABYLON.Ray(
            position,
            new BABYLON.Vector3(0, -1, 0),
            Math.max(position.y, 2)
        )
    );
};

// Fixme: Checkout camera.checkCollisions = true; camera.applyGravity = true;

let gravityEnabled = true;

export const enableGravity = (enable: boolean) => {
    gravityEnabled = enable;
    console.log(`Gravity ${enable ? "enabled" : "disabled"}.`);
};

export const setupPlayerGravity = (
    scene: BABYLON.Scene,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (!xrHelper) return;

    const teleportation = xrHelper.teleportation;
    let parachute: BABYLON.AbstractMesh | undefined = undefined;
    let parachuteSound: BABYLON.Sound | undefined = undefined;

    BABYLON.SceneLoader.ImportMeshAsync(
        null,
        "assets/scene.Gltf/",
        "parachute.glb",
        scene
    ).then((result) => {
        if (!result.meshes?.length) {
            console.log("Can't load 'parachute.glb'");
            return;
        }
        parachute = result.meshes[0];
        parachute.setEnabled(false);
        parachute.name = "parachute";
        parachute.parent = xrCamera;
        parachute.position.y = -1;
        const boundingBox = parachute.getBoundingInfo().boundingBox;
        const bottomCenterLocal = new BABYLON.Vector3(
            boundingBox.center.x,
            boundingBox.center.y - boundingBox.extendSize.y,
            boundingBox.center.z
        );
        parachute.setPivotPoint(bottomCenterLocal);
        if (!parachute.rotationQuaternion) {
            parachute.rotationQuaternion = BABYLON.Quaternion.Identity();
            parachute.computeWorldMatrix(true);
        }

        parachuteSound = new BABYLON.Sound(
            "music",
            "assets/sound/howling-wind.mp3",
            scene,
            null,
            {
                loop: true,
                autoplay: false,
                volume: 0.03,
            }
        );
        parachuteSound.attachToMesh(parachute);
    });

    const originalAddFloorMesh = teleportation.addFloorMesh.bind(teleportation);
    teleportation.addFloorMesh = (mesh: BABYLON.AbstractMesh) => {
        floorMeshes.push(mesh);
        originalAddFloorMesh(mesh);
    };

    const originalRemoveFloorMesh =
        teleportation.removeFloorMesh.bind(teleportation);
    teleportation.removeFloorMesh = (mesh: BABYLON.AbstractMesh) => {
        const index = floorMeshes.indexOf(mesh);
        if (index < 0) {
            throw new Error(
                `setupTeleportationWithTracking: removeFloorMesh failed. Mesh ${mesh.name} not found in floorMeshes array.`
            );
        }
        floorMeshes.splice(index, 1);
        originalRemoveFloorMesh(mesh);
    };

    const xrCamera = xrHelper.baseExperience.camera;

    const INITIAL_GRAVITY = -0.2;
    let gravity = INITIAL_GRAVITY;

    let jump = false;
    let savedDirection = new BABYLON.Vector3(0, 0, 0);
    let adjustedDirection = new BABYLON.Vector3(0, 0, 0);
    let lastFloorHeight = 0;
    let parachuteAngle = 0;

    xrHelper.baseExperience.sessionManager.onXRFrameObservable.add((_frame) => {
        if (!gravityEnabled) {
            if (parachute) {
                parachute.setEnabled(false);
            }
            return;
        }

        const userHeightOffset = xrCamera.realWorldHeight || 1.6;
        const floorHeight = getFloorHeightUnderCamera(xrHelper);
        const minH = floorHeight + userHeightOffset;

        if (lastFloorHeight !== floorHeight) {
            cl.log("floorHeight", floorHeight, xrCamera.position.y, minH);
            lastFloorHeight = floorHeight;
        }

        if (xrCamera.position.y > minH) {
            cl.log("xrCamera.position.y > minH", xrCamera.position.y, minH);
        }

        if (xrCamera.position.y > minH) {
            const forwardRayDirection = xrCamera.getForwardRay().direction;
            const forward = new BABYLON.Vector3(
                forwardRayDirection.x,
                0,
                forwardRayDirection.z
            ).normalize();

            if (!jump) {
                jump = true;
                adjustedDirection = forward;
                parachuteAngle = -0.4;
            } else {
                adjustedDirection = BABYLON.Vector3.Lerp(
                    savedDirection,
                    forward,
                    0.5
                ).normalize();
            }
            savedDirection = adjustedDirection;

            xrCamera.position.addInPlace(adjustedDirection.scale(0.25));
            xrCamera.position.y = Math.max(minH, xrCamera.position.y - 0.075);

            if (parachute) {
                parachute.setEnabled(xrCamera.position.y > minH);
                if (parachute.isEnabled()) {
                    if (!parachuteSound?.isPlaying) {
                        parachuteSound?.play(0.3);
                    }
                    parachute.rotationQuaternion =
                        BABYLON.Quaternion.FromEulerAngles(
                            parachuteAngle,
                            0,
                            0
                        );
                    if (parachuteAngle < 0.8) {
                        parachuteAngle += 0.1;
                    }
                }
            }

            // xrCamera.position.y = Math.max(minH, xrCamera.position.y + gravity);
            // gravity *= 1.06;
        } else {
            gravity = INITIAL_GRAVITY;
            jump = false;
            parachute?.setEnabled(false);
            parachuteSound?.stop(0.5);
        }
    });
};

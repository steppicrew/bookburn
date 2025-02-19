import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import { getMetadata } from "../nodeLib/nodeTools";
import { makeConsoleLogger } from "../scene.Gltf/ConsoleLogger";
import { XrPhysicsBody } from "./xrTypes";

const cl = makeConsoleLogger("xr.ts");

const RayLength = 100;

const getControllerForwardVector = (
    controller: BABYLON.WebXRInputSource
): { origin: BABYLON.Vector3; direction: BABYLON.Vector3 } | undefined => {
    // Use the grip transform node if available, otherwise fallback to pointer
    const node = controller.pointer || controller.grip;
    if (!node) {
        console.warn("Controller has no grip or pointer node.");
        return undefined;
    }

    // Get the position and direction
    const origin = node.getAbsolutePosition();
    const direction = BABYLON.Vector3.TransformNormal(
        BABYLON.Vector3.Forward(),
        node.getWorldMatrix()
    ).normalize();

    return { origin, direction };
};

const getControllerForwardRay = (controller: BABYLON.WebXRInputSource) => {
    const vector = getControllerForwardVector(controller);

    if (!vector) {
        return undefined;
    }
    const { origin, direction } = vector;

    // Create and return the ray
    return new BABYLON.Ray(origin, direction, RayLength);
};

const grabBody = (mesh: BABYLON.AbstractMesh): XrPhysicsBody | undefined => {
    return getMetadata(mesh)?.physicsBody;
};

interface NodeTracking {
    previousPosition: BABYLON.Vector3;
    previousTimestamp: number;

    velocity: BABYLON.Vector3;
}

interface Grabbed {
    observable: BABYLON.Observer<XRFrame>;
    controller: BABYLON.WebXRInputSource;
    body: XrPhysicsBody;
    distance: number;

    tracking: NodeTracking;
}

const getCurrentPointerEndPosition = (grabbed: Grabbed) => {
    const vector = getControllerForwardVector(grabbed.controller);
    if (vector) {
        return vector.origin.add(vector.direction.scale(grabbed.distance));
    }
    return grabbed.body.getAbsolutePosition();
};

const observeRightHand = (
    xrHelper: BABYLON.WebXRDefaultExperience,
    xrController: BABYLON.WebXRInputSource,
    scene: BABYLON.Scene
) => {
    console.log("observeRightHand");
    let grabbed: Grabbed | undefined = undefined;

    // Logic for grabbing and releasing objects
    const grabObject = (
        xrController: BABYLON.WebXRInputSource,
        scene: BABYLON.Scene
    ) => {
        if (grabbed) {
            return;
        }

        // Calculate the forward ray
        const ray = getControllerForwardRay(xrController);
        if (!ray) {
            return;
        }
        /*
            BABYLON.RayHelper.CreateAndShow(
                ray,
                scene,
                new BABYLON.Color3(1, 0, 0)
            );
            */
        // Perform a ray pick
        const pickInfo = scene.pickWithRay(ray);
        if (!pickInfo?.hit || !pickInfo.pickedMesh) {
            console.log("No mesh picked");
            return;
        }

        pickInfo.distance;
        const _grabbedMesh = grabBody(pickInfo.pickedMesh);
        if (!_grabbedMesh) {
            console.log("No physics body found");
            return;
        }
        const pointerNode = xrController.pointer;

        if (!pointerNode) {
            cl.log("Controller is not a pointer", xrController);
            return;
        }

        cl.log("Grabbing mesh:", _grabbedMesh.name, "metadata");

        _grabbedMesh.stopPhysics();

        cl.log("Add observable");
        const observable =
            xrHelper.baseExperience.sessionManager.onXRFrameObservable.add(
                (frame) => {
                    if (!grabbed) {
                        cl.log(
                            "This should not happen: grabbedNode is not set but observable not removed."
                        );
                        xrHelper.baseExperience.sessionManager.onXRFrameObservable.remove(
                            observable
                        );
                        return;
                    }

                    const tracking = grabbed.tracking;

                    // Get current position of the pointer
                    const currentPosition =
                        getCurrentPointerEndPosition(grabbed);

                    // Get the current timestamp
                    const currentTimestamp = performance.now();

                    // Calculate time interval (in seconds)
                    const deltaTime =
                        (currentTimestamp - tracking.previousTimestamp) / 1000;

                    // Calculate velocity as (current - previous) / deltaTime
                    const movedBy = currentPosition.subtract(
                        tracking.previousPosition
                    );

                    grabbed.body.moveWithCollisions(movedBy);

                    const velocity = movedBy.scale(1 / deltaTime);

                    // Update previous values
                    grabbed.tracking = {
                        velocity,
                        previousPosition: currentPosition.clone(),
                        previousTimestamp: currentTimestamp,
                    };
                }
            );

        grabbed = {
            controller: xrController,
            distance: pickInfo.distance,
            body: _grabbedMesh,
            observable,
            tracking: {
                previousPosition: BABYLON.Vector3.Zero(),
                previousTimestamp: performance.now(),
                velocity: BABYLON.Vector3.Zero(),
            },
        };
        grabbed.tracking.previousPosition =
            getCurrentPointerEndPosition(grabbed);
    };

    const releaseObject = (
        xrController: BABYLON.WebXRInputSource,
        scene: BABYLON.Scene
    ) => {
        if (grabbed?.controller != xrController) {
            return;
        }

        // Apply impulse based on pointer velocity
        grabbed.body.startPhysics(grabbed.tracking.velocity);
        /*
        grabbedMesh.mesh.physicsImpostor?.applyImpulse(
            grabbedMesh.tracking.velocity.scale(5), // Adjust scale factor as needed
            getCurrentPointerEndPosition(grabbedMesh)
        );
        */

        cl.log(
            "Object released:",
            grabbed.body.name,
            grabbed.body.getAbsolutePosition()
        );

        cl.log("Remove observable");
        xrHelper.baseExperience.sessionManager.onXRFrameObservable.remove(
            grabbed.observable
        );

        grabbed = undefined;
    };

    xrController.onMotionControllerInitObservable.add((motionController) => {
        // Get the "squeeze" or "trigger" component for grabbing
        const grabComponent =
            motionController.getComponent("xr-standard-trigger") ||
            motionController.getComponent("xr-standard-squeeze");

        cl.log("onmotion component", grabComponent.type);

        if (grabComponent) {
            grabComponent.onButtonStateChangedObservable.add(() => {
                if (grabComponent.changes.pressed) {
                    if (grabComponent.pressed) {
                        grabObject(xrController, scene);
                    } else {
                        releaseObject(xrController, scene);
                    }
                }
            });
        }
    });
};

export const initXR = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    // Function to detect grab gesture (check if index and thumb are close together)
    const detectGrab = (xrController: BABYLON.WebXRInputSource): boolean => {
        const hand = xrController.inputSource.hand;
        // console.log("detectGrab", hand, xrController.inputSource);

        if (hand) {
            const thumb = hand.get("thumb-tip");
            const index = hand.get("index-finger-tip");

            if (thumb && index) {
                const thumbPos = (thumb as any).position;
                const indexPos = (index as any).position;

                if (thumbPos && indexPos) {
                    const distance = BABYLON.Vector3.Distance(
                        thumbPos,
                        indexPos
                    );
                    return distance < 0.03; // Adjust threshold for "grab" detection
                }
            }
        }
        return false;
    };

    // Function to check which mesh is being grabbed
    const checkForGrabbedMesh = (
        xrController: BABYLON.WebXRInputSource,
        meshes: BABYLON.AbstractMesh[]
    ): BABYLON.Nullable<BABYLON.AbstractMesh> => {
        const hand = xrController.inputSource.hand;

        if (hand) {
            const palm = hand.get("wrist");

            if (palm) {
                const palmPos = (palm as any).position;

                if (palmPos) {
                    for (let mesh of meshes) {
                        if (mesh.name === "ground") continue;

                        if (mesh.isPickable && mesh.intersectsPoint(palmPos)) {
                            return mesh; // Return the mesh being grabbed
                        }
                    }
                }
            }
        }
        return null;
    };

    // Function to move the grabbed mesh with the hand
    const moveGrabbedMesh = (
        xrController: BABYLON.WebXRInputSource,
        mesh: BABYLON.AbstractMesh
    ): void => {
        const hand = xrController.inputSource.hand;

        if (hand) {
            const palm = hand.get("wrist");

            if (palm) {
                const palmPos = (palm as any).position;

                if (palmPos) {
                    mesh.position.copyFrom(palmPos); // Update mesh position with palm position
                }
            }
        }
    };

    // Enable hand tracking
    xrHelper.input.onControllerAddedObservable.add(
        (xrController: BABYLON.WebXRInputSource) => {
            observeRightHand(xrHelper, xrController, scene);

            /*
            if (xrController.inputSource.handedness === "right") {
                console.log("Hand controller added");

                // Hand tracking is available
                let grabbedMesh: BABYLON.Nullable<BABYLON.AbstractMesh> = null;
                let isGrabbing = false;

                // Check for the grab gesture on every frame
                scene.onBeforeRenderObservable.add(() => {
                    if (detectGrab(xrController)) {
                        console.log("detectGrab", isGrabbing);
                        if (!isGrabbing) {
                            // Detect if there's a mesh to grab
                            grabbedMesh = checkForGrabbedMesh(
                                xrController,
                                scene.meshes
                            );
                            if (grabbedMesh) {
                                isGrabbing = true;
                                console.log("Mesh grabbed:", grabbedMesh.name);
                            }
                        } else if (grabbedMesh) {
                            // Move the grabbed mesh with the hand
                            moveGrabbedMesh(xrController, grabbedMesh);
                        }
                    } else {
                        // If no grab is detected, release the mesh
                        if (isGrabbing && grabbedMesh) {
                            console.log("Mesh released:", grabbedMesh.name);
                        }
                        isGrabbing = false;
                        grabbedMesh = null;
                    }
                });
            }
            */
        }
    );
};

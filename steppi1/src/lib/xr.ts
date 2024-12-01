import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

const getControllerForwardRay = (controller: BABYLON.WebXRInputSource) => {
    // Use the grip transform node if available, otherwise fallback to pointer
    const node = controller.pointer || controller.grip;
    if (!node) {
        console.warn("Controller has no grip or pointer node.");
        return null;
    }

    // Get the position and direction
    const origin = node.getAbsolutePosition();
    const forward = new BABYLON.Vector3(0, 0, 1); // Default forward in local space
    const direction = BABYLON.Vector3.TransformNormal(
        forward,
        node.getWorldMatrix()
    ).normalize();

    // Create and return the ray
    return new BABYLON.Ray(origin, direction, 10); // Length is 10 units (can be adjusted)
};

const observeRightHand = (
    xrController: BABYLON.WebXRInputSource,
    scene: BABYLON.Scene
) => {
    let observable: BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>> = null;
    let grabbedMesh: BABYLON.Nullable<BABYLON.AbstractMesh> = null;

    let previousPosition: BABYLON.Vector3 | null = null;
    let previousTimestamp: number | null = null;
    let currentVelocity = new BABYLON.Vector3(0, 0, 0);

    // Logic for grabbing and releasing objects
    const grabObject = (
        xrController: BABYLON.WebXRInputSource,
        scene: BABYLON.Scene
    ) => {
        observable = scene.onBeforeRenderObservable.add(() => {
            if (!grabbedMesh) {
                // Calculate the forward ray
                const ray = getControllerForwardRay(xrController);
                if (ray) {
                    // Perform a ray pick
                    const pickInfo = scene.pickWithRay(ray);
                    if (pickInfo?.hit && pickInfo.pickedMesh) {
                        console.log(
                            "Grabbing mesh:",
                            pickInfo.pickedMesh.name,
                            pickInfo.pickedMesh.getAbsolutePosition()
                        );
                        grabbedMesh = pickInfo.pickedMesh;
                    }
                }
            }
            {
                const pointerNode = xrController.pointer;
                if (pointerNode) {
                    // Get current position of the pointer
                    const currentPosition = pointerNode.getAbsolutePosition();

                    // Get the current timestamp
                    const currentTime = performance.now();

                    if (previousPosition && previousTimestamp) {
                        // Calculate time interval (in seconds)
                        const deltaTime =
                            (currentTime - previousTimestamp) / 1000;

                        // Calculate velocity as (current - previous) / deltaTime
                        const movedBy =
                            currentPosition.subtract(previousPosition);

                        if (grabbedMesh) {
                            console.log("p1", grabbedMesh.position);
                            grabbedMesh.moveWithCollisions(movedBy);
                            console.log("p2", grabbedMesh.position);
                        }
                        currentVelocity = movedBy.scale(1 / deltaTime);
                        if (currentVelocity.lengthSquared() != 0) {
                            console.log("currentVelocity", currentVelocity);
                        }
                    }

                    // Update previous values
                    previousPosition = currentPosition.clone();
                    previousTimestamp = currentTime;
                }
            }
        });
    };

    const releaseObject = (
        xrController: BABYLON.WebXRInputSource,
        scene: BABYLON.Scene
    ) => {
        if (grabbedMesh) {
            // Detach the mesh from the controller
            grabbedMesh.setParent(null);
            // Apply impulse based on pointer velocity
            if (grabbedMesh.physicsImpostor) {
                grabbedMesh.physicsImpostor.applyImpulse(
                    currentVelocity.scale(5), // Adjust scale factor as needed
                    grabbedMesh.getAbsolutePosition()
                );
            }
            console.log(
                "Object released:",
                grabbedMesh.name,
                grabbedMesh.getAbsolutePosition()
            );
            grabbedMesh = null;
        }
        scene.onBeforeRenderObservable.remove(observable);
    };

    xrController.onMotionControllerInitObservable.add((motionController) => {
        // Get the "squeeze" or "trigger" component for grabbing
        const grabComponent =
            motionController.getComponent("xr-standard-squeeze") ||
            motionController.getComponent("xr-standard-trigger");

        if (grabComponent) {
            grabComponent.onButtonStateChangedObservable.add(() => {
                if (grabComponent.changes.pressed) {
                    if (grabComponent.pressed) {
                        console.log("Grab started with the right hand.");
                        grabObject(xrController, scene);
                    } else {
                        console.log("Grab released with the right hand.");
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
            console.log("controller added", xrController);
            observeRightHand(xrController, scene);
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
        }
    );
};

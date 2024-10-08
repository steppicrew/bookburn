import {
    Scene,
    Vector3,
    WebXRDefaultExperience,
    AbstractMesh,
    WebXRInputSource,
} from "babylonjs";
import "babylonjs-loaders";

export const initXR = (scene: Scene, xrHelper: WebXRDefaultExperience) => {
    // Function to detect grab gesture (check if index and thumb are close together)
    function detectGrab(xrController: WebXRInputSource): boolean {
        const hand = xrController.inputSource.hand;

        if (hand) {
            const thumb = hand.get("thumb-tip");
            const index = hand.get("index-finger-tip");

            if (thumb && index) {
                const thumbPos = (thumb as any).position;
                const indexPos = (index as any).position;

                if (thumbPos && indexPos) {
                    const distance = Vector3.Distance(thumbPos, indexPos);
                    return distance < 0.03; // Adjust threshold for "grab" detection
                }
            }
        }
        return false;
    }

    // Function to check which mesh is being grabbed
    function checkForGrabbedMesh(
        xrController: WebXRInputSource,
        meshes: AbstractMesh[]
    ): AbstractMesh | null {
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
    }

    // Function to move the grabbed mesh with the hand
    function moveGrabbedMesh(
        xrController: WebXRInputSource,
        mesh: AbstractMesh
    ): void {
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
    }

    // Enable hand tracking
    xrHelper.input.onControllerAddedObservable.add(
        (xrController: WebXRInputSource) => {
            if (xrController.inputSource.hand) {
                // Hand tracking is available
                let grabbedMesh: AbstractMesh | null = null;
                let isGrabbing = false;

                // Check for the grab gesture on every frame
                scene.onBeforeRenderObservable.add(() => {
                    if (detectGrab(xrController)) {
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

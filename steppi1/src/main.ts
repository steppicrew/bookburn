import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { createGround } from "./baseScene";
import { createBook } from "./book";
import { createBook2 } from "./book2";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById(
        "renderCanvas"
    ) as any as HTMLCanvasElement;
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);

        // Create a camera for non-VR users (or fallback when not in VR)
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 2,
            4,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);

        // Create a basic light
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(1, 1, 0),
            scene
        );

        const ground = createGround(scene);
        const book = createBook(scene);

        book.book.position.x = 4;
        book.book.rotation = new BABYLON.Vector3(0, (2 * Math.PI) / 3, 0);

        canvas.addEventListener("pointerdown", () => {
            book.flipPage();
        });

        return scene
            .createDefaultXRExperienceAsync({
                floorMeshes: [ground], // Optional: Set a mesh as the floor to interact with (e.g., ground plane)
            })
            .then((xrHelper) => {
                xrHelper.teleportation.addFloorMesh(ground);

                xrHelper.input.onControllerAddedObservable.add((controller) => {
                    controller.onMotionControllerInitObservable.add(
                        (motionController) => {
                            const triggerComponent =
                                motionController.getComponent(
                                    "xr-standard-trigger"
                                );

                            // Listen for trigger button press
                            triggerComponent?.onButtonStateChangedObservable.add(
                                (state) => {
                                    if (state.pressed) {
                                        // Flip to next page on trigger press
                                        book.flipPage(1);
                                    }
                                }
                            );
                        }
                    );
                });
                return { scene, light };
            });
    };

    createScene().then(({ scene, light }) => {
        let angle = 0; // Initial rotation angle
        // Render loop: rotate the light around the Y-axis
        engine.runRenderLoop(() => {
            angle += 0.01; // Increment the angle (adjust the speed by changing this value)

            // Update light's direction to rotate it
            light.direction = new BABYLON.Vector3(
                Math.sin(angle),
                1,
                Math.cos(angle)
            );

            scene.render();
        });

        window.addEventListener("resize", () => {
            engine.resize();
        });
    });
});

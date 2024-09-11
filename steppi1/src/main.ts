import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById(
        "renderCanvas"
    ) as any as HTMLCanvasElement;
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = async () => {
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

        // Create a simple sphere to interact with
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            "sphere",
            { diameter: 1 },
            scene
        );

        // Set up WebXR experience helper
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [sphere], // Optional: Set a mesh as the floor to interact with (e.g., ground plane)
        });

        // Optional: Modify WebXR settings (e.g., enable teleportation)
        xrHelper.teleportation.addFloorMesh(sphere);

        return { scene, light };
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

import * as BABYLON from "babylonjs";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById(
        "renderCanvas"
    ) as any as HTMLCanvasElement;
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = async () => {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new BABYLON.Scene(engine);

        // This creates and positions a free camera (non-mesh)
        var camera = new BABYLON.FreeCamera(
            "camera1",
            new BABYLON.Vector3(0, 5, -10),
            scene
        );

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape.
        var sphere = BABYLON.MeshBuilder.CreateSphere(
            "sphere",
            { diameter: 2, segments: 32 },
            scene
        );

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape.
        var ground = BABYLON.MeshBuilder.CreateGround(
            "ground",
            { width: 6, height: 6 },
            scene
        );

        scene.createDefaultEnvironment();

        // XR
        const xrHelper = await scene.createDefaultXRExperienceAsync();

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
    });

    window.addEventListener("resize", () => {
        engine.resize();
    });
});

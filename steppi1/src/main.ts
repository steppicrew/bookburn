import * as BABYLON from "babylonjs";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById(
        "renderCanvas"
    ) as any as HTMLCanvasElement;
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);

        const camera = new BABYLON.ArcRotateCamera(
            "camera1",
            Math.PI / 2,
            Math.PI / 2,
            4,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);

        // Create a rotating Hemispheric Light
        const light = new BABYLON.HemisphericLight(
            "light1",
            new BABYLON.Vector3(1, 1, 0),
            scene
        );

        // Create a sphere
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            "sphere",
            { diameter: 1 },
            scene
        );

        return { scene, light };
    };

    const { scene, light } = createScene();

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

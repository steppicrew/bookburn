import * as BABYLON from "babylonjs";

export const createGround = (scene: BABYLON.Scene) => {
    // Create a ground mesh for teleportation
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 10, height: 10 },
        scene
    );

    // Optional: Give the ground a material for better visibility
    const groundMaterial = new BABYLON.StandardMaterial(
        "groundMaterial",
        scene
    );
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Set a gray color
    ground.material = groundMaterial;

    // Create a simple sphere to interact with
    const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 2 },
        scene
    );
    sphere.position.y = 1;

    return ground;
};

export const createSphere = (scene: BABYLON.Scene) => {
    // Create a simple sphere to interact with
    const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 2 },
        scene
    );
    sphere.position.y = 1;

    return sphere;
};

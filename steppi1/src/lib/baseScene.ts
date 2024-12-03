import * as BABYLON from "babylonjs";

export const createGround = (scene: BABYLON.Scene) => {
    // Create a ground mesh for teleportation
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 100, height: 100 },
        scene
    );

    const texture = new BABYLON.Texture("assets/grass.jpg", scene);
    texture.uScale = 20;
    texture.vScale = 20;

    const groundMaterial = new BABYLON.BackgroundMaterial(
        "groundMaterial",
        scene
    );
    groundMaterial.diffuseTexture = texture;
    groundMaterial.shadowLevel = 0.4;
    // groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Set a gray color

    ground.material = groundMaterial;
    ground.receiveShadows = true;

    // TODO: Test!
    // ground.onReady = function () {
    //     ground.optimize(100);
    // }

    return ground;
};

// Create a simple sphere to interact with
export const createSphere = (
    scene: BABYLON.Scene,
    shadowGenerator: BABYLON.ShadowGenerator
) => {
    const diameter = 1;
    const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter },
        scene
    );
    sphere.position.y = diameter * 0.5;
    shadowGenerator.addShadowCaster(sphere);

    const update = () => {
        sphere.position.y =
            diameter * 0.5 + 3 * Math.abs(Math.sin(performance.now() * 0.003));
    };

    return { sphere, update };
};

export const createSkybox = (scene: BABYLON.Scene) => {
    // The HDR texture set up in the code you provided is not directly
    // visible as a background in the scene but is used primarily for
    // lighting, reflections, and overall environment effects.

    const skybox = BABYLON.MeshBuilder.CreateBox(
        "skyBox",
        { size: 1000.0 },
        scene
    );

    const hdrTexture = new BABYLON.CubeTexture("assets/skybox1/skybox", scene);
    hdrTexture.name = "envTex";
    hdrTexture.gammaSpace = false; // ??

    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.reflectionTexture = hdrTexture;
    skyboxMaterial.reflectionTexture.coordinatesMode =
        BABYLON.Texture.SKYBOX_MODE;

    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;

    scene.environmentTexture = hdrTexture;

    return skybox;
};

export const createGround1 = (scene: BABYLON.Scene) => {
    // Create a ground mesh
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 100, height: 100 },
        scene
    );

    // Create a standard material with a solid color
    const groundMaterial = new BABYLON.StandardMaterial(
        "groundMaterial",
        scene
    );

    // Set the diffuse color for the ground (e.g., light green for grass)
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.8, 0.4); // Light green
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular highlights

    // Apply the material to the ground
    ground.material = groundMaterial;

    // Enable the ground to receive shadows
    ground.receiveShadows = true;

    return ground;
};

export const createSkybox1 = (scene: BABYLON.Scene) => {
    // Create a large sphere for the sky
    const skybox = BABYLON.MeshBuilder.CreateSphere(
        "skybox",
        { diameter: 1000 },
        scene
    );

    // Create a basic material
    const skyboxMaterial = new BABYLON.StandardMaterial(
        "skyboxMaterial",
        scene
    );
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // Light sky blue
    skyboxMaterial.specularColor = BABYLON.Color3.Black(); // No specular highlights
    skyboxMaterial.emissiveColor = BABYLON.Color3.FromHexString("#87CEEB"); // Glow with sky color

    skyboxMaterial.backFaceCulling = false; // Render the inside of the sphere

    // Apply the material to the skybox
    skybox.material = skyboxMaterial;

    // Prevent the skybox from casting or receiving shadows
    skybox.isPickable = false;
    skybox.checkCollisions = false;
    skybox.infiniteDistance = true;

    return skybox;
};

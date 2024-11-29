import * as BABYLON from "babylonjs";

export const createGround = (scene: BABYLON.Scene) => {
    // Create a ground mesh for teleportation
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 100, height: 100 },
        scene
    );

    const texture = new BABYLON.Texture("assets/grass.jpg", scene);
    texture.uScale = 20.0;
    texture.vScale = 20.0;

    const groundMaterial = new BABYLON.BackgroundMaterial(
        "groundMaterial",
        scene
    );
    groundMaterial.diffuseTexture = texture;
    groundMaterial.shadowLevel = 0.4;
    // groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Set a gray color

    ground.material = groundMaterial;
    ground.receiveShadows = true;

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

    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "assets/Runyon_Canyon_A_2k_cube_specular.dds",
        scene
    );
    hdrTexture.name = "envTex";
    hdrTexture.gammaSpace = false;

    scene.registerBeforeRender(() => {
        hdrTexture.setReflectionTextureMatrix(BABYLON.Matrix.RotationY(0));
    });

    scene.environmentTexture = hdrTexture;

    const skybox = BABYLON.MeshBuilder.CreateBox(
        "skyBox",
        { size: 1000.0 },
        scene
    );
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = hdrTexture;
    skyboxMaterial.reflectionTexture.coordinatesMode =
        BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    return skybox;
};

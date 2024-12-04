import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { CreateCamera2 } from "../lib/camera1";
import { CreateSceneFn } from "../lib/sceneEx";
import { createGround1, createSkybox1 } from "../lib/baseScene";
import { sceneContent } from "./sceneContent";
import { updateWrapper } from "../lib/updateWrapper";

const light1 = (directionalLight: BABYLON.DirectionalLight) => {
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true; // Enable soft shadows
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.blurKernel = 16; // Smaller value for VR performance
    shadowGenerator.depthScale = 0.5; // Reduce depth precision for better performance
    shadowGenerator.setDarkness(0.4);
    return shadowGenerator;
};

const light2 = (directionalLight: BABYLON.DirectionalLight) => {
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    // PCF
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
    shadowGenerator.setDarkness(0.4);
    return shadowGenerator;
};

const light3 = (directionalLight: BABYLON.DirectionalLight) => {
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    // PCSS?
    shadowGenerator.useContactHardeningShadow = true;
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
    return shadowGenerator;
};

// best1
const light4 = (directionalLight: BABYLON.DirectionalLight) => {
    const shadowGenerator = new BABYLON.CascadedShadowGenerator(
        1024,
        directionalLight
    );
    shadowGenerator.setDarkness(0.4);

    shadowGenerator.lambda = 1;
    shadowGenerator.freezeShadowCastersBoundingInfo = true;
    shadowGenerator.cascadeBlendPercentage = 0; // perf

    // shadowGenerator.autoCalcDepthBounds = true;

    return shadowGenerator;
};

// best2
const light5 = (directionalLight: BABYLON.DirectionalLight) => {
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    shadowGenerator.bias = 0.001;
    shadowGenerator.normalBias = 0.5;
    shadowGenerator.setDarkness(0.4);
    directionalLight.position = new BABYLON.Vector3(6, 20, -10);
    directionalLight.direction = new BABYLON.Vector3(-1, -2, -1);
    directionalLight.shadowMinZ = -40;
    directionalLight.shadowMaxZ = 55;
    return shadowGenerator;
};

//
const light6 = (directionalLight: BABYLON.DirectionalLight) => {
    const shadowGenerator = new BABYLON.CascadedShadowGenerator(
        1024,
        directionalLight
    );
    shadowGenerator.setDarkness(0.1);

    shadowGenerator.lambda = 1;
    shadowGenerator.freezeShadowCastersBoundingInfo = true;
    shadowGenerator.cascadeBlendPercentage = 0; // perf
    shadowGenerator.shadowMaxZ = 1000;
    shadowGenerator.stabilizeCascades = true;

    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;

    // shadowGenerator.numCascades = 2;

    // shadowGenerator.autoCalcDepthBounds = true;

    directionalLight.position = new BABYLON.Vector3(6, 20, -10);
    directionalLight.direction = new BABYLON.Vector3(-1, -2, -1);
    directionalLight.shadowMinZ = -40;
    directionalLight.shadowMaxZ = 55;

    return shadowGenerator;
};

export const createScene: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    scene.debugLayer.show();

    // ====================================

    if (true) {
        createSkybox1(scene);

        const ground = createGround1(scene);
        ground.isPickable = false;
        xrHelper.teleportation.addFloorMesh(ground);

        ground.checkCollisions = true;
    }

    // ====================================

    const hemisphericLight = new BABYLON.HemisphericLight(
        "hemisphericLight",
        new BABYLON.Vector3(5, 10, 0),
        scene
    );
    hemisphericLight.intensity = 0.7;

    const directionalLight = new BABYLON.DirectionalLight(
        "directionalLight",
        new BABYLON.Vector3(-1, -2, -1),
        scene
    );

    const shadowGenerator = light6(directionalLight);

    directionalLight.autoUpdateExtends = false;

    /*
    if (false) {
        const shadowMap = shadowGenerator.getShadowMap();
        if (shadowMap) {
            console.log("ShadowMap found");
            shadowMap.refreshRate =
                BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        }
        directionalLight.autoUpdateExtends = false;
    }
    */

    await sceneContent(scene, shadowGenerator, xrHelper);

    // ====================================

    const updates = updateWrapper();

    camera.node.setTarget(new BABYLON.Vector3(0, 0, 0));

    return updates.update;
};

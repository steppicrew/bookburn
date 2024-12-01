import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { CreateCamera2 } from "../lib/camera1";
import { CreateSceneFn } from "../lib/sceneEx";
import { createGround1, createSkybox1 } from "../lib/baseScene";
import { sceneContent } from "./sceneContent";
import { updateWrapper } from "../lib/updateWrapper";

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

    const shadowGenerator = new BABYLON.CascadedShadowGenerator(
        1024,
        directionalLight
    );
    const shadow = 3;
    if (shadow === 1) {
        shadowGenerator.useBlurExponentialShadowMap = true; // Enable soft shadows
        shadowGenerator.useKernelBlur = true;
        shadowGenerator.blurKernel = 16; // Smaller value for VR performance
        shadowGenerator.depthScale = 0.5; // Reduce depth precision for better performance
    }
    if (shadow === 2) {
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
    }
    if (shadow === 3) {
        shadowGenerator.useContactHardeningShadow = true;
        shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
    }
    // shadowGenerator.enableSoftTransparentShadow = true;
    // shadowGenerator.bias = 0.00001;
    // shadowGenerator.forceBackFacesOnly;
    shadowGenerator.setDarkness(0.4);

    shadowGenerator.lambda = 1;
    // shadowGenerator.autoCalcDepthBounds = true;
    shadowGenerator.freezeShadowCastersBoundingInfo = false;
    shadowGenerator.cascadeBlendPercentage = 0; // perf

    // shadowGenerator.depthClamp = true;
    // shadowGenerator.stabilizeCascades = false;

    if (false) {
        const shadowMap = shadowGenerator.getShadowMap();
        if (shadowMap) {
            console.log("ShadowMap found");
            shadowMap.refreshRate =
                BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        }
        directionalLight.autoUpdateExtends = false;
    }

    await sceneContent(scene, shadowGenerator);

    // ====================================

    const updates = updateWrapper();

    camera.node.setTarget(new BABYLON.Vector3(0, 0, 0));

    return updates.update;
};

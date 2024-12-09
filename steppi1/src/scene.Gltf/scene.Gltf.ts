import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { CreateCamera2 } from "../lib/camera1";
import { CreateSceneFn } from "../lib/sceneEx";
import { createGround1, createSkybox1 } from "../lib/baseScene";
import { sceneContent } from "./sceneContent";
import { updateWrapper } from "../lib/updateWrapper";
import { setupPlayerGravity } from "./playerGravity";

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

    return shadowGenerator;
};

export const createScene: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    if (import.meta.env.DEV) {
        scene.debugLayer.show();
        new BABYLON.Debug.AxesViewer(scene, 1);
    }

    // ====================================

    // BEFORE gound setup
    setupPlayerGravity(xrHelper);

    {
        const size = 10000;
        createSkybox1(scene, size);

        const ground = createGround1(scene, size);
        ground.isPickable = false;
        xrHelper.teleportation.addFloorMesh(ground);

        ground.checkCollisions = true;
    }

    // Exit XR when "B" pressed
    xrHelper.input.onControllerAddedObservable.add((inputSource) => {
        inputSource.onMotionControllerInitObservable.add((motionController) =>
            motionController
                .getComponent("b-button")
                ?.onButtonStateChangedObservable.add((component) => {
                    if (component.pressed) {
                        void xrHelper.baseExperience.exitXRAsync();
                    }
                })
        );
    });

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
    directionalLight.position = new BABYLON.Vector3(6, 20, -10);
    directionalLight.direction = new BABYLON.Vector3(-1, -2, -1);
    directionalLight.shadowMinZ = -40;
    directionalLight.shadowMaxZ = 55;

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

    // Important, otherwise there is staggering audio
    scene.audioPositioningRefreshRate = 100;

    const audioEngine = BABYLON.Engine.audioEngine;
    if (audioEngine) {
        audioEngine.useCustomUnlockedButton = true;

        xrHelper.baseExperience.onStateChangedObservable.add((state) => {
            if (state === BABYLON.WebXRState.IN_XR) {
                if (!audioEngine.unlocked) {
                    audioEngine.unlock();
                    console.log("Audio unlocked for XR.");

                    new BABYLON.Sound(
                        "ambientSound",
                        "assets/sound/bird-chirping-in-the-garden-sound-effect.mp3",
                        scene,
                        null,
                        {
                            spatialSound: false,
                            loop: true,
                            autoplay: true,
                            volume: 0.3,
                        }
                    );
                }
            }
        });
    }

    await sceneContent(scene, camera, shadowGenerator, xrHelper);

    // ====================================

    const updates = updateWrapper();

    camera.node.setTarget(new BABYLON.Vector3(0, 0, 0));

    return updates.update;
};

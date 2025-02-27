import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { CreateCamera2 } from "../lib/camera1";
import { CreateSceneFn } from "../lib/sceneEx";
import { createGround1, createSkybox1 } from "../lib/baseScene";
import { updateWrapper } from "../lib/updateWrapper";
import { sceneContent } from "./sceneContent";

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
    // ====================================

    if (import.meta.env.DEV) {
        scene.debugLayer.show();
        new BABYLON.Debug.AxesViewer(scene, 1);
    }

    // ====================================

    // BEFORE gound setup
    // setupPlayerGravity(scene, xrHelper);

    {
        const size = 10000;
        createSkybox1(scene, size);

        const ground = createGround1(scene, size);
        ground.isPickable = false;
        xrHelper.teleportation.addFloorMesh(ground);

        ground.checkCollisions = true;
    }

    // ====================================

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

    // ====================================

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

    // ====================================

    const plane = BABYLON.MeshBuilder.CreatePlane(
        "teleportationBlocker",
        { size: 1000 },
        scene
    );
    plane.position.y = 4;
    plane.addRotation(Math.PI / 2, 0, 0);
    plane.isVisible = false;
    // plane.material = new BABYLON.StandardMaterial("teleportationBlocker");
    // plane.material.alpha = 0.2;
    xrHelper.teleportation.addBlockerMesh(plane);

    xrHelper.baseExperience.sessionManager.onXRFrameObservable.add((_frame) => {
        const xrCamera = xrHelper.baseExperience.camera;
        plane.position = xrCamera.position.clone();
        plane.position.y -= 7;
    });

    // ====================================

    await sceneContent(scene, camera, shadowGenerator, xrHelper);

    // ====================================

    const updates = updateWrapper();

    camera.node.setTarget(new BABYLON.Vector3(0, 0, 0));

    return updates.update;
};

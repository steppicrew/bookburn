import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {
    addHouse,
    flushTeleportationCells as flushHouses,
} from "../nodeLib/houseNode";
import { CreateCamera2 } from "../lib/camera1";
import { flushAssetThinInstances } from "../lib/assetLoader";

export const addHouses = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    // outline MUST be counter clockwise

    await addHouse(scene, -20, 16, [10, -10], {
        floors: 2,
        shadowGenerator,
    });
};

export const sceneContent = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    // addPerson(scene);
    // addDebugGrid(scene);

    console.log("SCENECONTENT");

    await addHouses(scene, shadowGenerator, xrHelper);

    scene.onBeforeCameraRenderObservable.addOnce(() => {
        camera.node.target = new BABYLON.Vector3(
            -98.79350159074379,
            -0.9495311218264757,
            -117.06590562917238
        );
        camera.node.alpha = 4.273743901370716;
        camera.node.beta = 1.6277379220724377;
        camera.node.radius = 0.0005723988569103608;

        camera.node.target = new BABYLON.Vector3(
            -82.43530572537381,
            93.42749569638661,
            -12.772009656214406
        );
        camera.node.alpha = 3.8305841657285895;
        camera.node.beta = 0.6526176519707895;
        camera.node.radius = 0;
    });

    flushAssetThinInstances();
    flushHouses(scene, xrHelper);

    /*
    // https://doc.babylonjs.com/features/featuresDeepDive/webXR/WebXRSelectedFeatures/WebXRLayers/

    try {
        // Attempt to enable the 'xr-layers' feature
        await xrHelper?.baseExperience.featuresManager.enableFeature(
            BABYLON.WebXRFeatureName.LAYERS,
            "stable"
        );
        console.log("XR Layers enabled successfully!");
    } catch (error) {
        // Handle unsupported feature gracefully
        console.log(
            "sceneContent: XR Layers feature is not supported in this environment:",
            error
        );
    }
    */

    /*
    xrHelper?.onInitialXRPoseSetObservable.add((xrCamera) => {
        // floor is at y === 2
        xrCamera.position.y = 2;
    });
    */
};

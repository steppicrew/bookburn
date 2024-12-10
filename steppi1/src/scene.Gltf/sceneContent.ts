import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {
    addHouse,
    addHouse1,
    flushTeleportationCells as flushHouses,
} from "../nodeLib/houseNode";
import { flushAssetThinInstances } from "./assetLoader";
import { addCity } from "./addCity";
import { makeWalls } from "../nodeLib/makeWalls";
import { makeRandom } from "../lib/makeRandom";
import { CreateCamera2 } from "../lib/camera1";

export const addHouses = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (false) {
        await addHouse1(
            scene,
            0,
            0,
            makeWalls([5, 2, -4, -1]),
            makeRandom(0),
            {}
        );
        // await addHouse(scene, 0, 0, [1, 1, 1, -1, 1, -2], {});
        return;
    }

    // outline MUST be counter clockwise

    await addHouse(scene, -20, 16, [2, -1, 3, -5], {
        floors: 2,
        shadowGenerator,
        features: [{ type: "stairs", index: 8 }],
    });
    await addHouse(scene, -18, 19, [2, -2], {
        startFloor: 2,
        shadowGenerator,
    });

    // ===

    await addHouse(scene, 4, 36, [5, 3, 9, 11, -8, -5], {
        shadowGenerator,
    });
    await addHouse(scene, 25, 51, [3, -3], {
        startFloor: 1,
        shadowGenerator,
    });
    await addHouse(scene, 20, 36, [3, -3], {
        startFloor: 1,
        shadowGenerator,
    });

    // ===

    await addHouse(scene, 14, 20, [2, -4], {
        floors: 2,
        shadowGenerator,
    });

    // ===

    await addHouse(scene, 5, -16, [3, -4, 2, -2, 5, -1, 5, -10, -4, 3], {
        floors: 2,
        shadowGenerator,
    });
    await addHouse(scene, 9, 0, [4, -2], {
        startFloor: 2,
        floors: 5,
        shadowGenerator,
        features: [{ type: "stairs", index: 10 }],
    });
    await addHouse(scene, 17, 0, [6, -2], {
        startFloor: 2,
        floors: 8,
        shadowGenerator,
        features: [{ type: "stairs", index: 18 }],
    });
    await addHouse(scene, 29, 1, [3, -3], {
        startFloor: 2,
        floors: 12,
        shadowGenerator,
        features: [
            { type: "stairs", index: 14 },
            { type: "elevator", index: 11 },
        ],
    });

    // ===

    await addHouse(scene, -50, 75, [3, -8, 8, 5, -5, 2, 8, -10], {
        floors: 40,
        shadowGenerator,
        features: [{ type: "elevator", index: 2 }],
    });

    // ===

    /*
    await addHouse(scene, -50, -15, [3, -8, 8, 5, -7, 2, 10, -10], {
        floors: 80,
        shadowGenerator,
        features: [{ type: "elevator", index: 2 }],
    });
    */

    // ===

    await addHouse(scene, 42, 0, [4, -50], {
        floors: 2,
        shadowGenerator,
        features: [{ type: "stairs", index: 140 }],
    });
    await addHouse(scene, 44, 2, [3, -30], {
        floors: 2,
        startFloor: 2,
        shadowGenerator,
    });

    // ===

    await addHouse(scene, 10, -12, [20, -8], {
        floors: 4,
        shadowGenerator,
        features: [{ type: "stairs", index: 40, turn: 1 }],
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

    if (location.hash === "#gltf") {
        await addCity(scene, shadowGenerator);

        if (xrHelper) {
            xrHelper?.baseExperience.sessionManager.onXRFrameObservable.addOnce(
                (_frame) => {
                    const xrCamera = xrHelper.baseExperience.camera;
                    xrCamera.position.x = 50;
                    xrCamera.position.z = 50;
                }
            );
        }
        scene.onBeforeCameraRenderObservable.addOnce(() => {
            camera.node.target = new BABYLON.Vector3(
                30.71659743189594,
                -388.3254282602463,
                30.275823469906353
            );
            camera.node.alpha = 7.4226904752083;
            camera.node.beta = 1.031094337906755;
            camera.node.radius = 1206.1455359436743;
        });
    } else {
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
    }

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

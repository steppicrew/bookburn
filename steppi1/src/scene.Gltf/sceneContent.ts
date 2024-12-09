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

export const addHouses = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (false) {
        await addHouse1(
            scene,
            makeWalls([5, 2, -4, -1]),
            0,
            0,
            makeRandom(0),
            {}
        );
        // await addHouse(scene, 0, 0, [1, 1, 1, -1, 1, -2], {});
        return;
    }

    // outline MUST be counter clockwise

    await addHouse(scene, -14, -2, [2, -1, 3, 5], {
        floors: 2,
        shadowGenerator,
        features: [{ type: "stairs", index: 8 }],
    });

    await addHouse(scene, -10, -2, [2, 2], {
        startFloor: 2,
        shadowGenerator,
    });

    await addHouse(scene, 4, 10, [7, 3, 9, 5, -8, 2, -7, -6, -1, -4], {
        shadowGenerator,
    });
    await addHouse(scene, 10, 0, [4, 2], {
        floors: 5,
        shadowGenerator,
        features: [{ type: "stairs", index: 0 }],
    });
    await addHouse(scene, 18, 0, [6, 2], {
        startFloor: 1,
        floors: 8,
        shadowGenerator,
        features: [{ type: "stairs", index: 0 }],
    });
    await addHouse(scene, 27, 1, [3, 3], {
        startFloor: 1,
        floors: 12,
        shadowGenerator,
        features: [
            { type: "stairs", index: 0 },
            { type: "elevator", index: 10 },
        ],
    });
    await addHouse(scene, 4, 10, [3, 3], {
        startFloor: 1,
        shadowGenerator,
    });

    await addHouse(scene, -20, -15, [3, 4, 2, 2, 5, 1, 5, 10, -4, -3], {
        floors: 2,
        shadowGenerator,
    });

    await addHouse(scene, -50, -15, [3, 8, 8, -5, -5, -2, 8, 10], {
        floors: 40,
        shadowGenerator,
        features: [{ type: "elevator", index: 2 }],
    });

    /*
    await addHouse(scene, -50, -15, [3, 8, 8, -5, -7, -2, 10, 10], {
        floors: 80,
        shadowGenerator,
        features: [{ type: "elevator", index: 2 }],
    });
    */

    await addHouse(scene, 42, 50, [4, 50], {
        floors: 2,
        shadowGenerator,
        features: [{ type: "stairs", index: 140 }],
    });

    await addHouse(scene, 42, 50, [3, 30], {
        floors: 2,
        startFloor: 2,
        shadowGenerator,
    });

    await addHouse(scene, -42, 40, [20, 8], {
        floors: 4,
        shadowGenerator,
        features: [{ type: "stairs", index: 40, turn: -1 }],
    });
};

export const sceneContent = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    // addPerson(scene);
    // addDebugGrid(scene);

    // addElevator(scene, 0, 0, 2, 10, xrHelper);

    if (true) {
        await addCity(scene, shadowGenerator);
        xrHelper?.baseExperience.sessionManager.onXRFrameObservable.addOnce(
            (_frame) => {
                const xrCamera = xrHelper.baseExperience.camera;
                xrCamera.position.x = 50;
                xrCamera.position.z = 50;
            }
        );
    } else {
        await addHouses(scene, shadowGenerator, xrHelper);
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

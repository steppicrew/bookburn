import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import { addPerson } from "../nodeLib/personNode";
import { addHouse, flushTeleportationCells } from "../nodeLib/houseNode";
import { flushAssetThinInstances } from "./assetLoader";

export const addHouses = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (false) {
        await addHouse(scene, -6, -2, [2, 2], {
            startFloor: 0,
            shadowGenerator,
            xrHelper,
        });
        await addHouse(scene, 10, 0, [4, 2, -4, -2], {
            floors: 5,
            shadowGenerator,
            xrHelper,
            features: [{ type: "stairs", index: 0 }],
        });
        return;
    }

    await addHouse(scene, 0, 0, [-3, 1, -2, 2, 5, -3], {
        floors: 2,
        shadowGenerator,
        xrHelper,
        features: [{ type: "stairs", index: 0 }],
    });

    await addHouse(scene, -4, -2, [2, 2], {
        startFloor: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, 4, 10, [7, 3, 9, 5, -8, 2, -7, -6, -1, -4], {
        shadowGenerator,
        xrHelper,
    });
    await addHouse(scene, 10, 0, [4, 2, -4, -2], {
        floors: 5,
        shadowGenerator,
        xrHelper,
        features: [{ type: "stairs", index: 0 }],
    });
    await addHouse(scene, 18, 0, [6, 2], {
        startFloor: 1,
        floors: 8,
        shadowGenerator,
        xrHelper,
        features: [{ type: "stairs", index: 0 }],
    });
    await addHouse(scene, 27, 1, [3, 3], {
        startFloor: 1,
        floors: 12,
        shadowGenerator,
        xrHelper,
        features: [{ type: "stairs", index: 0 }],
    });
    await addHouse(scene, 4, 10, [3, 3], {
        startFloor: 1,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, -20, -15, [3, 4, 2, 2, 5, 1, 5, 10, -4, -3], {
        floors: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, -50, -15, [3, 4, -2, -2, 5, -1, 5, 10, -4, -3], {
        floors: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, 42, 50, [4, 50], {
        floors: 2,
        shadowGenerator,
        xrHelper,
        features: [{ type: "stairs", index: 140 }],
    });

    await addHouse(scene, 42, 50, [3, 30], {
        floors: 2,
        startFloor: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, -42, 40, [20, 8], {
        floors: 4,
        shadowGenerator,
        xrHelper,
        features: [{ type: "stairs", index: 40 }],
    });
};

export const sceneContent = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    // addPerson(scene);
    // addDebugGrid(scene);

    await addHouses(scene, shadowGenerator, xrHelper);

    flushAssetThinInstances();
    flushTeleportationCells(scene, xrHelper);
};

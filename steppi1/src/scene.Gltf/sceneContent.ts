import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import { addHouse, flushTeleportationCells } from "../nodeLib/houseNode";
import { flushAssetThinInstances } from "./assetLoader";

export const addHouses = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (false) {
        await addHouse(scene, -10, -2, [2, -1, 3, 3], {
            floors: 2,
            shadowGenerator,
            features: [
                { type: "stairs", index: 0 },
                /*
                { type: "stairs", index: 3 },
                { type: "stairs", index: 4 },
                { type: "stairs", index: 5 },
                { type: "stairs", index: 6 },
                { type: "stairs", index: 7 },
                 */
                { type: "stairs", index: 8, turn: 1 },
                { type: "stairs", index: 9 },
            ],
        });
        return;
        await addHouse(scene, -6, -2, [2, 2], {
            startFloor: 0,
            shadowGenerator,
        });
        await addHouse(scene, 10, 0, [4, 2], {
            floors: 5,
            shadowGenerator,
            features: [{ type: "stairs", index: 0 }],
        });
        return;
    }

    // outline MUST be counter clockwise

    await addHouse(scene, -10, -2, [2, -1, 3, 3], {
        floors: 2,
        shadowGenerator,
        features: [{ type: "stairs", index: 8 }],
    });

    await addHouse(scene, -4, -2, [2, 2], {
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
        features: [{ type: "stairs", index: 0 }],
    });
    await addHouse(scene, 4, 10, [3, 3], {
        startFloor: 1,
        shadowGenerator,
    });

    await addHouse(scene, -20, -15, [3, 4, 2, 2, 5, 1, 5, 10, -4, -3], {
        floors: 2,
        shadowGenerator,
    });

    await addHouse(scene, -50, -15, [3, 4, -2, -2, 5, -1, 5, 10, -4, -3], {
        floors: 2,
        shadowGenerator,
    });

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

    await addHouses(scene, shadowGenerator, xrHelper);

    flushAssetThinInstances();
    flushTeleportationCells(scene, xrHelper);
};

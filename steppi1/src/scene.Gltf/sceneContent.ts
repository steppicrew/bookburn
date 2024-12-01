import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import { addPerson } from "../nodeLib/personNode";
import { addHouse } from "../nodeLib/houseNode";

export const sceneContent = async (
    scene: BABYLON.Scene,
    shadowGenerator: BABYLON.ShadowGenerator,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    addPerson(scene);
    // addDebugGrid(scene);

    await addHouse(scene, [-3, 1, -2, 2, 5, -3], 0, 0, {
        floors: 2,
        shadowGenerator,
        xrHelper,
    });
    await addHouse(scene, [2, 2], -4, -2, {
        startFloor: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, [7, 3, 9, 5, -8, 2, -7, -6, -1, -4], 4, 10, {
        shadowGenerator,
        xrHelper,
    });
    await addHouse(scene, [4, 2, -4, -2], 10, 0, {
        floors: 5,
        shadowGenerator,
        xrHelper,
    });
    await addHouse(scene, [3, 3], 4, 10, {
        startFloor: 1,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, [3, 4, -2, -2, 5, -1, 5, 10, -4, -3], -20, -15, {
        floors: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, [3, 4, -2, -2, 5, -1, 5, 10, -4, -3], -50, -15, {
        floors: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, [4, 50], 42, 50, {
        floors: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, [3, 30], 42, 50, {
        floors: 2,
        startFloor: 2,
        shadowGenerator,
        xrHelper,
    });

    await addHouse(scene, [20, 8], -42, 40, {
        floors: 4,
        shadowGenerator,
        xrHelper,
    });

    // const outline2 = [6, 6, -6, -6];
    // const outline2 = [2, 2, -2, -2];
    // const outline2 = [4, 2, -4, -2];
};

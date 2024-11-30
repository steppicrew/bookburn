import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import { addPerson } from "../nodeLib/personNode";
import { addDebugGrid } from "../nodeLib/debugGridNode";
import { addHouse } from "../nodeLib/houseNode";

export const sceneContent = async (scene: BABYLON.Scene) => {
    addPerson(scene);

    const WIDTH = 2;
    const HEIGHT = 2.5790634155273438;
    // const DEPTH = 0.17819999903440475;
    const DEPTH = 0.1;

    addDebugGrid(scene);

    const house1 = await addHouse(scene, [-3, 1, -2, 2, 5, -3]);
    const house2 = await addHouse(scene, [4, 2, -4, -2]);

    house2.position.x = 10;

    // const outline2 = [6, 6, -6, -6];
    // const outline2 = [2, 2, -2, -2];
    // const outline2 = [4, 2, -4, -2];
};
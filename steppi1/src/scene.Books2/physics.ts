import HavokPhysics from "@babylonjs/havok";
import * as BABYLON from "babylonjs";

const initializeHavokPhysics = async (scene: BABYLON.Scene) => {
    const havokInstance = await HavokPhysics();
    const gravityVector = new BABYLON.Vector3(0, 9.81, 0);
    const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
    scene.enablePhysics(gravityVector, havokPlugin);
};

export const initializePhysics = initializeHavokPhysics;

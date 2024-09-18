import * as BABYLON from "babylonjs";
import { SceneEx } from "./sceneEx";

type State = {
    engine: BABYLON.Engine;
    canvas: HTMLCanvasElement;
    sceneEx: SceneEx;
};

export const state: State = {} as State;

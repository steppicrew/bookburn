import * as BABYLON from "babylonjs";

export interface XrPhysicsBody {
    name: string;
    stopPhysics: () => void;
    startPhysics: (velocity?: BABYLON.Vector3) => void;
    getAbsolutePosition: () => BABYLON.Vector3;
    moveWithCollisions: (moveBy: BABYLON.Vector3) => void;
}

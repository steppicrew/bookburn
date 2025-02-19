import * as BABYLON from "babylonjs";
import { UpdateWrapper } from "../lib/updateWrapper";
import { XrPhysicsBody } from "../lib/xrTypes";

export type BookState = "idle" | "open" | "flipping";

export interface Book extends XrPhysicsBody {
    getState: () => BookState;
    setState: (state: BookState) => void;
    setAbsolutePosition: (position: BABYLON.Vector3) => void;
    updates: UpdateWrapper;
}

export const RESTITUTION = 0;
export const MASS = 1;
export const MASS_BACK = MASS;
export const MASS_FRONT = MASS;

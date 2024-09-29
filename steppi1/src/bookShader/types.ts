import * as BABYLON from "babylonjs";

export type XYZ = [x: number, y: number, z: number];
export type XZ = [x: number, z: number];

export type FrontBack = "front" | "back";
export type Direction = "left" | "right";

export type PageType = {
    flipPage: (parameters: {
        direction: Direction;
        startTime?: number;
        msPerFlip: number;
        onFinish?: () => void;
    }) => void;
    update: () => void;
};

import * as BABYLON from "babylonjs";
import { UpdateWrapper } from "../lib/sceneUtils";

// Helper type that increments numbers from 0 to N
type BuildRange<
    N extends number,
    Result extends Array<unknown> = []
> = Result["length"] extends N
    ? Result[number]
    : BuildRange<N, [...Result, Result["length"]]>;

// Type to generate numbers from 0 to N (inclusive)
type Range<N extends number> = BuildRange<N>;

const MaxInt = 100;
export type RangeInt = Range<typeof MaxInt>;

type Vec3<T> = [x: T, y: T, z: T];
type Vec2<T> = [u: T, v: T];

export type XYZ = Vec3<number>;
export type XZ = Vec2<number>;
export type XYZInt = Vec3<RangeInt>;
export type XZInt = Vec2<RangeInt>;

export type BookFlipDirection = "left" | "right";

export interface BookType {
    flipBook: (parameters: {
        direction: BookFlipDirection;
        msPerFlip: number;
        flipPages?: number;
        startTime?: number;
        flipAngle?: number;
    }) => Promise<void>;
    updates: UpdateWrapper;
    addPhysics: () => BABYLON.PhysicsAggregate;
    dispose: () => void;
}

export const MaxBookPageNum = 64;

export type BookPageNum = Range<typeof MaxBookPageNum>;

export enum BookBodySide {
    Top = 1,
    Bottom = 2,
    North = 3,
    East = 4,
    South = 5,
    Binder = 6,
}

export enum BookBody {
    FrontCover = 1,
    FrontBlock = 2,
    Page = 3,
    BackBlock = 4,
    BackCover = 5,
    Binder = 6,
}

// Definition of areas in book texture
export type TextureMap = [
    [minX: number, minY: number],
    [maxX: number, maxY: number]
];

export const textureMapPageIndexOffset = 16;

import { UpdateWrapper } from "../sceneUtils";

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
    }) => Promise<void>;
    updates: UpdateWrapper;
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

// Indexes of pre defined areas
export const textureMapIndex = {
    [BookBody.FrontCover + BookBodySide.Top]: 0,
    [BookBody.FrontCover + BookBodySide.Bottom]: 1,
    [BookBody.FrontCover + BookBodySide.North]: 2,
    [BookBody.FrontCover + BookBodySide.East]: 3,
    [BookBody.FrontCover + BookBodySide.South]: 4,

    [BookBody.FrontBlock + BookBodySide.North]: 5,
    [BookBody.FrontBlock + BookBodySide.East]: 6,
    [BookBody.FrontBlock + BookBodySide.South]: 7,

    [BookBody.BackCover + BookBodySide.Top]: 8,
    [BookBody.BackCover + BookBodySide.Bottom]: 9,
    [BookBody.BackCover + BookBodySide.North]: 10,
    [BookBody.BackCover + BookBodySide.East]: 11,
    [BookBody.BackCover + BookBodySide.South]: 12,

    [BookBodySide.Binder]: 13,
} as const;

export const textureMapPageIndexOffset = 14;

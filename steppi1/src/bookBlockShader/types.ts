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
    Pages = 4,
    South = 5,
    Binder = 6,
}

export enum BookBody {
    FrontBlock = 1 << 3,
    Page = 2 << 3,
    BackBlock = 3 << 3,
}

export const MaxBodyAttribute = 1 << 6; // 64

// Definition of areas in book texture
export type TextureMap = [
    [minX: number, minY: number],
    [maxX: number, maxY: number]
];

// Indexes of pre defined areas
export const textureMapIndex = {
    [BookBody.FrontBlock + BookBodySide.Top]: 0,
    [BookBody.FrontBlock + BookBodySide.Bottom]: 1,
    [BookBody.FrontBlock + BookBodySide.North]: 2,
    [BookBody.FrontBlock + BookBodySide.South]: 3,
    [BookBody.FrontBlock + BookBodySide.Binder]: 4,
    [BookBody.FrontBlock + BookBodySide.Pages]: 5,

    [BookBody.BackBlock + BookBodySide.Top]: 6,
    [BookBody.BackBlock + BookBodySide.Bottom]: 7,
    [BookBody.BackBlock + BookBodySide.North]: 8,
    [BookBody.BackBlock + BookBodySide.South]: 9,
    [BookBody.BackBlock + BookBodySide.Binder]: 10,
    [BookBody.BackBlock + BookBodySide.Pages]: 11,
} as const;

export const textureMapPageIndexOffset = 12;

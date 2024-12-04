import * as BABYLON from "babylonjs";

import { TextureManager } from "../lib/TextureManager";

import { createBookParts } from "./bookParts";
import { TextureMap } from "./types";

const defaultTexture = "assets/BookTexture-xcf.png";
const defaultMsPerFlip = 500;

const getTextureMap = (): [TextureMap[], number[]] => {
    const textureUVCoverFront: TextureMap = [
        [0, 2 / 3],
        [1 / 3, 1],
    ];
    const textureUVCoverBack: TextureMap = [
        [1 / 3, 2 / 3],
        [2 / 3, 1],
    ];
    const textureUVCoverEdge: TextureMap = [
        [0, 98 / 100],
        [1 / 100, 99 / 100],
    ];
    const textureUVEmpty: TextureMap = [
        [2 / 3, 2 / 3],
        [5 / 6, 1],
    ];
    const textureUVPage1: TextureMap = [
        [0, 1 / 3],
        [1 / 3, 2 / 3],
    ];
    const textureUVPage2: TextureMap = [
        [1 / 3, 1 / 3],
        [2 / 3, 2 / 3],
    ];
    const textureUVPage3: TextureMap = [
        [2 / 3, 1 / 3],
        [1, 2 / 3],
    ];
    const textureUVPage4: TextureMap = [
        [0, 0],
        [1 / 3, 1 / 3],
    ];
    const textureUVPage5: TextureMap = [
        [1 / 3, 0],
        [2 / 3, 1 / 3],
    ];

    const textureUVCut: TextureMap = [
        [2854 / 3336, 4135 / 4500],
        [1, 1],
    ];

    return [
        [
            textureUVCoverFront,
            textureUVEmpty,
            textureUVCoverEdge,
            textureUVCut,
            textureUVCoverBack,
            textureUVPage1,
            textureUVPage2,
            textureUVPage3,
            textureUVPage4,
            textureUVPage5,
        ],
        [
            // Front cover
            0, // Top
            1, // Bottom
            2, // North
            2, // East
            2, // South

            // Pages block
            3, // North
            3, // East
            3, // South

            // BackCover
            1, // Top
            4, // Bottom
            2, // North
            2, // East
            2, // South

            // Binder
            1, // Binder inner (top)
            0, // Binder outer (bottom)
            2, // North
            2, // South

            // Pages
            5,
            6,
            7,
            8,
            9,
        ],
    ] as const;
};

export const setupBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    options?: {
        pageCount?: number;
        pageDepth?: number;
        coverDepth?: number;
        maxFlipPageCount?: number;
        texture: string;
    }
) => {
    const pageCount = options?.pageCount || 200;
    const pageDepth = options?.pageDepth || 0.01;
    const coverDepth = options?.coverDepth || 0.1;
    const maxFlipPageCount = options?.maxFlipPageCount || 50;
    const texture = options?.texture || defaultTexture;

    const [textureMap, textureIndexes] = getTextureMap();

    const bookParts = createBookParts({
        scene,
        width: 2.1,
        height: 2.7,
        coverDepth,
        pageDepth,
        maxFlipPageCount: Math.min(maxFlipPageCount, pageCount) as never,
        flipPageCount: 10,
        pageCount: pageCount,
        texture: TextureManager.get(texture, scene),
        textureMap: textureMap,
        textureIndexes: textureIndexes,
        floppyness: 1,
        vertices: [20, 20, 1],
    });

    return bookParts;
};

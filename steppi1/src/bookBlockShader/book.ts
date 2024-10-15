import { updateWrapper } from "../sceneUtils";
import { createBookParts } from "./page";
import * as BABYLON from "babylonjs";
import { TextureMap } from "./types";

const defaultTexture = "assets/BookTexture.jpg";
const defaultMsPerFlip = 500;

const getTextureMap = (): TextureMap[] => {
    const textureUVCoverFront: TextureMap = [
        [0, 2 / 3],
        [1 / 3, 1],
    ];
    const textureUVCoverBack: TextureMap = [
        [1 / 3, 2 / 3],
        [2 / 3, 1],
    ];
    const textureUVEmpty: TextureMap = [
        [2 / 3, 2 / 3],
        [1, 1],
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

    return [
        textureUVCoverFront,
        textureUVEmpty,
        textureUVEmpty,
        textureUVEmpty,
        textureUVEmpty,
        textureUVEmpty,

        textureUVEmpty,
        textureUVCoverBack,
        textureUVEmpty,
        textureUVEmpty,
        textureUVEmpty,
        textureUVEmpty,

        textureUVPage1,
        textureUVPage2,
        textureUVPage3,
        textureUVPage4,
        textureUVPage5,
    ];
};

export const setupBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    options?: {
        pageCount?: number;
        pageDepth?: number;
        coverDepth?: number;
        texture: string;
    }
) => {
    const pageCount = options?.pageCount || 200;
    const pageDepth = options?.pageDepth || 0.001;
    const coverDepth = options?.coverDepth || 0.01;
    const texture = options?.texture || defaultTexture;

    const updates = updateWrapper();
    const bookNode = new BABYLON.TransformNode("book", scene);

    bookNode.onDispose = () => {
        updates.dispose();
    };

    const textureMap = getTextureMap();

    const bookParts = createBookParts({
        scene,
        width: 2.1,
        height: 2.7,
        coverDepth,
        pageDepth,
        maxFlipPageCount: Math.min(50, pageCount) as never,
        pageCount: pageCount,
        parentNode: bookNode,
        texture: new BABYLON.Texture(texture, scene),
        textureMapper: textureMap,
        floppyness: 1,
        vertices: [10, 1, 3],
    });

    updates.addUpdates(bookParts.updates);

    return {
        updates: updates,
        node: bookNode,
        flipBook: bookParts.flipBook,
    };
};

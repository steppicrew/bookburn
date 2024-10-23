import * as BABYLON from "babylonjs";
import { setupBook } from "./bookBlockShader/book";

export const createAutoflipBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    startTime?: number
) => {
    const book = setupBook(scene, xrHelper, {
        pageCount: 5,
        pageDepth: 0.02,
        coverDepth: 0.02,
        maxFlipPageCount: 10,
        texture: "assets/BookTexture.jpg",
    });

    if (false) {
        const flipLeft = (startTime?: number) =>
            book
                .flipBook({
                    direction: "left",
                    msPerFlip: 3000,
                    flipPages: 5,
                    startTime,
                })
                .then(() => setTimeout(flipRight, 1000));
        const flipRight = () =>
            book
                .flipBook({
                    direction: "right",
                    msPerFlip: 2000,
                    flipPages: 10,
                })
                .then(() => setTimeout(flipLeft, 1000));
        setTimeout(() => flipLeft(startTime), 1000);
    }

    return book;
};

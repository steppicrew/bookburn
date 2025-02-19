import * as BABYLON from "babylonjs";
import { makeBook } from "../book/makeBook";

export const addAutoflipBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    {
        startTime,
        flipDelay,
    }: { startTime?: number; withPhysics?: boolean; flipDelay?: number } = {}
) => {
    const book = makeBook({
        scene,
        xrHelper,
        width: 21,
        height: 27,
        pageCount: 20,
        pageDepth: 0.002,
        coverDepth: 0.01,
        maxFlipPageCount: 10,
        texture: "assets/scene.Books/BookTexture-xcf.png",
    });

    /*
    if (true) {
        const flipLeft = (startTime?: number) =>
            book
                .flipBook({
                    direction: "left",
                    msPerFlip: 3000,
                    flipPages: 5,
                    startTime,
                })
                .finally(() => setTimeout(flipRight, flipDelay || 0));
        const flipRight = () =>
            book
                .flipBook({
                    direction: "right",
                    msPerFlip: 2000,
                    flipPages: 10,
                })
                .finally(() => setTimeout(flipLeft, flipDelay || 0));
        setTimeout(() => flipLeft(startTime), flipDelay || 0);
    }
    */

    return book;
};

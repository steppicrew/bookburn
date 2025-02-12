import * as BABYLON from "babylonjs";
import { setupBook } from "../bookBlockShader/book";

export const addAutoflipBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    {
        startTime,
        flipAngle,
    }: { startTime?: number; flipAngle?: number; withPhysics?: boolean }
) => {
    const book = setupBook(scene, xrHelper, {
        pageCount: 200,
        pageDepth: 0.002,
        coverDepth: 0.02,
        maxFlipPageCount: 10,
        texture: "assets/scene.Books/BookTexture-xcf.png",
    });

    if (true) {
        const flipLeft = (startTime?: number) =>
            book
                .flipBook({
                    direction: "left",
                    msPerFlip: 3000,
                    flipPages: 5,
                    startTime,
                    flipAngle,
                })
                .catch((error) => console.log(error))
                .then(() => setTimeout(flipRight, 1000));
        const flipRight = () =>
            book
                .flipBook({
                    direction: "right",
                    msPerFlip: 2000,
                    flipPages: 10,
                    flipAngle,
                })
                .catch((error) => false && console.log(error))
                .then(() => setTimeout(flipLeft, 1000));
        setTimeout(() => flipLeft(startTime), 1000);
    }

    return book;
};

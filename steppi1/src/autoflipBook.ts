import * as BABYLON from "babylonjs";
import { setupBook } from "./bookShader/book";

export const createAutoflipBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const book = setupBook(scene, xrHelper, {
        pageCount: 20,
        textures: Array.from({ length: 5 }).map(
            (_, i) => `assets/Page${i + 1}.jpg`
        ),
        frontCover: ["assets/CoverFront.jpg", "assets/Empty.jpg"],
        backCover: ["assets/Empty.jpg", "assets/CoverBack.jpg"],
    });

    if (true) {
        const flipLeft = () =>
            book
                .flipBook({ direction: "left", deltaTime: 100 })
                .then(() => setTimeout(flipRight, 1000));
        const flipRight = () =>
            book
                .flipBook({ direction: "right", deltaTime: 10 })
                .then(() => setTimeout(flipLeft, 1000));
        setTimeout(flipLeft, 1000);
    }

    if (true) {
    }
    return book;
};
import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { createBook } from "./book";
import { CreateCamera2, createCamera2 } from "./camera1";
import { createPage } from "./book/page";
import { CreateSceneFn } from "./sceneEx";
import { PageType } from "./book/types";

const setupBook = async (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const pageCount = 200;
    const pageDistance = 0.001;

    const bookWidth = pageCount * pageDistance;

    const pages: PageType[] = [];

    for (let i = 0; i < pageCount; i++) {
        const offset = new BABYLON.Vector3(
            bookWidth / 2,
            0,
            i * pageDistance - bookWidth / 2
        );
        const page = createPage({
            scene,
            width: 2.1,
            height: 2.7,
            frontTexture: "assets/front.jpg",
            backTexture: "assets/back.jpg",
            floppyness: 1,
            offset,
        });

        page.node.position = offset;
        pages.push(page);
    }

    const flipBookLeft = () => {
        pages.forEach((page, i) => {
            const flip = () => {
                const promise = page.flipPage("left");
                if (i == pages.length - 1) {
                    promise.then(() => setTimeout(flipBookRight, 1000));
                }
            };
            i ? setTimeout(flip, 2 * i) : flip();
        });
    };
    const flipBookRight = () => {
        for (let i = 0; i < pages.length; i++) {
            const page = pages[pages.length - 1 - i];
            const flip = () => {
                const promise = page.flipPage("right");
                if (i == pages.length - 1) {
                    promise.then(() => setTimeout(flipBookLeft, 1000));
                }
            };
            i ? setTimeout(flip, 2 * i) : flip();
        }
    };
    setTimeout(flipBookLeft, 1000);

    xrHelper.input.onControllerAddedObservable.add((controller) => {
        controller.onMotionControllerInitObservable.add((motionController) => {
            const triggerComponent = motionController.getComponent(
                "xr-standard-trigger"
            );
        });
    });
};

export const createScene1: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    // *** Light ***

    const light = new BABYLON.DirectionalLight(
        "light",
        new BABYLON.Vector3(0, 0, 1),
        scene
    );

    // *** Book ***

    await setupBook(scene, xrHelper);

    const update = () => {};

    return update;
};

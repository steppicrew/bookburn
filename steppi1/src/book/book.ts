import { updateWrapper } from "../sceneUtils";
import { createPage } from "./page";
import { PageType } from "./types";
import * as BABYLON from "babylonjs";

const defaultTextures = ["assets/front.jpg", "assets/back.jpg"];

export const setupBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    options?: { pageCount?: number; pageDistance?: number; textures?: string[] }
) => {
    const pageCount = options?.pageCount || 200;
    const pageDistance = options?.pageDistance || 0.001;
    const textures = options?.textures || defaultTextures;

    const bookWidth = pageCount * pageDistance;

    const pages: PageType[] = [];
    const updates = updateWrapper();
    const bookNode = new BABYLON.TransformNode("book", scene);

    for (let i = 0; i < pageCount; i++) {
        const offset = new BABYLON.Vector3(
            bookWidth / 2,
            0,
            i * pageDistance - bookWidth / 2
        );
        const page =
            i == 0 || i == pageCount - 1
                ? createPage({
                      scene,
                      width: 2.1,
                      height: 2.7,
                      frontTexture: textures[(2 * i) % textures.length],
                      backTexture: textures[(2 * i + 1) % textures.length],
                      floppyness: 0,
                      offset,
                      vertices: [100, 1],
                  })
                : createPage({
                      scene,
                      width: 2.1,
                      height: 2.7,
                      frontTexture: textures[(2 * i) % textures.length],
                      backTexture: textures[(2 * i + 1) % textures.length],
                      floppyness: 1,
                      offset,
                      vertices: [100, 1],
                  });

        pages.push(page);
        page.node.parent = bookNode;
    }

    const flipBookLeft = () => {
        const startTime = Date.now();
        pages.forEach((page, i) => {
            const timeOffset =
                (i > 0 ? 100 : 0) + (i == pages.length - 1 ? 100 : 0);
            const update = page.flipPage(
                "left",
                startTime + 10 * i + timeOffset
            );
            updates.add(update);
            if (i == pages.length - 1) {
                updates.onRemove(update, () => setTimeout(flipBookRight, 1000));
            }
        });
    };
    const flipBookRight = () => {
        const startTime = Date.now();
        for (let i = 0; i < pages.length; i++) {
            const page = pages[pages.length - 1 - i];
            const timeOffset =
                (i > 0 ? 100 : 0) + (i == pages.length - 1 ? 100 : 0);
            const update = page.flipPage("right", startTime + i + timeOffset);
            updates.add(update);
            if (i == pages.length - 1) {
                updates.onRemove(update, () => setTimeout(flipBookLeft, 1000));
            }
        }
    };
    setTimeout(flipBookLeft, 1000);

    /*
    xrHelper.input.onControllerAddedObservable.add((controller) => {
        controller.onMotionControllerInitObservable.add((motionController) => {
            const triggerComponent = motionController.getComponent(
                "xr-standard-trigger"
            );
        });
    });
    */

    return {
        update: updates.update,
        node: bookNode,
    };
};

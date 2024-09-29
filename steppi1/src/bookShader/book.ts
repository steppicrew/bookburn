import { Direction } from "../book/types";
import { updateWrapper } from "../sceneUtils";
import { setLights } from "../shaderTools";
import { createPage } from "./page";
import { PageType } from "./types";
import * as BABYLON from "babylonjs";

const defaultTextures = ["assets/front.jpg", "assets/back.jpg"];
const defaultMsPerFlip = 500;

export const setupBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    options?: {
        pageCount?: number;
        pageDistance?: number;
        textures?: string[];
        frontCover?: [string, string];
        backCover?: [string, string];
    }
) => {
    const pageCount = options?.pageCount || 200;
    const pageDistance = options?.pageDistance || 0.001;
    const textures = options?.textures || defaultTextures;
    const frontCover = options?.frontCover;
    const backCover = options?.backCover;

    const bookDepth = pageCount * pageDistance;

    const pages: PageType[] = [];
    const updates = updateWrapper();
    const bookNode = new BABYLON.TransformNode("book", scene);

    const { update: lightsUpdate, uniformBuffer } = setLights(scene);

    updates.add(lightsUpdate);

    const getTexture = (() => {
        const _maxPageSide = backCover ? 2 * pageCount - 2 : 2 * pageCount;
        const _offset = frontCover ? 2 : 0;
        return (pageSide: number) => {
            if (frontCover && pageSide < 2) {
                return frontCover[pageSide];
            }
            if (backCover && pageSide >= _maxPageSide) {
                return backCover[pageSide - _maxPageSide];
            }
            return textures[(pageSide - _offset) % textures.length];
        };
    })();

    if (true) {
        for (let i = 0; i < pageCount; i++) {
            const offset = new BABYLON.Vector3(
                bookDepth / 2,
                bookDepth / 2 - i * pageDistance,
                0
            );
            const page = createPage({
                scene,
                width: 2.1,
                height: 2.7,
                frontTexture: getTexture(2 * i),
                backTexture: getTexture(2 * i + 1),
                floppyness: i == 0 || i == pageCount - 1 ? 0 : 1,
                offset,
                uniformBuffer,
                parentNode: bookNode,
            });

            pages.push(page);
            updates.add(page.update);
        }
    } else {
        const i: number = pageCount - 1;
        const offset = new BABYLON.Vector3(
            bookDepth / 2,
            bookDepth / 2 - i * pageDistance,
            0
        );
        const page = createPage({
            scene,
            width: 2.1,
            height: 2.7,
            frontTexture: getTexture(2 * i),
            backTexture: getTexture(2 * i + 1),
            floppyness: i == 0 || i == pageCount - 1 ? 0 : 1,
            offset,
            uniformBuffer,
            parentNode: bookNode,
        });

        pages.push(page);
        updates.add(page.update);
    }

    const flipBookLeft = (
        startTime: number,
        deltaTime: number,
        msPerFlip: number
    ) =>
        new Promise((resolve) => {
            const coverMsPerFlip = Math.max(msPerFlip / 5, deltaTime);
            pages.forEach((page, i) => {
                const timeOffset = i > 0 ? coverMsPerFlip : 0;
                page.flipPage({
                    direction: "left",
                    startTime: startTime + deltaTime * i + timeOffset,
                    msPerFlip,
                    onFinish:
                        i == pages.length - 1
                            ? () => resolve(undefined)
                            : undefined,
                });
            });
        });

    const flipBookRight = (
        startTime: number,
        deltaTime: number,
        msPerFlip: number
    ) =>
        new Promise((resolve) => {
            const coverMsPerFlip = Math.max(msPerFlip / 3, deltaTime);
            for (let i = 0; i < pages.length; i++) {
                const page = pages[pages.length - i - 1];
                const timeOffset = i > 0 ? coverMsPerFlip : 0;
                page.flipPage({
                    direction: "right",
                    startTime: startTime + deltaTime * i + timeOffset,
                    msPerFlip,
                    onFinish:
                        i == pages.length - 1
                            ? () => resolve(undefined)
                            : undefined,
                });
            }
        });

    const flipBook = ({
        direction,
        startTime,
        deltaTime,
        msPerFlip,
    }: {
        direction: Direction;
        startTime?: number;
        deltaTime?: number;
        msPerFlip?: number;
    }) => {
        return direction == "left"
            ? flipBookLeft(
                  startTime || Date.now(),
                  deltaTime || 10,
                  msPerFlip || defaultMsPerFlip
              )
            : flipBookRight(
                  startTime || Date.now(),
                  deltaTime || 10,
                  msPerFlip || defaultMsPerFlip
              );
    };

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
        flipBook,
    };
};

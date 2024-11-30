import * as BABYLON from "babylonjs";

import { updateWrapper } from "../lib/sceneUtils";
import { createBookMesh } from "./bookMesh";
import { getPhysicsMesh } from "./bookPhysicsMesh";
import { globals } from "./globals";
import {
    BookFlipDirection,
    BookPageNum,
    BookType,
    TextureMap,
    XYZInt,
} from "./types";

const defaultXVertices = 10;
const defaultYVertices = 5;
const defaultZVertices = 1;

export const createBookParts = (parameters: {
    scene: BABYLON.Scene;
    width: number;
    height: number;
    coverDepth?: number;
    pageDepth?: number;
    coverOverlap?: [number, number];
    pageCount: number;
    maxFlipPageCount: BookPageNum;
    flipPageCount?: BookPageNum;
    texture: BABYLON.Texture;
    textureMap: TextureMap[];
    textureIndexes: number[];
    floppyness?: number;
    vertices?: XYZInt;
}): BookType => {
    let { vertices, coverOverlap, pageDepth, coverDepth } = parameters;
    const { scene, width, height, pageCount, maxFlipPageCount, flipPageCount } =
        parameters;
    if (!vertices) {
        vertices = [defaultXVertices, defaultYVertices, defaultZVertices];
    }
    if (!coverOverlap) {
        coverOverlap = [width * 0.01, height * 0.01];
    }
    if (!pageDepth) {
        pageDepth = 0.001;
    }
    if (!coverDepth) {
        coverDepth = 0.01;
    }

    const updates = updateWrapper();

    const { mesh, material } = createBookMesh({
        ...parameters,
        vertices,
        coverOverlap,
        coverDepth,
        pageDepth,
        updates,
    });

    const bookNode = new BABYLON.TransformNode("book", scene);
    bookNode.onDispose = () => {
        dispose();
    };

    // Set BB to position on right side at time == 0, on left at time == 1, and on both sides at time in between
    const setBoundingBox = (time: number) => {
        const minX = time > 0 ? -width : 0;
        const maxX = time < 1 ? width : 0;
        mesh.computeWorldMatrix(true);
        mesh.setBoundingInfo(
            new BABYLON.BoundingInfo(
                new BABYLON.Vector3(minX, 0, 0),
                new BABYLON.Vector3(
                    maxX,
                    2 * coverDepth + pageCount * pageDepth,
                    height
                )
            )
        );
    };

    setBoundingBox(0);
    // mesh.showBoundingBox = true;

    const {
        mesh: hullMesh,
        getUpdate: hullGetUpdate,
        addPhysics,
    } = getPhysicsMesh(
        scene,
        width,
        height,
        2 * coverDepth + pageCount * pageDepth
    );

    mesh.parent = bookNode;
    hullMesh.parent = bookNode;

    const beforeRenderObservable = scene.onBeforeRenderObservable.add(() => {
        mesh.position.copyFrom(hullMesh.position);
        if (hullMesh.rotationQuaternion) {
            if (mesh.rotationQuaternion) {
                mesh.rotationQuaternion.copyFrom(hullMesh.rotationQuaternion);
            } else {
                mesh.rotationQuaternion = hullMesh.rotationQuaternion.clone();
            }
        } else {
            mesh.rotationQuaternion = null; // Reset if rotation is not quaternion
            mesh.rotation.copyFrom(hullMesh.rotation);
        }
    });

    const keybordObserver = scene.onKeyboardObservable.add((kbInfo) => {
        const body = hullMesh.physicsBody;
        if (!body) {
            return;
        }
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                switch (kbInfo.event.key.toLowerCase()) {
                    case "u":
                        body.applyImpulse(
                            new BABYLON.Vector3(0, 0.2, 0),
                            new BABYLON.Vector3(0.5, 0.5, 0)
                        );
                }
        }
    });

    const flipBook = ({
        direction,
        msPerFlip,
        flipPages,
        startTime,
        flipAngle,
    }: {
        direction: BookFlipDirection;
        msPerFlip: number;
        flipPages?: number;
        startTime?: number;
        flipAngle?: number;
    }): Promise<void> =>
        new Promise((resolve) => {
            const _startTime = startTime || Date.now();
            if (!flipPages || flipPages > maxFlipPageCount) {
                flipPages = maxFlipPageCount;
            }
            const timeOffset = direction === "left" ? 0 : 1;

            material.setFloat("time", timeOffset);
            material.setInt("flipPages", flipPages);
            material.setFloat("flipAngle", flipAngle || 0);

            let started = false;

            const hullUpdate = hullGetUpdate(flipAngle || 0);

            const update = () => {
                const now = Date.now();
                if (now < _startTime) {
                    return;
                }
                if (!started) {
                    started = true;
                    setBoundingBox(0.5);
                }
                const time = Math.min((now - _startTime) / msPerFlip, 1);

                let time1 = time + timeOffset;

                if (globals.useDebugTime) {
                    time1 = globals.debugTime;
                    material.setFloat("time", time1);
                    hullUpdate(time1);
                    return;
                }

                material.setFloat("time", time1);
                hullUpdate(time1);
                if (time === 1) {
                    updates.remove(update);
                    setBoundingBox(1 - timeOffset);
                    resolve();
                }
            };

            updates.add(update);
        });

    const dispose = () => {
        updates.dispose();
        scene.onKeyboardObservable.remove(keybordObserver);
        scene.onBeforeRenderObservable.remove(beforeRenderObservable);
    };

    return {
        flipBook,
        updates,
        addPhysics,
        dispose,
        node: bookNode,
    };
};

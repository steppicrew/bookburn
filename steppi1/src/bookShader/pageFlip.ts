import * as BABYLON from "babylonjs";
import { Direction, XYZ, XZ } from "./types";
import { UpdateFn, UpdateWrapper } from "../sceneUtils";
import { setLights } from "../shaderTools";

const defaultMsPerFlip = 1_000;

const PI = Math.PI;
const yAxis = new BABYLON.Vector3(0, 1, 0);

export const createFlipPage = ({
    materials,
    floppyness,
    msPerFlip,
    flipAxis,
    updateWrapper,
}: {
    materials: BABYLON.ShaderMaterial[];
    floppyness?: number;
    msPerFlip?: number;
    flipAxis?: BABYLON.Vector3;
    updateWrapper: UpdateWrapper;
}) => {
    if (!floppyness) {
        floppyness = 0;
    }
    if (!msPerFlip) {
        msPerFlip = defaultMsPerFlip;
    }
    if (!flipAxis) {
        flipAxis = yAxis;
    }

    return ({
        direction,
        startTime,
        onFinish,
    }: {
        direction: Direction;
        startTime?: number;
        onFinish?: () => void;
    }) => {
        if (startTime == undefined) {
            startTime = Date.now();
        }

        const dirOffset = direction == "left" ? 0 : 1;

        const update = (remove: () => void) => {
            const deltaTime = Math.min(Date.now() - startTime, msPerFlip);
            if (deltaTime < 0) {
                return;
            }

            materials.forEach((material) => {
                material.setFloat("time", deltaTime / msPerFlip + dirOffset);
            });

            if (deltaTime == msPerFlip) {
                remove();
            }
        };
        updateWrapper.add(update);
        if (onFinish) {
            updateWrapper.onRemove(update, onFinish);
        }
    };
};

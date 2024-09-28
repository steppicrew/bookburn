import * as BABYLON from "babylonjs";
import { Direction, XYZ, XZ } from "./types";
import { UpdateFn } from "../sceneUtils";
import { setLights } from "../shaderTools";

const defaultMsPerFlip = 1_000;

const PI = Math.PI;
const yAxis = new BABYLON.Vector3(0, 1, 0);

export const createFlipPage = ({
    node,
    materials,
    floppyness,
    msPerFlip,
    flipAxis,
}: {
    node: BABYLON.TransformNode;
    materials: BABYLON.ShaderMaterial[];
    floppyness?: number;
    msPerFlip?: number;
    flipAxis?: BABYLON.Vector3;
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

    return (direction: Direction = "left", startTime?: number): UpdateFn => {
        const scene = node.getScene();
        if (startTime == undefined) {
            startTime = Date.now();
        }

        const dir = direction == "left" ? 1 : -1;

        return (remove: () => void) => {
            const deltaTime = Math.min(Date.now() - startTime, msPerFlip);
            if (deltaTime < 0) {
                return;
            }

            const alpha = (deltaTime / msPerFlip) * PI;
            node.rotation = new BABYLON.Vector3(
                0,
                0,
                direction == "left" ? alpha : PI - alpha
            );

            materials.forEach((material) => {
                material.setFloat("time", (deltaTime / msPerFlip) * dir);
            });

            if (deltaTime == msPerFlip) {
                remove();
            }
        };
    };
};

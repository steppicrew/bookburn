import * as BABYLON from "babylonjs";
import { Direction, XYZ, XZ } from "./types";
import { UpdateFn } from "../sceneUtils";

const defaultMsPerFlip = 1_000;

const PI = Math.PI;
const yAxis = new BABYLON.Vector3(0, 1, 0);

export const createFlipPage = ({
    node,
    meshes,
    indices,
    floppyness,
    cache,
    vertices,
    msPerFlip,
    flipAxis,
    scaling,
}: {
    node: BABYLON.TransformNode;
    meshes: { mesh: BABYLON.Mesh; positions0: XYZ[] }[];
    indices: number[];
    floppyness?: number;
    cache?: Map<number, Map<number, XZ>>;
    vertices: [number, number];
    msPerFlip?: number;
    flipAxis?: BABYLON.Vector3;
    scaling: BABYLON.Vector3;
}) => {
    if (!cache) {
        cache = new Map();
    }
    if (!floppyness) {
        floppyness = 0;
    }
    if (!msPerFlip) {
        msPerFlip = defaultMsPerFlip;
    }
    if (!flipAxis) {
        flipAxis = yAxis;
    }

    const xVerticies = vertices[0];

    /*
        1. Leave y as it is
        2. The extreme (xe, ze) coordinates follow a function (i.e. a semi circla/ellipse) from (1, 0) to (-1, 0)
        3. All x0 values inbetween follow a curve from (0, 0) to (xe, ze)
        */

    const rInverse_max = (2 * floppyness) / (xVerticies / scaling.x);

    /**
     * Bend the page that both edges are at z=0
     * @param time Time elapsed since start flipping
     * @returns
     */
    const getBendTranslate = (time: number): Map<number, XZ> => {
        const cacheTime = Math.max(
            time > msPerFlip / 2 ? msPerFlip - time : time,
            0
        );
        if (cache.has(cacheTime)) {
            return cache.get(cacheTime)!;
        }

        const table: Map<number, XZ> = new Map();

        const rInverse = (cacheTime / (msPerFlip / 2)) * rInverse_max;

        if (rInverse == 0) {
            for (let col = 0; col <= xVerticies; col++) {
                table.set(col, [col, 0]);
            }
            cache.set(cacheTime, table);
            return table;
        }

        const theta = xVerticies * rInverse;
        const x_c = Math.sin(theta / 2) / rInverse;
        const z_c = Math.cos(theta / 2) / rInverse;

        const d_theta = theta / xVerticies;

        for (let col = 0; col <= xVerticies / 2; col++) {
            const theta_ = -theta / 2 + col * d_theta;
            const x = x_c + Math.sin(theta_) / rInverse;
            const z = -z_c + Math.cos(theta_) / rInverse;
            table.set(col, [x, z]);
            table.set(xVerticies - col, [2 * x_c - x, z]);
        }

        cache.set(cacheTime, table);

        return table;
    };

    /**
     * Bend the page and rotate it
     * @param time Time since start flipping
     * @returns
     */
    const getTranslate = (
        time: number,
        direction: Direction
    ): Map<number, XZ> => {
        if (direction == "right") {
            time = msPerFlip - time;
        }

        const alpha = (time / msPerFlip) * PI;

        node.rotation = new BABYLON.Vector3(0, alpha, 0);

        const table = getBendTranslate(time % msPerFlip);
        if (direction == "left") {
            const _table = new Map<number, XZ>();
            table.forEach((xz, time) => _table.set(time, [xz[0], -xz[1]]));
            return _table;
        }

        return table;
    };

    return (direction: Direction = "left", startTime?: number): UpdateFn => {
        const scene = node.getScene();
        if (startTime == undefined) {
            startTime = Date.now();
        }

        return (remove: () => void) => {
            const deltaTime = Math.min(Date.now() - startTime, msPerFlip);
            if (deltaTime < 0) {
                return;
            }
            const translate = getTranslate(deltaTime, direction);
            meshes.forEach(({ mesh, positions0 }) => {
                const positions = mesh.getVerticesData(
                    BABYLON.VertexBuffer.PositionKind
                );
                if (!positions) {
                    return;
                }
                positions0.forEach((xy, i) => {
                    const xz: XZ = translate.get(xy[0])!;
                    positions[3 * i] = xz[0];
                    positions[3 * i + 2] = xz[1];
                });

                //Empty array to contain calculated values or normals added
                var normals: number[] = [];

                //Calculations of normals added
                BABYLON.VertexData.ComputeNormals(positions, indices, normals);

                mesh.setVerticesData(
                    BABYLON.VertexBuffer.PositionKind,
                    positions
                );
                mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            });
            if (deltaTime == msPerFlip) {
                remove();
            }
        };
    };
};

import * as BABYLON from "babylonjs";
import { XYZ } from "./types";

const SHOW_WIRE_FRAME = true;

const baseVector = new BABYLON.Vector2(1, 0).normalize();

const clamp = (n: number, min: number, max: number) =>
    Math.min(Math.max(n, min), max);

const getAngle = (v1: BABYLON.Vector2, v2: BABYLON.Vector2): number => {
    // Compute the dot product
    const dotProduct = clamp(v1.dot(v2), -1, 1);

    // Compute the angle in radians
    const angleRadians = Math.acos(dotProduct);

    // Return the angle in radians
    return angleRadians;
};

const rotateByAngle = (p: XYZ, angle: number): XYZ => {
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);

    const x = p[0] * cosTheta - p[1] * sinTheta;
    const y = p[0] * sinTheta + p[1] * cosTheta;

    return [x, y, p[2]] as const;
};

const foldPositions = (positions: XYZ[], angle: number): number[] => {
    if (angle === Math.PI) {
        return positions.flat();
    }
    const foldPosition = (position: XYZ): XYZ => {
        if (position[0] === 0 && position[1] === 0) {
            return position;
        }
        const vNormal = new BABYLON.Vector2(
            position[0],
            position[1]
        ).normalize();
        const vAngle = getAngle(vNormal, baseVector);
        const rotAngle = (vAngle / Math.PI) * angle - vAngle;
        return rotateByAngle(position, rotAngle);
    };
    return positions.map(foldPosition).flat();
};

/**
        4        3
        __________
       /          \
      /            \
     /              \
    /________________\
z=0:0        1       2      z = height: i+5
**/
export const getPhysicsMesh = (
    scene: BABYLON.Scene,
    width: number,
    height: number,
    depth: number
) => {
    const w2 = width / 2;
    const h2 = (Math.sqrt(3) / 2) * width + depth / 2;
    const positions_0: XYZ[] = [
        [0, 0, 0],
        [0, 0, 0],
        [width, 0, 0],
        [width, depth, 0],
        [0, depth, 0],
        [0, 0, height],
        [0, 0, height],
        [width, 0, height],
        [width, depth, height],
        [0, depth, height],
    ];
    const positions_x: XYZ[] = [
        [-width, 0, 0],
        [0, 0, 0],
        [width, 0, 0],
        [w2, h2, 0],
        [-w2, h2, 0],
        [-width, 0, height],
        [0, 0, height],
        [width, 0, height],
        [w2, h2, height],
        [-w2, h2, height],
    ];
    const indexes: number[] = [
        [0, 1, 4, 1, 2, 3, 3, 4, 1], // front
        [7, 6, 8, 6, 5, 9, 8, 6, 9], // back
        [0, 5, 1, 5, 6, 1, 1, 6, 2, 6, 7, 2], //bottom
        [4, 3, 9, 8, 9, 3], // top
        [0, 4, 5, 9, 5, 4], // left
        [3, 2, 8, 8, 2, 7], //right
    ].flat();

    const mesh = new BABYLON.Mesh("bookHull", scene);

    // Build vertexData
    {
        const vertexData = new BABYLON.VertexData();
        vertexData.indices = indexes;
        vertexData.positions = positions_0.flat();
        vertexData.applyToMesh(mesh);
    }

    if (SHOW_WIRE_FRAME) {
        mesh.material = new BABYLON.StandardMaterial("bookHull", scene);
        mesh.material.wireframe = true;
    } else {
        mesh.isVisible = false;
    }

    const getUpdate = (() => {
        let lastPositions: number[] | undefined = undefined;
        const update = (positions: number[]) => {
            if (positions === lastPositions) {
                return;
            }
            lastPositions = positions;
            mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            addPhysics();
        };

        return (maxAngle: number) => {
            const _positions_0 = positions_0.flat();
            const _positions_x = foldPositions(positions_x, maxAngle);
            const _positions_1 = positions_0
                .map((p) => rotateByAngle(p, maxAngle))
                .map((p) => [p[0], p[1] + depth, p[2]])
                .flat();

            update(_positions_0);

            return (time: number) => {
                if (time == 0 || time == 2) {
                    update(_positions_0);
                } else if (time == 1) {
                    update(_positions_1);
                } else {
                    update(_positions_x);
                }
            };
        };
    })();

    let physicsAggregate: BABYLON.PhysicsAggregate | undefined = undefined;
    const addPhysics = () => {
        if (physicsAggregate) {
            physicsAggregate.dispose();
        }
        physicsAggregate = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.MESH,
            { mass: 0.1, restitution: 1 },
            scene
        );
    };

    return { mesh, getUpdate, addPhysics };
};

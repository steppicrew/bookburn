import * as BABYLON from "babylonjs";
import { XYZ } from "./types";

const SHOW_WIRE_FRAME = true;

const indexes: number[] = [
    ...[
        [0, 1, 2, 2, 6, 0, 6, 2, 3, 3, 5, 6, 3, 4, 5], // front
        [8, 7, 9, 13, 9, 7, 9, 13, 10, 12, 10, 13, 11, 10, 12], // back
        [1, 0, 8, 7, 8, 0], //bottom
        [5, 4, 11, 11, 12, 5], // top
        [0, 6, 7, 6, 13, 7, 6, 5, 13, 5, 12, 13], // left
        [2, 1, 8, 2, 8, 9, 3, 2, 9, 3, 9, 10, 4, 3, 10, 4, 10, 11], //right
    ].flat(),
] as const;

const rotateByAngle = (p: XYZ, angle: number): XYZ => {
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);

    const x = p[0] * cosTheta - p[1] * sinTheta;
    const y = p[0] * sinTheta + p[1] * cosTheta;

    return [x, y, p[2]] as const;
};

const addYOffset = (p: XYZ, offsetY: number): XYZ => [
    p[0],
    p[1] + offsetY,
    p[2],
];

const foldPositions = (
    positions: XYZ[],
    offsetY: number,
    angle: number
): number[] => {
    if (angle === Math.PI) {
        return positions.flat();
    }
    const foldPosition = (position: XYZ, i: number): XYZ => {
        let rotAngle = 0;
        switch (i % 7) {
            case 5:
            case 4:
                rotAngle = angle;
                break;
            case 2:
                rotAngle = angle / 3;
                break;
            case 3:
                rotAngle = (2 * angle) / 3;
                break;
        }

        return addYOffset(
            rotateByAngle(addYOffset(position, -offsetY), rotAngle),
            offsetY
        );
    };
    return positions.map(foldPosition).flat();
};

/**
 * 5/12 +---------------------------------+ 4/11
 *      |                                 |
 *      |                                 + 3/10
 * 6/13 +                                 |
 *      |                                 + 2/9
 *      |                                 |
 *  0/7 +---------------------------------+ 1/8
 *
 **/
export const getPhysicsMesh = (
    scene: BABYLON.Scene,
    width: number,
    height: number,
    depth: number
) => {
    const h1 = depth / 3;
    const h2 = depth / 2;
    const h3 = (depth * 2) / 3;
    const positions: XYZ[] = [
        [0, 0, 0], // 0
        [width, 0, 0], // 1
        [width, h1, 0], // 2
        [width, h3, 0], // 3
        [width, depth, 0], // 4
        [0, depth, 0], // 5
        [0, h2, 0], // 6
        [0, 0, height], // 7
        [width, 0, height], // 8
        [width, h1, height], // 9
        [width, h3, height], // 10
        [width, depth, height], // 11
        [0, depth, height], // 12
        [0, h2, height], // 13
    ];

    const mesh = new BABYLON.Mesh("bookHull", scene);

    // Build vertexData
    {
        const vertexData = new BABYLON.VertexData();
        vertexData.indices = indexes;
        vertexData.positions = positions.flat();
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
            const _positions_0 = positions.flat();
            const _positions_x = foldPositions(positions, depth / 2, maxAngle);
            const _positions_1 = positions
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

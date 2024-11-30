import * as BABYLON from "babylonjs";

const SHOW_WIRE_FRAME = true;

type HullUpdate = [
    [positionIndexes: number[], coordinate: number],
    value: number
][];

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
    const positions: [number, number, number][] = [
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
        const _hullUpdate = (updates: HullUpdate): boolean => {
            let updated = false;
            for (const [[positionIndexes, index], value] of updates) {
                for (const pIndex of positionIndexes) {
                    if (positions[pIndex][index] != value) {
                        updated = true;
                        positions[pIndex][index] = value;
                    }
                }
            }
            return updated;
        };

        return (maxAngle: number) => {
            const time_0: HullUpdate = [
                [[[0, 4, 5, 9], 0], 0],
                [[[3, 8], 0], width],
                [[[3, 4, 8, 9], 1], depth],
            ];
            const time_1: HullUpdate = [
                [[[2, 3, 7, 8], 0], 0],
                [[[4, 9], 0], -width],
                [[[3, 4, 8, 9], 1], depth],
            ];
            const time_x: HullUpdate = [
                [[[0, 5], 0], -width],
                [[[2, 7], 0], width],
                [[[4, 9], 0], -w2],
                [[[3, 8], 0], w2],
                [[[3, 4, 8, 9], 1], h2],
            ];

            return (time: number) => {
                let updated = false;
                if (time == 0 || time == 2) {
                    updated = _hullUpdate(time_0);
                } else if (time == 1) {
                    updated = _hullUpdate(time_1);
                } else {
                    updated = _hullUpdate(time_x);
                }
                if (updated) {
                    mesh.setVerticesData(
                        BABYLON.VertexBuffer.PositionKind,
                        positions.flat()
                    );
                    addPhysics();
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

import * as BABYLON from "babylonjs";

const SHOW_WIRE_FRAME = false;

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

    const getUpdate = (maxAngle: number) => {
        return (time: number) => {
            if (time == 0 || time == 2) {
                for (const i of [0, 4, 5, 9]) {
                    positions[i][0] = 0;
                }
                for (const i of [3, 8]) {
                    positions[i][0] = width;
                }
                for (const i of [3, 4, 8, 9]) {
                    positions[i][1] = depth;
                }
            } else if (time == 1) {
                for (const i of [2, 3, 7, 8]) {
                    positions[i][0] = 0;
                }
                for (const i of [4, 9]) {
                    positions[i][0] = -width;
                }
                for (const i of [3, 4, 8, 9]) {
                    positions[i][1] = depth;
                }
            } else {
                for (const i of [0, 5]) {
                    positions[i][0] = -width;
                }
                for (const i of [2, 7]) {
                    positions[i][0] = width;
                }
                for (const i of [4, 9]) {
                    positions[i][0] = -w2;
                }
                for (const i of [3, 8]) {
                    positions[i][0] = w2;
                }
                for (const i of [3, 4, 8, 9]) {
                    positions[i][1] = h2;
                }
            }
            mesh.setVerticesData(
                BABYLON.VertexBuffer.PositionKind,
                positions.flat()
            );
        };
    };

    return { mesh, getUpdate };
};

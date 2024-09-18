import * as BABYLON from "babylonjs";

type Coordinate = [x: number, y: number, z: number];
type Color = [r: number, g: number, b: number, a: number];

type Style = "color" | "texture";

const vertices = 200;
const PI = Math.PI;
const PI2 = PI / 2;

export const createPage = (
    scene: BABYLON.Scene,
    width: number,
    height: number
) => {
    const colWidth = width / vertices;
    const rowHeight = height / vertices;

    const customMesh = new BABYLON.Mesh("custom", scene);

    const style: Style = "texture" as Style;

    const positions: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];

    const add = (coord: Coordinate, color: Color) => {
        for (const c of coord) {
            positions.push(c);
        }
        uvs.push(coord[0] / width);
        uvs.push(coord[1] / height);
        for (const c of color) {
            colors.push(c);
        }
        indices.push(indices.length);
    };

    const color1: Color = [1, 0, 0, 1];
    const color2: Color = [0, 1, 0, 1];
    const color3: Color = [0, 0, 1, 1];

    for (let row = 0; row < vertices; row++) {
        const row0 = row * rowHeight;
        const row1 = row0 + rowHeight;
        for (let col = 0; col < vertices; col++) {
            const col0 = col * colWidth;
            const col1 = col0 + colWidth;
            add([col0, row0, 0], color1);
            add([col1, row0, 0], color2);
            add([col0, row1, 0], color3);

            add([col0, row1, 0], color3);
            add([col1, row0, 0], color2);
            add([col1, row1, 0], color1);
        }
    }

    //Empty array to contain calculated values or normals added
    var normals: number[] = [];

    //Calculations of normals added
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);

    console.log(normals);

    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    switch (style) {
        case "texture":
            console.log("UVs", uvs);
            vertexData.uvs = uvs; //Assignment of texture to vertexData
            break;
        case "color":
            vertexData.colors = colors; //Assignment of colors to vertexData
            break;
    }
    vertexData.normals = normals; //Assignment of normal to vertexData added
    vertexData.applyToMesh(customMesh);

    const mat = new BABYLON.StandardMaterial("mat", scene);
    mat.backFaceCulling = false;
    mat.diffuseTexture = new BABYLON.Texture("assets/front.jpg", scene);
    //mat.wireframe = true;
    customMesh.material = mat;

    {
        const xFactor = (2 * PI) / width;
        const yFactor = (2 * PI) / height;
        const startTime = Date.now();
        scene.registerBeforeRender(() => {
            const deltaTime = (Date.now() - startTime) / 200;
            const timeFactor = Math.sin(deltaTime);
            const positions = customMesh.getVerticesData(
                BABYLON.VertexBuffer.PositionKind
            );
            if (positions) {
                for (let i = 0; i < positions.length / 3; i++) {
                    positions[3 * i + 2] =
                        Math.sin(positions[3 * i] * xFactor) *
                        Math.sin(positions[3 * i + 1] * yFactor) *
                        Math.sin(timeFactor) *
                        1;
                }
                //Empty array to contain calculated values or normals added
                var normals: number[] = [];

                //Calculations of normals added
                BABYLON.VertexData.ComputeNormals(positions, indices, normals);

                customMesh.setVerticesData(
                    BABYLON.VertexBuffer.PositionKind,
                    positions
                );
                customMesh.setVerticesData(
                    BABYLON.VertexBuffer.NormalKind,
                    normals
                );
            }
        });
    }
    const update = (dt: number) => {};

    return {};
};

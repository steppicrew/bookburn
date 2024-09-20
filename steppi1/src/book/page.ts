import * as BABYLON from "babylonjs";
import { FrontBack, PageType, XYZ, XZ } from "./types";
import { createFlipPage } from "./pageFlip";

const xVertices = 50;
const yVertices = 1;
const flipTexture = true;

const bendCache: Map<string, Map<number, Map<number, XZ>>> = new Map();
const bendCacheKey = (...args: (number | string)[]) => args.join("|");

export const createPage = ({
    scene,
    width,
    height,
    frontTexture,
    backTexture,
    floppyness,
    offset,
}: {
    scene: BABYLON.Scene;
    width: number;
    height: number;
    frontTexture: string;
    backTexture: string;
    floppyness?: number;
    offset?: BABYLON.Vector3;
}): PageType => {
    const createPageSide = (
        node: BABYLON.TransformNode,
        texture: string,
        frontBack: FrontBack,
        flipTexture: boolean
    ) => {
        const positions: number[] = [];
        const positions0: XYZ[] = [];
        const indices: number[] = [];
        const uvs: number[] = [];

        const add = (col: number, row: number) => {
            positions.push(col);
            positions.push(row);
            positions.push(0);

            positions0.push([col, row, 0]);

            uvs.push(flipTexture ? 1 - col / xVertices : col / xVertices);
            uvs.push(row / yVertices);
            indices.push(indices.length);
        };

        if (frontBack == "back") {
            for (let row = 0; row < yVertices; row++) {
                for (let col = 0; col < xVertices; col++) {
                    add(col + 1, row);
                    add(col, row);
                    add(col, row + 1);

                    add(col + 1, row);
                    add(col, row + 1);
                    add(col + 1, row + 1);
                }
            }
        } else {
            for (let row = 0; row < yVertices; row++) {
                for (let col = 0; col < xVertices; col++) {
                    add(col, row);
                    add(col + 1, row);
                    add(col, row + 1);

                    add(col, row + 1);
                    add(col + 1, row);
                    add(col + 1, row + 1);
                }
            }
        }
        //Empty array to contain calculated values or normals added
        var normals: number[] = [];

        //Calculations of normals added
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);

        const mesh = new BABYLON.Mesh("frontPage", scene);

        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.uvs = uvs; //Assignment of texture to vertexData
        vertexData.normals = normals; //Assignment of normal to vertexData added
        vertexData.applyToMesh(mesh);

        const mat = new BABYLON.StandardMaterial("pageMaterial", scene);
        // mat.backFaceCulling = false;
        mat.diffuseTexture = new BABYLON.Texture(texture, scene);
        //mat.wireframe = true;
        mesh.material = mat;
        mesh.parent = node;

        return {
            positions0,
            indices,
            mesh,
        };
    };

    const pageSidesNode = new BABYLON.TransformNode("pageside", scene);
    pageSidesNode.scaling = new BABYLON.Vector3(
        width / xVertices,
        height / yVertices,
        1
    );
    if (offset) {
        pageSidesNode.position = offset;
    }

    const {
        mesh: frontMesh,
        positions0: frontPositions0,
        indices,
    } = createPageSide(pageSidesNode, frontTexture, "front", !flipTexture);
    const { mesh: backMesh, positions0: backPositions0 } = createPageSide(
        pageSidesNode,
        backTexture,
        "back",
        flipTexture
    );

    const pageNode = new BABYLON.TransformNode("page", scene);
    pageSidesNode.parent = pageNode;

    const cacheKey = bendCacheKey(xVertices, floppyness || 0);
    if (!bendCache.has(cacheKey)) {
        bendCache.set(cacheKey, new Map());
    }
    const cache = bendCache.get(cacheKey)!;

    const flipPage = createFlipPage({
        node: pageNode,
        meshes: [
            { mesh: frontMesh, positions0: frontPositions0 },
            { mesh: backMesh, positions0: backPositions0 },
        ],
        indices,
        floppyness,
        cache,
        vertices: [xVertices, yVertices],
        scaling: pageSidesNode.scaling,
    });

    return { node: pageSidesNode, flipPage };
};

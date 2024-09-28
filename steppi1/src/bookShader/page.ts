import * as BABYLON from "babylonjs";
import { FrontBack, PageType, XYZ, XZ } from "./types";
import { createFlipPage } from "./pageFlip";
import vertexShader from "./shaders/book-vertexShader.glsl";
import fragmentShader from "./shaders/book-fragmentShader.glsl";
import { setLights } from "../shaderTools";

const defaultXVertices = 50;
const defaultYVertices = 1;
const flipTexture = true;

let _pageCount = 0;

export const createPage = ({
    scene,
    width,
    height,
    frontTexture,
    backTexture,
    floppyness,
    offset,
    vertices,
}: {
    scene: BABYLON.Scene;
    width: number;
    height: number;
    frontTexture: string;
    backTexture: string;
    floppyness?: number;
    offset?: BABYLON.Vector3;
    vertices?: [number, number];
}): PageType => {
    if (!vertices) {
        vertices = [defaultXVertices, defaultYVertices];
    }

    const [xVertices, yVertices] = vertices;

    const createPageSide = (
        node: BABYLON.TransformNode,
        texture: string,
        frontBack: FrontBack,
        flipTexture: boolean,
        width: number,
        height: number
    ) => {
        const positions: number[] = [];
        const indices: number[] = [];
        const uvs: number[] = [];
        const pageNum = ++_pageCount;

        const add = (col: number, row: number) => {
            positions.push((col / xVertices) * width);
            positions.push(0);
            positions.push((row / yVertices) * height);

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

        const shader = `bookShader_${pageNum}_${Date.now()}`;

        BABYLON.Effect.ShadersStore[`${shader}VertexShader`] = vertexShader;
        BABYLON.Effect.ShadersStore[`${shader}FragmentShader`] = fragmentShader;

        const material = new BABYLON.ShaderMaterial(
            "pageMaterial",
            scene,
            {
                vertex: shader,
                fragmentElement: shader,
            },
            {
                attributes: ["position", "uv", "normal"],
                uniforms: [
                    // vertex variables
                    "worldViewProjection",

                    "time",
                    "floppyness",
                    "orientation",
                    "dimensions",

                    // fragment variables
                    "lightPositions",
                    "lightPositionsColors",
                    "lightPositionsIntensities",
                    "numLightsPositions",

                    "lightDirections",
                    "lightDirectionsColors",
                    "lightDirectionsIntensities",
                    "numLightsDirections",
                ],
                samplers: ["bookTexture"],
            }
        );
        // mat.backFaceCulling = false;
        material.setTexture("bookTexture", new BABYLON.Texture(texture, scene));
        material.setFloat("time", 0.2);
        material.setFloat("floppyness", floppyness || 0);
        material.setFloat("orientation", frontBack == "front" ? 1 : -1);
        material.setVector2("dimensions", new BABYLON.Vector2(width, height));

        setLights(scene, material);

        //mat.wireframe = true;
        mesh.material = material;
        mesh.parent = node;

        return material;
    };

    const pageSidesNode = new BABYLON.TransformNode("pageside", scene);

    /*
    pageSidesNode.scaling = new BABYLON.Vector3(
        width / xVertices,
        height / yVertices,
        1
    );
    */
    if (offset) {
        pageSidesNode.position = offset;
    }

    const frontMaterial = createPageSide(
        pageSidesNode,
        frontTexture,
        "front",
        !flipTexture,
        width,
        height
    );
    const backMaterial = createPageSide(
        pageSidesNode,
        backTexture,
        "back",
        flipTexture,
        width,
        height
    );

    const pageNode = new BABYLON.TransformNode("page", scene);
    pageSidesNode.parent = pageNode;

    const flipPage = createFlipPage({
        node: pageNode,
        materials: [frontMaterial, backMaterial],
        floppyness,
        msPerFlip: 500,
    });

    return {
        node: pageNode,
        materials: [frontMaterial, backMaterial],
        flipPage,
    };
};

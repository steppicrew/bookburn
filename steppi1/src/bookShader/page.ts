import * as BABYLON from "babylonjs";
import { FrontBack, PageType, XYZ, XZ } from "./types";
import { createFlipPage } from "./pageFlip";
import vertexShader from "./shaders/book-vertexShader.glsl";
import fragmentShader from "./shaders/book-fragmentShader.glsl";
import { updateWrapper } from "../sceneUtils";

const defaultXVertices = 50;
const defaultYVertices = 1;
const flipTexture = true;

let _pageCount = 0;

const createAddPositions = (positions: XYZ[], uvs: XZ[]) => {
    // maps x->(z->index)
    const vertexMap: Map<number, Map<number, number>> = new Map();

    return ([x, z]: XZ, uv: XZ): number => {
        if (!vertexMap.has(x)) {
            vertexMap.set(x, new Map());
        } else {
            const index = vertexMap.get(x)?.get(z);
            if (index !== undefined) {
                return index;
            }
        }
        const index = positions.length;
        vertexMap.get(x)!.set(z, index);
        positions.push([x, 0, z]);
        uvs.push(uv);
        return index;
    };
};

export const createPage = ({
    scene,
    width,
    height,
    frontTexture,
    backTexture,
    floppyness,
    offset,
    vertices,
    uniformBuffer,
}: {
    scene: BABYLON.Scene;
    width: number;
    height: number;
    frontTexture: string;
    backTexture: string;
    floppyness?: number;
    offset?: BABYLON.Vector3;
    vertices?: [number, number];
    uniformBuffer: BABYLON.UniformBuffer;
}): PageType => {
    if (!vertices) {
        vertices = [defaultXVertices, defaultYVertices];
    }

    const [xVertices, yVertices] = vertices;

    const createPageSide = (
        node: BABYLON.TransformNode,
        texture: string,
        frontBack: FrontBack,
        flipTexture: boolean
    ) => {
        const positions: XYZ[] = [];
        const indexes: number[] = [];
        const uvs: XZ[] = [];
        const pageNum = ++_pageCount;

        const addPosition = createAddPositions(positions, uvs);

        const add = (col: number, row: number) => {
            indexes.push(
                addPosition(
                    [(col / xVertices) * width, (row / yVertices) * height],
                    [
                        flipTexture ? 1 - col / xVertices : col / xVertices,
                        row / yVertices,
                    ]
                )
            );
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
        BABYLON.VertexData.ComputeNormals(positions, indexes, normals);

        const mesh = new BABYLON.Mesh("frontPage", scene);

        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions.flat();
        vertexData.indices = indexes;
        vertexData.uvs = uvs.flat(); //Assignment of texture to vertexData
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

                    "parentPosition",
                    "parentRotation",
                ],
                samplers: ["bookTexture"],
            }
        );
        // mat.backFaceCulling = false;
        material.setTexture("bookTexture", new BABYLON.Texture(texture, scene));
        material.setFloat("time", 1.5);
        material.setFloat("floppyness", floppyness || 0);
        material.setFloat("orientation", frontBack == "front" ? 1 : -1);
        material.setVector2("dimensions", new BABYLON.Vector2(width, height));

        material.setUniformBuffer("commonBuffer", uniformBuffer);

        //mat.wireframe = true;
        mesh.material = material;
        mesh.parent = node;

        return mesh;
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

    const meshes: BABYLON.Mesh[] = [];
    meshes.push(
        createPageSide(pageSidesNode, frontTexture, "front", !flipTexture)
    );
    meshes.push(
        createPageSide(pageSidesNode, backTexture, "back", flipTexture)
    );

    const pageNode = new BABYLON.TransformNode("page", scene);
    pageSidesNode.parent = pageNode;

    const updateParentPosition = () => {
        meshes.forEach((mesh) => {
            const material = mesh.material as BABYLON.ShaderMaterial;
            const parent = mesh.parent! as BABYLON.TransformNode;
            material.setVector3("parentPosition", parent.getAbsolutePosition());

            // Get the parent's world matrix
            const worldMatrix = parent.getWorldMatrix();

            // Calculate rotation from the world matrix
            const rotation = new BABYLON.Vector3();

            // Manually extract Euler angles from the rotation matrix
            const m = worldMatrix.m; // Get the underlying array of the matrix

            // Extract rotation around Y (yaw)
            rotation.y = Math.atan2(m[8], m[0]);

            // Extract rotation around X (pitch)
            const sy = Math.sqrt(m[0] * m[0] + m[8] * m[8]); // Scale factor
            rotation.x = Math.atan2(-m[9], sy);

            // Extract rotation around Z (roll)
            rotation.z = Math.atan2(m[4], m[5]);

            material.setVector3("parentRotation", rotation);
        });
    };

    const updates = updateWrapper();
    updates.add(updateParentPosition);

    const flipPage = createFlipPage({
        node: pageNode,
        materials: meshes.map(
            (mesh) => mesh.material as BABYLON.ShaderMaterial
        ),
        floppyness,
        msPerFlip: 500,
        updateWrapper: updates,
    });

    return {
        node: pageNode,
        update: updates.update,
        //materials,
        flipPage,
    };
};

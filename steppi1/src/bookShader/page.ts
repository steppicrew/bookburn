import * as BABYLON from "babylonjs";
import { FrontBack, PageType, XYZ, XZ } from "./types";
import { createFlipPage } from "./pageFlip";
import vertexShader from "./shaders/book-vertexShader.glsl";
import fragmentShader from "./shaders/book-fragmentShader.glsl";
import { updateWrapper } from "../sceneUtils";

const defaultXVertices = 50;
const defaultYVertices = 1;
const flipTexture = true;

const shaderName = `bookShader_${Date.now()}`;

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
    parentNode,
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
    parentNode: BABYLON.Node;
}): PageType => {
    if (!vertices) {
        vertices = [defaultXVertices, defaultYVertices];
    }

    const [xVertices, yVertices] = vertices;

    const createPageSide = (
        texture: string,
        frontBack: FrontBack,
        flipTexture: boolean
    ) => {
        const positions: XYZ[] = [];
        const indexes: number[] = [];
        const uvs: XZ[] = [];

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

        const mesh = new BABYLON.Mesh(`${frontBack}-page`, scene);

        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions.flat();
        vertexData.indices = indexes;
        vertexData.uvs = uvs.flat(); //Assignment of texture to vertexData
        vertexData.normals = normals; //Assignment of normal to vertexData added
        vertexData.applyToMesh(mesh);

        {
            const vertexShaderName = `${shaderName}VertexShader`;
            if (!(vertexShaderName in BABYLON.Effect.ShadersStore)) {
                BABYLON.Effect.ShadersStore[vertexShaderName] = vertexShader;
            }
            const fragmentShaderName = `${shaderName}FragmentShader`;
            if (!(fragmentShaderName in BABYLON.Effect.ShadersStore)) {
                BABYLON.Effect.ShadersStore[fragmentShaderName] =
                    fragmentShader;
            }
        }
        const material = new BABYLON.ShaderMaterial(
            "pageMaterial",
            scene,
            {
                vertex: shaderName,
                fragment: shaderName,
                // fragment: "default",
                // fragmentElement: shader,
            },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    // vertex variables
                    "world",
                    "worldViewProjection",

                    "time",
                    "floppyness",
                    "orientation",
                    "dimensions",
                    "offset",

                    /*
                    // fragment variables
                    "vEyePosition",
                    "visibility",
                    */
                ],
                samplers: ["bookTexture"],
            }
        );
        // mat.backFaceCulling = false;
        material.setTexture("bookTexture", new BABYLON.Texture(texture, scene));
        material.setFloat("time", 0);
        material.setFloat("floppyness", floppyness || 0);
        material.setFloat("orientation", frontBack == "front" ? 1 : -1);
        material.setVector2("dimensions", new BABYLON.Vector2(width, height));
        material.setVector3("offset", offset || new BABYLON.Vector3(0, 0, 0));

        if (false) {
            material.setFloat("visibility", 1);

            // Create the uniform values for the material
            const diffuseColor = new BABYLON.Vector4(1.0, 0.0, 0.0, 1.0); // Example diffuse color (red)
            const specularColor = new BABYLON.Vector4(1.0, 1.0, 1.0, 1.0); // Specular color
            const emissiveColor = new BABYLON.Vector3(0.1, 0.1, 0.1); // Emissive color

            // Pass the uniform values to the shader
            material.setVector4("vDiffuseColor", diffuseColor);
            material.setVector4("vSpecularColor", specularColor);
            material.setVector3("vEmissiveColor", emissiveColor);

            // If you have matrices, you can pass them like this
            material.setMatrix("diffuseMatrix", BABYLON.Matrix.Identity());

            // Assuming you have a camera in your scene
            const camera = scene.activeCamera;

            if (camera) {
                // Set the viewProjection matrix
                const viewProjection = camera
                    .getViewMatrix()
                    .multiply(camera.getProjectionMatrix());
                material.setMatrix("viewProjection", viewProjection);

                // Set the eye position (camera position)
                material.setVector3("vEyePosition", camera.position);
            }
        }

        material.setUniformBuffer("commonBuffer", uniformBuffer);

        //mat.wireframe = true;
        mesh.material = material;
        if (parentNode) {
            mesh.parent = parentNode;
        }

        return mesh;
    };

    const pageNode = new BABYLON.TransformNode("page", scene);

    /*
    pageSidesNode.scaling = new BABYLON.Vector3(
        width / xVertices,
        height / yVertices,
        1
    );
    */
    const meshes: BABYLON.Mesh[] = [];
    meshes.push(createPageSide(frontTexture, "front", !flipTexture));
    meshes.push(createPageSide(backTexture, "back", flipTexture));

    const updates = updateWrapper();

    const flipPage = createFlipPage({
        materials: meshes.map(
            (mesh) => mesh.material as BABYLON.ShaderMaterial
        ),
        floppyness,
        msPerFlip: 500,
        updateWrapper: updates,
    });

    return {
        update: updates.update,
        //materials,
        flipPage,
    };
};

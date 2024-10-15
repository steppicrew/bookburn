import * as BABYLON from "babylonjs";
import vertexShader from "./shaders/book-vertexShader.glsl";
import fragmentShader from "./shaders/book-fragmentShader.glsl";
import { updateWrapper } from "../sceneUtils";
import { setLights } from "../shaderTools";
import {
    BookBody,
    BookBodySide,
    BookPageNum,
    BookType,
    MaxBodyAttribute,
    MaxBookPageNum,
    RangeInt,
    TextureMap,
    XYZ,
    XYZInt,
    XZ,
    XZInt,
} from "./types";

const defaultXVertices = 10;
const defaultYVertices = 5;
const defaultZVertices = 1;

const flipTexture = true;

type AttributeType = [u: number, v: number, bodySide: number, pageNum: number];

const shaderName = `bookBlockShader_${Date.now()}`;

const createAddPositions = (
    indexes: number[],
    positions: [0, 0, 0][],
    attributes: AttributeType[]
) => {
    // maps "body-side-sideNum-x-z" -> index
    const vertexMap = new Map<string, number>();

    return (
        body: BookBody,
        side: BookBodySide,
        pageNum: number,
        position: XZInt,
        dimension: XZInt
    ): void => {
        const key = [body, side, pageNum, ...position].join("-");

        const oldValue = vertexMap.get(key);
        if (oldValue !== undefined) {
            indexes.push(oldValue);
            return;
        }

        const newValue = positions.length;
        vertexMap.set(key, newValue);
        positions.push([0, 0, 0]);
        attributes.push([
            position[0] / dimension[0],
            position[1] / dimension[1],
            (body + side) / MaxBodyAttribute,
            pageNum / MaxBookPageNum,
        ]);
        indexes.push(newValue);
    };
};

export const createBookParts = ({
    scene,
    width,
    height,
    depth,
    pageCount,
    maxFlipPageCount,
    flipPageCount,
    texture,
    textureMapper: textureMap,
    floppyness,
    vertices,
    parentNode,
}: {
    scene: BABYLON.Scene;
    width: number;
    height: number;
    depth: number;
    pageCount: number;
    maxFlipPageCount: BookPageNum;
    flipPageCount?: BookPageNum;
    texture: BABYLON.Texture;
    textureMapper: TextureMap[];
    floppyness?: number;
    vertices?: XYZInt;
    parentNode: BABYLON.Node;
}): BookType => {
    if (!vertices) {
        vertices = [defaultXVertices, defaultYVertices, defaultZVertices];
    }

    const [xVertices, yVertices, zVertices] = vertices;
    const updates = updateWrapper();
    const uniformBuffer = setLights(scene, updates);

    const indexes: number[] = [];
    const positions: [0, 0, 0][] = [];
    const attributes: AttributeType[] = [];

    const addPosition = createAddPositions(indexes, positions, attributes);

    const addPage = (
        body: BookBody,
        side: BookBodySide,
        pageNum: BookPageNum,
        vertices: XZInt
    ) => {
        const add = (col: RangeInt, row: RangeInt) => {
            addPosition(body, side, pageNum, [col, row], vertices);
        };
        for (let row = 0; row < vertices[1]; row++) {
            for (let col = 0; col < vertices[0]; col++) {
                switch (side) {
                    case BookBodySide.Bottom:
                    case BookBodySide.Pages:
                    case BookBodySide.North:
                        add((col + 1) as RangeInt, row as RangeInt);
                        add(col as RangeInt, row as RangeInt);
                        add(col as RangeInt, (row + 1) as RangeInt);

                        add((col + 1) as RangeInt, row as RangeInt);
                        add(col as RangeInt, (row + 1) as RangeInt);
                        add((col + 1) as RangeInt, (row + 1) as RangeInt);
                        break;
                    case BookBodySide.Top:
                    case BookBodySide.Binder:
                    case BookBodySide.South:
                        add(col as RangeInt, row as RangeInt);
                        add((col + 1) as RangeInt, row as RangeInt);
                        add(col as RangeInt, (row + 1) as RangeInt);

                        add(col as RangeInt, (row + 1) as RangeInt);
                        add((col + 1) as RangeInt, row as RangeInt);
                        add((col + 1) as RangeInt, (row + 1) as RangeInt);
                        break;
                }
            }
        }
    };

    // Build blocks and flip pages
    {
        const xzVertices = [xVertices, zVertices] as XZInt;
        const xyVertices = [xVertices, yVertices] as XZInt;
        const yzVertices = [yVertices, zVertices] as XZInt;

        // Build front and back block
        for (const body of [BookBody.FrontBlock, BookBody.BackBlock]) {
            addPage(body, BookBodySide.Top, 0, xzVertices);
            addPage(body, BookBodySide.Bottom, 0, xzVertices);
            addPage(body, BookBodySide.Binder, 0, yzVertices);
            addPage(body, BookBodySide.Pages, 0, yzVertices);
            addPage(body, BookBodySide.North, 0, xyVertices);
            addPage(body, BookBodySide.South, 0, xyVertices);
        }

        // Build flip pages
        for (let i = 0; i < maxFlipPageCount; i++) {
            addPage(
                BookBody.Page,
                BookBodySide.Top,
                i as BookPageNum,
                xzVertices
            );
            addPage(
                BookBody.Page,
                BookBodySide.Bottom,
                i as BookPageNum,
                xzVertices
            );
        }
    }

    const mesh = new BABYLON.Mesh("book", scene);

    // Build vertexData
    {
        const vertexData = new BABYLON.VertexData();
        vertexData.indices = indexes;
        vertexData.positions = positions.flat();
        vertexData.colors = attributes.flat();
        vertexData.applyToMesh(mesh);
    }

    // Assign shaders
    {
        const vertexShaderName = `${shaderName}VertexShader`;
        if (!(vertexShaderName in BABYLON.Effect.ShadersStore)) {
            BABYLON.Effect.ShadersStore[vertexShaderName] = vertexShader;
        }
        const fragmentShaderName = `${shaderName}FragmentShader`;
        if (!(fragmentShaderName in BABYLON.Effect.ShadersStore)) {
            BABYLON.Effect.ShadersStore[fragmentShaderName] = fragmentShader;
        }
    }

    // Build material
    {
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
                attributes: ["color"],
                uniforms: [
                    // vertex variables
                    "world",
                    "worldViewProjection",

                    "time",
                    "floppyness",
                    "pageCount",
                    "maxFlipPages",
                    "flipPages",
                    "dimensions",
                    "pageDepth",
                    "coverDepth",
                    "vertices",
                    "textureUVs",
                    "textureCount",
                ],
                samplers: ["bookTexture"],
            }
        );

        // mat.backFaceCulling = false;
        material.setTexture("bookTexture", texture);
        material.setFloat("time", 1.7);
        material.setFloat("floppyness", floppyness || 0);
        material.setInt("pageCount", pageCount);
        material.setInt("maxFlipPages", maxFlipPageCount);
        material.setInt("flipPages", flipPageCount || maxFlipPageCount);
        material.setVector3(
            "dimensions",
            new BABYLON.Vector3(width, depth, height)
        );
        console.log(width, depth, height);
        material.setFloat("pageDepth", depth / pageCount);
        material.setFloat("coverDepth", depth / pageCount);
        material.setVector3("vertices", new BABYLON.Vector3(...vertices));
        material.setArray4("textureUVs", textureMap.flat(2));
        material.setInt("textureCount", textureMap.length);

        material.setUniformBuffer("Lights", uniformBuffer);

        // material.wireframe = true;
        mesh.material = material;
    }
    if (parentNode) {
        mesh.parent = parentNode;
    }

    const flipBook = () => {};

    return {
        flipBook,
        updates,
    };
};

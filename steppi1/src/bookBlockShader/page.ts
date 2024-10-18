import * as BABYLON from "babylonjs";
import vertexShader from "./shaders/book-vertexShader.glsl";
import fragmentShader from "./shaders/book-fragmentShader.glsl";
import { updateWrapper } from "../sceneUtils";
import { setLights } from "../shaderTools";
import {
    BookBody,
    BookBodySide,
    BookFlipDirection,
    BookPageNum,
    BookType,
    MaxBookPageNum,
    RangeInt,
    TextureMap,
    XYZInt,
    XZInt,
} from "./types";
import { globals } from "../scene2";

const defaultXVertices = 10;
const defaultYVertices = 5;
const defaultZVertices = 1;

type AttributeType = [u: number, v: number, bodySide: number, pageNum: number];

const shaderName = `bookBlockShader_${Date.now()}`;

const createAddPositions = (
    indexes: number[],
    positions: [number, number, number][],
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
        positions.push([
            position[0] / dimension[0],
            position[1] / dimension[1],
            0,
        ]);
        attributes.push([
            position[0] / dimension[0],
            position[1] / dimension[1],
            (body << 3) | side,
            pageNum,
        ]);
        indexes.push(newValue);
    };
};

export const createBookParts = ({
    scene,
    width,
    height,
    coverDepth,
    pageDepth,
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
    coverDepth?: number;
    pageDepth?: number;
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

    const addElement = (
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
                    case BookBodySide.East:
                    case BookBodySide.North:
                        add((col + 1) as RangeInt, row as RangeInt);
                        add(col as RangeInt, row as RangeInt);
                        add(col as RangeInt, (row + 1) as RangeInt);

                        add((col + 1) as RangeInt, row as RangeInt);
                        add(col as RangeInt, (row + 1) as RangeInt);
                        add((col + 1) as RangeInt, (row + 1) as RangeInt);
                        break;
                    case BookBodySide.Top:
                    case BookBodySide.South:
                    case BookBodySide.Binder:
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
        const vertices11 = [1, 1] as XZInt;

        {
            // Build front and back cover
            for (const body of [BookBody.FrontCover, BookBody.BackCover]) {
                addElement(body, BookBodySide.Top, 0, vertices11);
                addElement(body, BookBodySide.Bottom, 0, vertices11);
                addElement(body, BookBodySide.North, 0, vertices11);
                addElement(body, BookBodySide.East, 0, vertices11);
                addElement(body, BookBodySide.South, 0, vertices11);
                addElement(body, BookBodySide.Binder, 0, vertices11);
            }
        }
        {
            // build front and back block
            for (const body of [BookBody.FrontBlock, BookBody.BackBlock]) {
                addElement(body, BookBodySide.Top, 0, xzVertices);
                addElement(body, BookBodySide.North, 0, xyVertices);
                addElement(body, BookBodySide.East, 0, yzVertices);
                addElement(body, BookBodySide.South, 0, xyVertices);
                addElement(body, BookBodySide.Binder, 0, yzVertices);
            }
        }
        {
            // Build flip pages
            for (let i = 0; i < maxFlipPageCount; i++) {
                addElement(
                    BookBody.Page,
                    BookBodySide.Top,
                    i as BookPageNum,
                    xzVertices
                );
                addElement(
                    BookBody.Page,
                    BookBodySide.Bottom,
                    i as BookPageNum,
                    xzVertices
                );
            }
        }
        {
            addElement(BookBody.Binder, BookBodySide.Binder, 0, yzVertices);
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
                "flipPages",
                "dimensions",
                "pageDepth",
                "coverDepth",
                "textureUVs",
                "textureCount",
            ],
            samplers: ["bookTexture"],
        }
    );

    // mat.backFaceCulling = false;
    material.setTexture("bookTexture", texture);
    material.setFloat("time", 1.0);
    material.setFloat("floppyness", floppyness || 0);
    material.setInt("pageCount", pageCount);
    material.setInt(
        "flipPages",
        Math.min(flipPageCount || maxFlipPageCount, maxFlipPageCount)
    );
    material.setVector2("dimensions", new BABYLON.Vector2(width, height));
    material.setFloat("pageDepth", pageDepth || 0.001);
    material.setFloat("coverDepth", coverDepth || 0.01);
    material.setArray4("textureUVs", textureMap.flat(2));
    material.setInt("textureCount", textureMap.length);

    material.setUniformBuffer("Lights", uniformBuffer);

    // material.wireframe = true;
    mesh.material = material;

    if (parentNode) {
        mesh.parent = parentNode;
    }

    const flipBook = ({
        direction,
        msPerFlip,
        flipPages,
        startTime,
    }: {
        direction: BookFlipDirection;
        msPerFlip: number;
        flipPages?: number;
        startTime?: number;
    }): Promise<void> =>
        new Promise((resolve) => {
            const _startTime = startTime || Date.now();
            if (!flipPages || flipPages > maxFlipPageCount) {
                flipPages = maxFlipPageCount;
            }
            const timeOffset = direction === "left" ? 0 : 1;

            material.setFloat("time", timeOffset);
            material.setInt("flipPages", flipPages);

            const update = () => {
                const now = Date.now();
                if (now < _startTime) {
                    return;
                }
                const time = Math.min((now - _startTime) / msPerFlip, 1);

                let time1 = time + timeOffset;

                if (globals.useDebugTime) {
                    time1 = globals.debugTime;
                }

                material.setFloat("time", time1);
                if (time === 1) {
                    updates.remove(update);
                    resolve();
                }
            };

            updates.add(update);
        });
    return {
        flipBook,
        updates,
    };
};

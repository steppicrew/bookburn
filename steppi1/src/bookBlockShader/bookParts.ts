import * as BABYLON from "babylonjs";
import { globals } from "../gloabls";
import { updateWrapper } from "../sceneUtils";
import { setLights } from "../shaderTools";
import fragmentShader from "./shaders/book-fragmentShader.glsl";
import vertexShader from "./shaders/book-vertexShader.glsl";
import {
    BookBody,
    BookBodySide,
    BookFlipDirection,
    BookPageNum,
    BookType,
    RangeInt,
    TextureMap,
    XYZInt,
    XZInt,
} from "./types";

const defaultXVertices = 10;
const defaultYVertices = 5;
const defaultZVertices = 1;

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
    coverOverlap,
    pageCount,
    maxFlipPageCount,
    flipPageCount,
    texture,
    textureMap,
    textureIndexes,
    floppyness,
    vertices,
    parentNode,
}: {
    scene: BABYLON.Scene;
    width: number;
    height: number;
    coverDepth?: number;
    pageDepth?: number;
    coverOverlap?: [number, number];
    pageCount: number;
    maxFlipPageCount: BookPageNum;
    flipPageCount?: BookPageNum;
    texture: BABYLON.Texture;
    textureMap: TextureMap[];
    textureIndexes: number[];
    floppyness?: number;
    vertices?: XYZInt;
    parentNode: BABYLON.Node;
}): BookType => {
    if (!vertices) {
        vertices = [defaultXVertices, defaultYVertices, defaultZVertices];
    }
    if (!coverOverlap) {
        coverOverlap = [width * 0.01, height * 0.01];
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
        const verticesXZ = [xVertices, zVertices] as XZInt;
        const verticesXY = [xVertices, yVertices] as XZInt;
        const verticesYZ = [yVertices, zVertices] as XZInt;
        const vertices2Y1 = [2 * yVertices, 1] as XZInt;
        const vertices11 = [1, 1] as XZInt;

        {
            // Build front and back cover
            for (const body of [BookBody.FrontCover, BookBody.BackCover]) {
                addElement(body, BookBodySide.Top, 0, vertices11);
                addElement(body, BookBodySide.Bottom, 0, vertices11);
                addElement(body, BookBodySide.North, 0, vertices11);
                addElement(body, BookBodySide.East, 0, vertices11);
                addElement(body, BookBodySide.South, 0, vertices11);
            }
        }
        {
            // build front and back block
            for (const body of [BookBody.FrontBlock, BookBody.BackBlock]) {
                addElement(body, BookBodySide.North, 0, verticesXY);
                addElement(body, BookBodySide.East, 0, verticesYZ);
                addElement(body, BookBodySide.South, 0, verticesXY);
                // addElement(body, BookBodySide.Binder, 0, verticesYZ);
            }
            addElement(BookBody.FrontBlock, BookBodySide.Bottom, 0, verticesXZ);
            addElement(BookBody.BackBlock, BookBodySide.Top, 0, verticesXZ);
        }
        {
            // Build flip pages
            for (let i = 0; i < maxFlipPageCount; i++) {
                addElement(
                    BookBody.Page,
                    BookBodySide.Top,
                    i as BookPageNum,
                    verticesXZ
                );
                addElement(
                    BookBody.Page,
                    BookBodySide.Bottom,
                    i as BookPageNum,
                    verticesXZ
                );
            }
        }
        {
            addElement(BookBody.Binder, BookBodySide.Top, 0, vertices2Y1);
            addElement(BookBody.Binder, BookBodySide.North, 0, vertices2Y1);
            addElement(BookBody.Binder, BookBodySide.Bottom, 0, vertices2Y1);
            addElement(BookBody.Binder, BookBodySide.South, 0, vertices2Y1);
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
                "flipAngle",
                "floppyness",
                "pageCount",
                "flipPages",
                "dimensions",
                "pageDepth",
                "coverDepth",
                "coverOverlap",
                "textureUVs",
                "textureIndexes",
                "textureCount",
            ],
            samplers: ["bookTexture"],
        }
    );

    if (!pageDepth) {
        pageDepth = 0.001;
    }
    if (!coverDepth) {
        coverDepth = 0.01;
    }

    // mat.backFaceCulling = false;
    material.setTexture("bookTexture", texture);
    material.setFloat("time", 0);
    material.setFloat("floppyness", floppyness || 0);
    material.setInt("pageCount", pageCount);
    material.setInt(
        "flipPages",
        Math.min(flipPageCount || maxFlipPageCount, maxFlipPageCount)
    );
    material.setVector2("dimensions", new BABYLON.Vector2(width, height));
    material.setFloat("pageDepth", pageDepth);
    material.setFloat("coverDepth", coverDepth);
    material.setVector2("coverOverlap", new BABYLON.Vector2(...coverOverlap));
    material.setArray4("textureUVs", textureMap.flat(2));
    material.setFloats("textureIndexes", textureIndexes);
    material.setInt("textureCount", textureIndexes.length);
    // material.setFloat("flipAngle", Math.PI / 3);

    material.setUniformBuffer("Lights", uniformBuffer);

    // material.wireframe = true;
    mesh.material = material;

    // Set BB to position on right side at time == 0, on left at time == 1, and on both sides at time in between
    const setBoundingBox = (time: number) => {
        const minX = time > 0 ? -width : 0;
        const maxX = time < 1 ? width : 0;
        mesh.computeWorldMatrix(true);
        mesh.setBoundingInfo(
            new BABYLON.BoundingInfo(
                new BABYLON.Vector3(minX, 0, 0),
                new BABYLON.Vector3(
                    maxX,
                    2 * coverDepth + pageCount * pageDepth,
                    height
                )
            )
        );
    };

    setBoundingBox(0);
    // mesh.showBoundingBox = true;

    if (parentNode) {
        mesh.parent = parentNode;
    }

    const flipBook = ({
        direction,
        msPerFlip,
        flipPages,
        startTime,
        flipAngle,
    }: {
        direction: BookFlipDirection;
        msPerFlip: number;
        flipPages?: number;
        startTime?: number;
        flipAngle?: number;
    }): Promise<void> =>
        new Promise((resolve) => {
            const _startTime = startTime || Date.now();
            if (!flipPages || flipPages > maxFlipPageCount) {
                flipPages = maxFlipPageCount;
            }
            const timeOffset = direction === "left" ? 0 : 1;

            material.setFloat("time", timeOffset);
            material.setInt("flipPages", flipPages);
            material.setFloat("flipAngle", flipAngle || 0);

            let started = false;

            const update = () => {
                const now = Date.now();
                if (now < _startTime) {
                    return;
                }
                if (!started) {
                    started = true;
                    setBoundingBox(0.5);
                }
                const time = Math.min((now - _startTime) / msPerFlip, 1);

                let time1 = time + timeOffset;

                if (globals.useDebugTime) {
                    time1 = globals.debugTime;
                    material.setFloat("time", time1);
                    return;
                }

                material.setFloat("time", time1);
                if (time === 1) {
                    updates.remove(update);
                    setBoundingBox(1 - timeOffset);
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

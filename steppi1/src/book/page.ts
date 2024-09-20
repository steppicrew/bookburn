import * as BABYLON from "babylonjs";

type XYZ = [x: number, y: number, z: number];
type XZ = [x: number, z: number];

type FrontBack = "front" | "back";
type Direction = "left" | "right";

const vertices = 50;
const PI = Math.PI;
const flipTexture = true;
const msPerFlip = 1_000;

const bendCache: Map<string, Map<number, Map<number, XZ>>> = new Map();
const bendCacheKey = (...args: (number | string)[]) => args.join("|");

export const createPage = ({
    scene,
    width,
    height,
    frontTexture,
    backTexture,
    floppyness,
}: {
    scene: BABYLON.Scene;
    width: number;
    height: number;
    frontTexture: string;
    backTexture: string;
    floppyness?: number;
}) => {
    const colWidth = width / vertices;
    const rowHeight = height / vertices;

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
            positions.push(col * colWidth);
            positions.push(row * rowHeight);
            positions.push(0);

            positions0.push([col, row, 0]);

            uvs.push(flipTexture ? 1 - col / vertices : col / vertices);
            uvs.push(row / vertices);
            indices.push(indices.length);
        };

        if (frontBack == "front") {
            for (let row = 0; row < vertices; row++) {
                for (let col = 0; col < vertices; col++) {
                    add(col + 1, row);
                    add(col, row);
                    add(col, row + 1);

                    add(col + 1, row);
                    add(col, row + 1);
                    add(col + 1, row + 1);
                }
            }
        } else {
            for (let row = 0; row < vertices; row++) {
                for (let col = 0; col < vertices; col++) {
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

        console.log(normals);

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

    const node = new BABYLON.TransformNode("book", scene);

    const {
        mesh: frontMesh,
        positions0: frontPositions0,
        indices,
    } = createPageSide(node, frontTexture, "back", !flipTexture);
    const { mesh: backMesh, positions0: backPositions0 } = createPageSide(
        node,
        backTexture,
        "front",
        flipTexture
    );

    const cacheKey = bendCacheKey(width, height, floppyness || 0);
    if (!bendCache.has(cacheKey)) {
        bendCache.set(cacheKey, new Map());
    }
    const cache = bendCache.get(cacheKey)!;

    const flipPage = ((
        node: BABYLON.TransformNode,
        data: { mesh: BABYLON.Mesh; positions0: XYZ[] }[],
        indices: number[]
    ) => {
        /*
        1. Leave y as it is
        2. The extreme (xe, ze) coordinates follow a function (i.e. a semi circla/ellipse) from (1, 0) to (-1, 0)
        3. All x0 values inbetween follow a curve from (0, 0) to (xe, ze)
        */

        const R_inverse_max = (2 / width) * (floppyness || 0);

        /**
         * Bend the page that both edges are at z=0
         * @param time Time elapsed since start flipping
         * @returns
         */
        const getBendTranslate = (time: number): Map<number, XZ> => {
            const cacheTime = time > msPerFlip / 2 ? msPerFlip - time : time;
            if (cache.has(cacheTime)) {
                return cache.get(cacheTime)!;
            }

            const table: Map<number, XZ> = new Map();

            const r_inverse = (cacheTime / (msPerFlip / 2)) * R_inverse_max;

            if (r_inverse == 0) {
                for (let col = 0; col <= vertices; col++) {
                    table.set(col, [(col / vertices) * width, 0]);
                }
                return table;
            }

            const theta = width * r_inverse;
            const x_c = Math.sin(theta / 2) / r_inverse;
            const z_c = Math.cos(theta / 2) / r_inverse;

            const d_theta = theta / vertices;

            for (let col = 0; col <= vertices / 2; col++) {
                const theta_ = -theta / 2 + col * d_theta;
                const x = x_c + Math.sin(theta_) / r_inverse;
                const z = -z_c + Math.cos(theta_) / r_inverse;
                table.set(col, [x, z]);
                table.set(vertices - col, [2 * x_c - x, z]);
            }

            cache.set(cacheTime, table);

            return table;
        };

        /**
         * Bend the page and rotate it
         * @param time Time since start flipping
         * @returns
         */
        let lastTime: number | undefined = undefined;
        const getTranslate = (
            time: number,
            direction: Direction
        ): Map<number, XZ> => {
            if (lastTime == undefined) {
                lastTime = time;
            }

            if (direction == "right") {
                time = msPerFlip - time;
            }

            const alpha = ((time - lastTime) / msPerFlip) * PI;
            lastTime = time;

            node.rotate(new BABYLON.Vector3(0, 1, 0), alpha);

            const table = getBendTranslate(time % msPerFlip);
            if (direction == "right") {
                const _table = new Map<number, XZ>();
                table.forEach((xz, time) => _table.set(time, [xz[0], -xz[1]]));
                return _table;
            }

            return table;
        };

        return (direction: Direction = "left"): Promise<void> => {
            return new Promise((resolve) => {
                const startTime = Date.now();

                const beforeRender = () => {
                    const deltaTime = Math.min(
                        Date.now() - startTime,
                        msPerFlip
                    );
                    const translate = getTranslate(deltaTime, direction);
                    data.forEach(({ mesh, positions0 }) => {
                        const positions = mesh.getVerticesData(
                            BABYLON.VertexBuffer.PositionKind
                        );
                        if (!positions) {
                            return;
                        }
                        positions0.forEach((xy, i) => {
                            const xz: XZ = translate.get(xy[0])!;
                            positions[3 * i] = xz[0];
                            positions[3 * i + 2] = xz[1];
                        });

                        //Empty array to contain calculated values or normals added
                        var normals: number[] = [];

                        //Calculations of normals added
                        BABYLON.VertexData.ComputeNormals(
                            positions,
                            indices,
                            normals
                        );

                        mesh.setVerticesData(
                            BABYLON.VertexBuffer.PositionKind,
                            positions
                        );
                        mesh.setVerticesData(
                            BABYLON.VertexBuffer.NormalKind,
                            normals
                        );
                    });
                    if (deltaTime == msPerFlip) {
                        scene.unregisterBeforeRender(beforeRender);
                        resolve();
                    }
                };
                scene.registerBeforeRender(beforeRender);
            });
        };
    })(
        node,
        [
            { mesh: frontMesh, positions0: frontPositions0 },
            { mesh: backMesh, positions0: backPositions0 },
        ],
        indices
    );

    const flipLeft = () =>
        flipPage("left").then(() => setTimeout(flipRight, 1000));
    const flipRight = () =>
        flipPage("right").then(() => setTimeout(flipLeft, 1000));

    setTimeout(flipLeft, 1000);

    const update = (dt: number) => {};

    return {};
};

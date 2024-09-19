import * as BABYLON from "babylonjs";

type XYZ = [x: number, y: number, z: number];
type XZ = [x: number, z: number];

type FrontBack = "front" | "back";

const vertices = 100;
const PI = Math.PI;
const flipTexture = true;
const msPerFlip = 1_000;

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

        return {
            positions0,
            indices,
            mesh,
        };
    };

    const {
        mesh: frontMesh,
        positions0: frontPositions0,
        indices,
    } = createPageSide(frontTexture, "front", flipTexture);
    const { mesh: backMesh, positions0: backPositions0 } = createPageSide(
        backTexture,
        "back",
        !flipTexture
    );

    const flipPage = ((
        data: { mesh: BABYLON.Mesh; positions0: XYZ[] }[],
        indices: number[]
    ) => {
        const startTime = Date.now();

        /*
        1. Leave y as it is
        2. The extreme (xe, ze) coordinates follow a function (i.e. a semi circla/ellipse) from (1, 0) to (-1, 0)
        3. All x0 values inbetween follow a curve from (0, 0) to (xe, ze)
        */

        const R_inverse_max = (2 / width) * (floppyness || 0);

        const getR_inverse = (time: number): number => {
            const quadrant = Math.floor(time / (msPerFlip / 2));
            switch (quadrant) {
                case 0:
                    return (time / (msPerFlip / 2)) * R_inverse_max;
                case 1:
                    return (
                        ((msPerFlip - time) / (msPerFlip / 2)) * R_inverse_max
                    );
                case 2:
                    return (
                        (-(time - msPerFlip) / (msPerFlip / 2)) * R_inverse_max
                    );
                case 3:
                    return (
                        (-(2 * msPerFlip - time) / (msPerFlip / 2)) *
                        R_inverse_max
                    );
            }
            return 0;
        };

        /**
         * Bend the page that both edges are at z=0
         * @param time Time elapsed since start flipping
         * @returns
         */
        const getBendTranslate = (time: number): Map<number, XZ> => {
            const table: Map<number, XZ> = new Map();

            const r_inverse = getR_inverse(time);

            if (r_inverse == 0) {
                for (let col = 0; col <= vertices; col++) {
                    const l = col / vertices;
                    table.set(col, [l * width, 0]);
                }
                return table;
            }

            const theta = width * r_inverse;
            const x_c = Math.sin(theta / 2) / r_inverse;
            const z_c = Math.cos(theta / 2) / r_inverse;

            /*
            console.log(
                "r_inverse",
                r_inverse,
                r_inverse ? 1 / r_inverse : Infinity
            );
            console.log("theta", theta);
            console.log("x_c, z_c", x_c, z_c);
            */

            const d_theta = theta / vertices;

            for (let col = 0; col <= vertices / 2; col++) {
                const theta_ = -theta / 2 + col * d_theta;
                const x = x_c + Math.sin(theta_) / r_inverse;
                const z = z_c - Math.cos(theta_) / r_inverse;
                table.set(col, [x, z]);
                table.set(vertices - col, [2 * x_c - x, z]);
            }
            return table;
        };

        /**
         * Bend the page and rotate it
         * @param time Time since start flipping
         * @returns
         */
        const getTranslate = (time: number): Map<number, XZ> => {
            time = time % (2 * msPerFlip);

            const alpha = (time / msPerFlip) * PI;
            const sin_alpha = Math.sin(alpha);
            const cos_alpha = Math.cos(alpha);
            //console.log("alpha", alpha);

            const table = getBendTranslate(time % msPerFlip);

            table.forEach(([x, z], col) => {
                table.set(col, [
                    x * cos_alpha - z * sin_alpha,
                    x * sin_alpha + z * cos_alpha,
                ]);
            });
            return table;
        };

        return () => {
            scene.registerBeforeRender(() => {
                const deltaTime = (Date.now() - startTime) % (2 * msPerFlip);
                const translate = getTranslate(deltaTime);
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
            });
        };
    })(
        [
            { mesh: frontMesh, positions0: frontPositions0 },
            { mesh: backMesh, positions0: backPositions0 },
        ],
        indices
    );

    flipPage();

    const update = (dt: number) => {};

    return {};
};

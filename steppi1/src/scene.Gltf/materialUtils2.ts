import * as BABYLON from "babylonjs";
// import * as BABYLON_MATERIALS from "babylonjs-materials";

export const dummy = 1;

/*
export const applyPerpendicularUVs = (
    mesh: BABYLON.Mesh,
    dominantSide: "X" | "Y" | "Z" | "None" = "None",
    debug = false
) => {
    if (!mesh.geometry) {
        console.warn(`Mesh "${mesh.name}" has no geometry.`);
        return;
    }

    if (!mesh.geometry.isReady()) {
        console.warn(`Geometry for mesh "${mesh.name}" is not ready.`);
        return;
    }

    // Force unique geometry for safety
    mesh.makeGeometryUnique();

    const positions = mesh.getVerticesData(
        BABYLON.VertexBuffer.PositionKind,
        true,
        true,
        true
    );
    const indices = mesh.getIndices();
    if (!positions || !indices) {
        console.warn(
            `Mesh "${mesh.name}" is missing position or index data, skipping.`
        );
        return;
    }

    let uAxis: BABYLON.Vector3, vAxis: BABYLON.Vector3;

    if (dominantSide === "X") {
        uAxis = BABYLON.Vector3.Up(); // Y
        vAxis = BABYLON.Vector3.Forward(); // Z
    } else if (dominantSide === "Y") {
        uAxis = BABYLON.Vector3.Right(); // X
        vAxis = BABYLON.Vector3.Forward(); // Z
    } else if (dominantSide === "Z") {
        uAxis = BABYLON.Vector3.Right(); // X
        vAxis = BABYLON.Vector3.Up(); // Y
    } else {
        return applyFaceBasedUVs(mesh);
    }

    const newUVs: number[] = new Array((positions.length / 3) * 2);

    let minU = Infinity,
        maxU = -Infinity;
    let minV = Infinity,
        maxV = -Infinity;

    const vertex = new BABYLON.Vector3();

    for (let i = 0; i < indices.length; i += 3) {
        for (let j = 0; j < 3; j++) {
            const idx = indices[i + j];
            const posIdx = idx * 3;
            vertex.set(
                positions[posIdx],
                positions[posIdx + 1],
                positions[posIdx + 2]
            );

            const u = BABYLON.Vector3.Dot(vertex, uAxis);
            const v = BABYLON.Vector3.Dot(vertex, vAxis);

            if (u < minU) minU = u;
            if (u > maxU) maxU = u;
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;

            const uvIndex = idx * 2;
            newUVs[uvIndex] = u; // U
            newUVs[uvIndex + 1] = v; // V
        }
    }

    const uRange = maxU - minU;
    const vRange = maxV - minV;

    const safeURange = uRange !== 0 ? uRange : 1e-6;
    const safeVRange = vRange !== 0 ? vRange : 1e-6;

    for (let i = 0; i < newUVs.length; i += 2) {
        newUVs[i] = (newUVs[i] - minU) / safeURange;
        newUVs[i + 1] = (newUVs[i + 1] - minV) / safeVRange;
    }

    if (debug) {
        console.log(`UV ranges for mesh "${mesh.name}":`, {
            minU,
            maxU,
            minV,
            maxV,
        });
        console.log("Normalized UVs:", newUVs);
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, newUVs, true);
};

// Fallback function for face-based UV projection
const applyFaceBasedUVs = (mesh: BABYLON.Mesh) => {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = mesh.getIndices();
    if (!positions || !indices) {
        console.warn(
            `Mesh "${mesh.name}" is missing position or index data, skipping.`
        );
        return;
    }

    const newUVs: number[] = new Array((positions.length / 3) * 2).fill(0);

    for (let i = 0; i < indices.length; i += 3) {
        // Get the indices of the triangle's vertices
        const i0 = indices[i] * 3;
        const i1 = indices[i + 1] * 3;
        const i2 = indices[i + 2] * 3;

        // Get the positions of the triangle's vertices
        const v0 = new BABYLON.Vector3(
            positions[i0],
            positions[i0 + 1],
            positions[i0 + 2]
        );
        const v1 = new BABYLON.Vector3(
            positions[i1],
            positions[i1 + 1],
            positions[i1 + 2]
        );
        const v2 = new BABYLON.Vector3(
            positions[i2],
            positions[i2 + 1],
            positions[i2 + 2]
        );

        // Compute the normal of the triangle
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const normal = BABYLON.Vector3.Cross(edge1, edge2).normalize();

        // Determine UV projection plane based on the normal
        let uAxis: BABYLON.Vector3, vAxis: BABYLON.Vector3;
        if (
            Math.abs(normal.x) > Math.abs(normal.y) &&
            Math.abs(normal.x) > Math.abs(normal.z)
        ) {
            uAxis = BABYLON.Vector3.Up(); // Y
            vAxis = BABYLON.Vector3.Forward(); // Z
        } else if (
            Math.abs(normal.y) > Math.abs(normal.x) &&
            Math.abs(normal.y) > Math.abs(normal.z)
        ) {
            uAxis = BABYLON.Vector3.Right(); // X
            vAxis = BABYLON.Vector3.Forward(); // Z
        } else {
            uAxis = BABYLON.Vector3.Right(); // X
            vAxis = BABYLON.Vector3.Up(); // Y
        }

        // Map UVs for each vertex
        const vertices = [v0, v1, v2];
        for (let j = 0; j < 3; j++) {
            const vertex = vertices[j];
            const u = BABYLON.Vector3.Dot(vertex, uAxis);
            const v = BABYLON.Vector3.Dot(vertex, vAxis);

            const uvIndex = indices[i + j] * 2;
            newUVs[uvIndex] = u; // Assign U
            newUVs[uvIndex + 1] = v; // Assign V
        }
    }

    // Normalize UVs to (0, 0) - (1, 1)
    const minU = Math.min(...newUVs.filter((_, index) => index % 2 === 0));
    const minV = Math.min(...newUVs.filter((_, index) => index % 2 === 1));
    const maxU = Math.max(...newUVs.filter((_, index) => index % 2 === 0));
    const maxV = Math.max(...newUVs.filter((_, index) => index % 2 === 1));

    for (let i = 0; i < newUVs.length; i += 2) {
        newUVs[i] = (newUVs[i] - minU) / (maxU - minU); // Normalize U
        newUVs[i + 1] = (newUVs[i + 1] - minV) / (maxV - minV); // Normalize V
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, newUVs, true);
};
*/

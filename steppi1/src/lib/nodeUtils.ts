import * as BABYLON from "babylonjs";

export function getMeshWorldDimensions(
    mesh: BABYLON.AbstractMesh
): BABYLON.Vector3 | null {
    if (!(mesh instanceof BABYLON.AbstractMesh)) {
        console.warn("Arg is not a mesh; cannot calculate dimensions.");
        return null;
    }

    // Get the bounding info
    const boundingInfo = mesh.getBoundingInfo();
    if (!boundingInfo) {
        console.warn("Bounding info not available for this node.");
        return null;
    }

    // Get the min and max bounds in world space
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    // Calculate dimensions
    const dimensions = max.subtract(min);
    console.log(`World Dimensions of ${mesh.name}:`, dimensions);
    return dimensions;
}

export function getNodeWorldDimensions(
    node: BABYLON.TransformNode
): BABYLON.Vector3 | null {
    // Get all child meshes of the node
    const childMeshes = node.getChildMeshes();

    if (childMeshes.length === 0) {
        console.warn("Node has no child meshes. Cannot calculate dimensions.");
        return null;
    }

    // Initialize bounds
    let min = new BABYLON.Vector3(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY
    );
    let max = new BABYLON.Vector3(
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY
    );

    // Iterate through all child meshes to find the world bounds
    childMeshes.forEach((mesh) => {
        const boundingInfo = mesh.getBoundingInfo();
        if (boundingInfo) {
            min = BABYLON.Vector3.Minimize(
                min,
                boundingInfo.boundingBox.minimumWorld
            );
            max = BABYLON.Vector3.Maximize(
                max,
                boundingInfo.boundingBox.maximumWorld
            );
        }
    });

    // Calculate dimensions
    const dimensions = max.subtract(min);
    console.log(`Node ${node.name} world dimensions:`, dimensions);
    return dimensions;
}

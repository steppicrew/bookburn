import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

export const addDebugGrid = (scene: BABYLON.Scene) => {
    // Create a material for the grid
    const squareMaterial = new BABYLON.StandardMaterial("gridSquare", scene);
    squareMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // White
    squareMaterial.alpha = 0.5;

    // Create the master mesh
    const masterSquare = BABYLON.MeshBuilder.CreatePlane(
        "masterSquare",
        { width: 0.8, height: 0.8, sideOrientation: BABYLON.Mesh.FRONTSIDE },
        scene
    );
    masterSquare.rotation.x = Math.PI / 2;
    masterSquare.position.y = 0.06;

    // showNormals(masterSquare, scene);

    masterSquare.material = squareMaterial; // Assign material to master mesh

    // Doesn't work, dunno why
    // masterSquare.isVisible = false; // Hide the master mesh itself

    // Prepare matrices for thin instances
    const matrices = [];
    for (let y = -20; y < 20; ++y) {
        for (let x = -20; x < 20; ++x) {
            const matrix = BABYLON.Matrix.Translation(x + 0.5, y + 0.5, 0.05);
            matrices.push(matrix);
        }
    }

    masterSquare.thinInstanceAdd(matrices);
};

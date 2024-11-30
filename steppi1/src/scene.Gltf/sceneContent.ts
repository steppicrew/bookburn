import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { getAssetClone } from "./assetLoader";
import { createWallSegments } from "./wallSegments";

const addPerson = (scene: BABYLON.Scene) => {
    // Create a box with dimensions matching a person's height
    const personHeight = 1.7; // Average person height in meters
    const boxWidth = 0.5; // Approximate shoulder width in meters
    const boxDepth = 0.3; // Approximate body thickness in meters

    const personBox = BABYLON.MeshBuilder.CreateBox(
        "personBox",
        {
            height: personHeight,
            width: boxWidth,
            depth: boxDepth,
        },
        scene
    ); //1

    personBox.position.y = personHeight / 2;

    const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue color
    personBox.material = boxMaterial;
};

const renderGrid = (scene: BABYLON.Scene) => {
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

export const sceneContent = async (scene: BABYLON.Scene) => {
    addPerson(scene);

    const WIDTH = 2;
    const HEIGHT = 2.5790634155273438;
    // const DEPTH = 0.17819999903440475;
    const DEPTH = 0.1;

    renderGrid(scene);

    const outline2 = [-3, 1, -2, 2, 5, -3];

    // const outline2 = [6, 6, -6, -6];
    // const outline2 = [2, 2, -2, -2];
    // const outline2 = [4, 2, -4, -2];
    const segments2 = createWallSegments(outline2);

    for (const seg of segments2) {
        if (seg.type === "wall") {
            const instance = await getAssetClone(scene, "building/wall");
            instance.position = new BABYLON.Vector3(seg.cx + 0, 0, seg.cy - 0);
            instance.setPivotPoint(new BABYLON.Vector3(-0.0, 0, 0.0));
            instance.rotate(
                new BABYLON.Vector3(0, 1, 0),
                ((5 - seg.dir) * Math.PI) / 2
            );
        }
        if (seg.type === "corner") {
            const instance = await getAssetClone(
                scene,
                "building/wall-corner-column-small"
            );
            instance.position = new BABYLON.Vector3(
                seg.cx + 0.5,
                0,
                seg.cy - 0.5
            );
            instance.setPivotPoint(new BABYLON.Vector3(-0.5, 0, 0.5));
            console.log(seg.cx, seg.cy, seg.dir, 1 + seg.dir);
            instance.rotate(
                new BABYLON.Vector3(0, 1, 0),
                ((6 - +seg.dir) * Math.PI) / 2
            );

            /*
            let angle = 0.01;
            scene.registerAfterRender(function () {
                instance.rotate(
                    new BABYLON.Vector3(0, 1, 0),
                    angle,
                    BABYLON.Space.LOCAL
                );
            });
            */
        }
    }
};

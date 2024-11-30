import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

export const addPerson = (scene: BABYLON.Scene) => {
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
    );

    personBox.position.y = personHeight / 2;

    const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue color
    personBox.material = boxMaterial;
};

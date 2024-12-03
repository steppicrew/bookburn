import * as BABYLON from "babylonjs";

import { SerializedMaterial } from "./materialUtils";

const createMaterialFromColormap = (
    scene: BABYLON.Scene,
    columnIndex: number,
    rowIndex: number
): BABYLON.StandardMaterial => {
    // Create a material
    const material = new BABYLON.StandardMaterial("colormapMaterial", scene);

    // Load the colormap texture
    const colormap = new BABYLON.Texture(
        "assets/kenney_building-kit/Textures/colormap.png",
        scene
    );

    // Set UV scaling for each grid cell
    colormap.uScale = 1 / 16; // Divide texture into 16 horizontal columns
    colormap.vScale = 1 / 4; // Divide texture into 4 vertical rows

    // Set UV offsets to target the specific cell
    colormap.uOffset = columnIndex / 16; // Horizontal offset for the column
    colormap.vOffset = 1 - (rowIndex + 1) / 4; // Vertical offset for the row (flip Y-axis)

    // Apply the texture to the material
    material.diffuseTexture = colormap; // Use diffuseTexture for StandardMaterial
    material.specularColor = new BABYLON.Color3(0, 0, 0); // Remove highlights

    return material;
};

const glassMaterial: SerializedMaterial = {
    type: "PBRMaterial",
    name: "glass",
    alpha: 1,
    albedoColor: [1, 1, 1],
    albedoTexture: {
        name: "glass (Base Color)",
        url: "assets/kenney_building-kit/Textures/colormap.png",
        uScale: 1,
        vScale: 1,
        uOffset: 0,
        vOffset: 0,
    },
    metallic: 0,
    roughness: 1,
    metallicRoughnessTexture: null,
    emissiveColor: [0, 0, 0],
    emissiveTexture: null,
    bumpTexture: null,
    environmentTexture: null,
    transparencyMode: 0,
};

const colormapMaterial: SerializedMaterial = {
    type: "PBRMaterial",
    name: "colormap",
    alpha: 1,
    albedoColor: [1, 1, 1],
    albedoTexture: {
        name: "colormap (Base Color)",
        url: "assets/kenney_building-kit/Textures/colormap.png",
        uScale: 1,
        vScale: 1,
        uOffset: 0,
        vOffset: 0,
    },
    metallic: 0,
    roughness: 1,
    metallicRoughnessTexture: null,
    emissiveColor: [0, 0, 0],
    emissiveTexture: null,
    bumpTexture: null,
    environmentTexture: null,
    transparencyMode: 0,
};

export const kenneyMaterials: Record<string, SerializedMaterial> = {
    glass: glassMaterial,
    colormap: colormapMaterial,
};

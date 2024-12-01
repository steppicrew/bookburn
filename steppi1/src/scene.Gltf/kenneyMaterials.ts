import { SerializedMaterial } from "./materialUtils";

const glassMaterial: SerializedMaterial = {
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

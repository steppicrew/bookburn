import * as BABYLON from "babylonjs";

interface SerializedTexture {
    name: string;
    url: string | null;
    uScale: number;
    vScale: number;
    uOffset: number;
    vOffset: number;
}

interface SerializedMaterialBase {
    type:
        | "PBRMaterial"
        | "StandardMaterial"
        | "ShadowOnlyMaterial"
        | "GridMaterial"
        | "LiquidMaterial"
        | "MultiMaterial"
        | "NodeMaterial"
        | "ShaderMaterial"
        | "BackgroundMaterial";
    name: string;
    alpha: number;
}

interface SerializedPBRMaterial extends SerializedMaterialBase {
    type: "PBRMaterial";
    albedoColor: [number, number, number] | null;
    albedoTexture: SerializedTexture | null;
    metallic: number | null;
    roughness: number | null;
    metallicRoughnessTexture: SerializedTexture | null;
    emissiveColor: [number, number, number] | null;
    emissiveTexture: SerializedTexture | null;
    bumpTexture: SerializedTexture | null;
    environmentTexture: SerializedTexture | null;
    transparencyMode: number | null;
}

interface SerializedStandardMaterial extends SerializedMaterialBase {
    type: "StandardMaterial";
    diffuseColor: [number, number, number] | null;
    diffuseTexture: SerializedTexture | null;
    specularColor: [number, number, number] | null;
    specularTexture: SerializedTexture | null;
    emissiveColor: [number, number, number] | null;
    emissiveTexture: SerializedTexture | null;
    bumpTexture: SerializedTexture | null;
}

export type SerializedMaterial =
    | SerializedPBRMaterial
    | SerializedStandardMaterial;

export const serializeMaterial = (
    material: BABYLON.Material
): SerializedMaterial => {
    const serializeTexture = (
        texture: BABYLON.BaseTexture | null
    ): SerializedTexture | null => {
        if (!texture) return null;

        // Check if it's a Texture (not all BaseTextures have scale/offset)
        if (texture instanceof BABYLON.Texture) {
            return {
                name: texture.name,
                url: texture.url || null, // Only Textures have `url`
                uScale: texture.uScale,
                vScale: texture.vScale,
                uOffset: texture.uOffset,
                vOffset: texture.vOffset,
            };
        }

        // Handle cases for other BaseTexture types (if needed)
        return {
            name: texture.name,
            url: null, // Non-Texture BaseTextures do not have `url`
            uScale: 1, // Default scale
            vScale: 1,
            uOffset: 0, // Default offset
            vOffset: 0,
        };
    };

    if (material instanceof BABYLON.PBRMaterial) {
        return {
            type: "PBRMaterial",
            name: material.name,
            alpha: material.alpha,
            albedoColor: material.albedoColor
                ? (material.albedoColor.asArray() as [number, number, number])
                : null,
            albedoTexture: serializeTexture(material.albedoTexture),
            metallic: material.metallic,
            roughness: material.roughness,
            metallicRoughnessTexture: serializeTexture(
                material.metallicTexture
            ),
            emissiveColor: material.emissiveColor
                ? (material.emissiveColor.asArray() as [number, number, number])
                : null,
            emissiveTexture: serializeTexture(material.emissiveTexture),
            bumpTexture: serializeTexture(material.bumpTexture),
            environmentTexture: serializeTexture(material.reflectionTexture),
            transparencyMode: material.transparencyMode,
        };
    }

    if (material instanceof BABYLON.StandardMaterial) {
        return {
            type: "StandardMaterial",
            name: material.name,
            alpha: material.alpha,
            diffuseColor: material.diffuseColor
                ? (material.diffuseColor.asArray() as [number, number, number])
                : null,
            diffuseTexture: serializeTexture(material.diffuseTexture),
            specularColor: material.specularColor
                ? (material.specularColor.asArray() as [number, number, number])
                : null,
            specularTexture: serializeTexture(material.specularTexture),
            emissiveColor: material.emissiveColor
                ? (material.emissiveColor.asArray() as [number, number, number])
                : null,
            emissiveTexture: serializeTexture(material.emissiveTexture),
            bumpTexture: serializeTexture(material.bumpTexture),
        };
    }

    throw new Error(`Unsupported material type: ${material.getClassName()}`);
};

export const unserializeMaterial = (
    scene: BABYLON.Scene,
    json: SerializedMaterial,
    newMaterialName?: string
): BABYLON.Material => {
    const deserializeTexture = (
        textureData: SerializedTexture | null
    ): BABYLON.BaseTexture | null => {
        if (!textureData) return null;

        const texture = new BABYLON.Texture(textureData.url || "", scene);
        texture.uScale = textureData.uScale;
        texture.vScale = textureData.vScale;
        texture.uOffset = textureData.uOffset;
        texture.vOffset = textureData.vOffset;
        return texture;
    };

    if (json.type === "PBRMaterial") {
        const material = new BABYLON.PBRMaterial(
            newMaterialName ?? json.name,
            scene
        );
        material.alpha = json.alpha;
        material.albedoColor = json.albedoColor
            ? BABYLON.Color3.FromArray(json.albedoColor)
            : BABYLON.Color3.Black(); // Default to black
        material.albedoTexture = deserializeTexture(json.albedoTexture);
        material.metallic = json.metallic;
        material.roughness = json.roughness;
        material.metallicTexture = deserializeTexture(
            json.metallicRoughnessTexture
        );
        material.emissiveColor = json.emissiveColor
            ? BABYLON.Color3.FromArray(json.emissiveColor)
            : BABYLON.Color3.Black(); // Default to black
        material.emissiveTexture = deserializeTexture(json.emissiveTexture);
        material.bumpTexture = deserializeTexture(json.bumpTexture);
        material.reflectionTexture = deserializeTexture(
            json.environmentTexture
        );
        material.transparencyMode =
            json.transparencyMode !== undefined ? json.transparencyMode : null;
        return material;
    }

    if (json.type === "StandardMaterial") {
        const material = new BABYLON.StandardMaterial(
            newMaterialName ?? json.name,
            scene
        );
        material.alpha = json.alpha;
        material.diffuseColor = json.diffuseColor
            ? BABYLON.Color3.FromArray(json.diffuseColor)
            : BABYLON.Color3.White(); // Default to white
        material.diffuseTexture = deserializeTexture(json.diffuseTexture);
        material.specularColor = json.specularColor
            ? BABYLON.Color3.FromArray(json.specularColor)
            : BABYLON.Color3.Black(); // Default to black
        material.specularTexture = deserializeTexture(json.specularTexture);
        material.emissiveColor = json.emissiveColor
            ? BABYLON.Color3.FromArray(json.emissiveColor)
            : BABYLON.Color3.Black(); // Default to black
        material.emissiveTexture = deserializeTexture(json.emissiveTexture);
        material.bumpTexture = deserializeTexture(json.bumpTexture);
        return material;
    }

    throw new Error(`Unsupported material type: ${(json as any).type}`);
};

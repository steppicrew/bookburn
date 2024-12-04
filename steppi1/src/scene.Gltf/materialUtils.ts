import * as BABYLON from "babylonjs";
// import * as BABYLON_MATERIALS from "babylonjs-materials";

export const applyPlanarProjection = (mesh: BABYLON.AbstractMesh) => {
    const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    if (!uvs || !positions) {
        console.error("UV or position data not found on mesh.");
        return;
    }

    const newUVs = [];
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        newUVs.push(x, z); // Map X and Z to U and V
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, newUVs);
};

// Very hacky, not really working
export const applyPerpendicularUVs = (mesh: BABYLON.AbstractMesh) => {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (!positions) {
        console.warn(`Mesh "${mesh.name}" has no position data, skipping.`);
        return;
    }

    const newUVs: number[] = [];
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        // Use the largest absolute axis to determine UVs (perpendicular projection)
        if (Math.abs(x) > Math.abs(y) && Math.abs(x) > Math.abs(z)) {
            // Perpendicular to X-axis
            newUVs.push(z, y);
        } else if (Math.abs(y) > Math.abs(x) && Math.abs(y) > Math.abs(z)) {
            // Perpendicular to Y-axis
            newUVs.push(x, z);
        } else {
            // Perpendicular to Z-axis
            newUVs.push(x, y);
        }
    }

    // Set the new UVs
    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, newUVs);
};

/*
export const glassMaterial_OLD = (scene: BABYLON.Scene, name: string) => {
    let material = scene.getMaterialByName(name) as BABYLON.PBRMaterial;
    if (!material) {
        material = new BABYLON.PBRMaterial(name, scene);
        material.indexOfRefraction = 0.52;
        material.alpha = 0.5;
        material.directIntensity = 0.0;
        material.environmentIntensity = 0.7;
        material.cameraExposure = 0.66;
        material.cameraContrast = 1.66;
        material.microSurface = 1;
        material.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        material.albedoColor = new BABYLON.Color3(0.8, 0.9, 0.95);
        material.emissiveColor = new BABYLON.Color3(
            0.203648046,
            0.215670541,
            0.280335039
        );
    }
    return material;
};
*/

export const glassMaterial = (scene: BABYLON.Scene, name: string) => {
    let material = scene.getMaterialByName(name) as BABYLON.PBRMaterial;
    if (!material) {
        material = new BABYLON.PBRMaterial(name, scene);
        material.alpha = 0.99;
        const glassMaterialPlugin = new GlassMaterialPlugin(material);
        material.freeze();

        material.onDisposeObservable.add(() => {
            console.log("Removing glassMaterialPlugin");
            glassMaterialPlugin.dispose();
        });
    }

    return material;
};

const ensureTexture = (
    scene: BABYLON.Scene,
    name: string,
    texturePath: string,
    initTexture?: (texture: BABYLON.Texture) => void
): BABYLON.Texture => {
    name = `${name}__texture`;
    let texture = scene.getTextureByName(name) as BABYLON.Texture;
    if (!texture) {
        texture = new BABYLON.Texture(texturePath, scene);
        texture.name = name;
        initTexture?.(texture);
    }
    return texture;
};

const makeTexturedMaterial = (
    scene: BABYLON.Scene,
    name: string,
    texturePath: string,
    initTexture?: (texture: BABYLON.Texture) => void
): BABYLON.StandardMaterial => {
    const material = new BABYLON.StandardMaterial(name, scene);
    material.specularColor = BABYLON.Color3.Black();
    material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    material.diffuseTexture = ensureTexture(
        scene,
        name,
        texturePath,
        initTexture
    );
    return material;
};

export const makeWoodMaterial = (
    scene: BABYLON.Scene,
    name: string
): BABYLON.StandardMaterial =>
    makeTexturedMaterial(
        scene,
        name,
        "assets/scene.Gltf/old-wood-planks-256x256.png"
    );

export const makeWallMaterial = (
    scene: BABYLON.Scene,
    name: string
): BABYLON.StandardMaterial =>
    makeTexturedMaterial(
        scene,
        name,
        // "assets/scene.Gltf/wall/irregular-concrete-wall-256x256.png",
        // "assets/scene.Gltf/wall/white-marble-256x256.png",
        "assets/scene.Gltf/wall/dirty-concrete-256x256.png",
        (texture) => (texture.level = 2)
    );

export const makeRoofTilesMaterial = (
    scene: BABYLON.Scene,
    name: string
): BABYLON.StandardMaterial =>
    makeTexturedMaterial(
        scene,
        name,
        "assets/scene.Gltf/roof-tiles-256x256.png"
    );

export const makeGroundMaterial = (
    scene: BABYLON.Scene,
    name: string
): BABYLON.StandardMaterial =>
    makeTexturedMaterial(
        scene,
        name,
        "assets/scene.Gltf/ground/pebbles-ground-path-256x256.png",
        // "assets/scene.Gltf/ground/ground-tile-256x256.png",
        (texture) => {
            texture.uScale = texture.vScale = 100 / 2;
        }
    );

export const makePlainMaterial = (
    scene: BABYLON.Scene,
    name: string,
    r: number,
    g: number,
    b: number
): BABYLON.StandardMaterial => {
    const material = new BABYLON.StandardMaterial(name, scene);
    material.diffuseColor = new BABYLON.Color3(r, g, b);
    material.specularColor = BABYLON.Color3.Black();
    material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    return material;
};

export class GlassMaterialPlugin extends BABYLON.MaterialPluginBase {
    constructor(material: BABYLON.Material) {
        super(material, "GlassMaterial", 200, { GlassMaterialEnabled: false });

        console.log("Adding glassMaterialPlugin");

        // Enable the plugin by default
        this.isEnabled = true;
    }

    private _isEnabled = false;

    // Enable or disable the plugin
    get isEnabled() {
        return this._isEnabled;
    }

    set isEnabled(enabled: boolean) {
        if (this._isEnabled === enabled) {
            return;
        }
        this._isEnabled = enabled;
        this.markAllDefinesAsDirty();
        this._enable(this._isEnabled);
    }

    prepareDefines(
        defines: BABYLON.MaterialDefines,
        scene: BABYLON.Scene,
        mesh: BABYLON.AbstractMesh
    ) {
        defines["GlassMaterialEnabled"] = this._isEnabled;
    }

    getClassName() {
        return "GlassMaterialPlugin";
    }

    isCompatible(shaderLanguage: BABYLON.ShaderLanguage) {
        switch (shaderLanguage) {
            case BABYLON.ShaderLanguage.GLSL:
                return true;
            default:
                console.log("GlassMaterialPlugin: GLSL required");
                return false;
        }
    }

    getCustomCode(shaderType: "vertex" | "fragment") {
        if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_MAIN_END: `
                    // Compute the Fresnel effect
                    vec3 viewDirection = normalize(vEyePosition.xyz - vPositionW);
                    float normalDotView = dot(vNormalW, viewDirection);
                    float fresnelEffect = pow(1.0 - normalDotView, 1.1);
                    float fs = clamp(1.0 - fresnelEffect, 0.0, 1.0);

                    // Compute the first refraction vector and light modulation
                    vec3 refractionVector1 = 1.51 * refract(vNormalW, normalize(vec3(100.0) - vPositionW), 1.2);
                    float refractionLength1 = length(refractionVector1 * 0.1);
                    float lightModulation1 = refractionLength1 * 1.2 + min((refractionVector1.y + abs(refractionVector1.x)), 
                        min(sin(refractionVector1.y), cos(0.01 * refractionVector1.x))) * 0.5 + 1.5;
                    float l1 = sin(lightModulation1);

                    // Compute the second refraction vector and light modulation
                    vec3 refractionVector2 = 2.151 * refract(vNormalW, viewDirection * 2.0, 1.15);
                    float refractionLength2 = length(refractionVector2 * 0.1);
                    float lightModulation2 = refractionLength2 * 1.2 + min((refractionVector2.y + abs(refractionVector2.y)), 
                        min(sin(refractionVector2.z), cos(0.01 * refractionVector2.x))) * 0.5 + 1.5;
                    float l2 = clamp(sin(lightModulation2) * 0.5, 0.0, 1.0);

                    // Combine the results to compute the final color
                    // *** Changed from vec3(1.0) * l2
                    vec3 baseColor1 = vec3(0.8, 0.8, 1.0) * (1.0 - l2); //  + gl_FragColor.xyz;
                    // *** Changed from 12.0 to 2.0
                    float alpha1 = pow(l1, 5.0) * 0.4 + pow(l2 * 0.83 + (1.0 - fs), 2.0) * 0.3 + 0.3;

                    // Output the final fragment color
                    gl_FragColor = vec4(baseColor1, alpha1);
            `,
            };
        }
        return null;
    }
}

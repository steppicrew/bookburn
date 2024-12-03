import * as BABYLON from "babylonjs";
// import * as BABYLON_MATERIALS from "babylonjs-materials";

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

export const createMaterialFromKenneyBuildingKitColormap = (
    scene: BABYLON.Scene,
    name: string,
    columnIndex: number,
    rowIndex: number
): BABYLON.StandardMaterial => {
    // Create a material
    const material = new BABYLON.StandardMaterial(name, scene);

    const textureName = `${name}__texture`;
    let colormap = scene.getTextureByName(textureName) as BABYLON.Texture;
    if (!colormap) {
        colormap = new BABYLON.Texture(
            "assets/kenney_building-kit/Textures/colormap.png",
            scene
        );
        colormap.name = textureName;

        // Set UV scaling for each grid cell
        colormap.uScale = 1 / 16; // Divide texture into 16 horizontal columns
        colormap.vScale = 1 / 4; // Divide texture into 4 vertical rows
    }

    // Set UV offsets to target the specific cell
    colormap.uOffset = columnIndex / 16; // Horizontal offset for the column
    colormap.vOffset = 1 - (rowIndex + 1) / 4; // Vertical offset for the row (flip Y-axis)

    // Apply the texture to the material
    material.diffuseTexture = colormap; // Use diffuseTexture for StandardMaterial
    material.specularColor = BABYLON.Color3.Black(); // Remove highlights
    material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    return material;
};

export const createPlainMaterial = (
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

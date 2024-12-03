import * as BABYLON from "babylonjs";
// import * as BABYLON_MATERIALS from "babylonjs-materials";

export const glassMaterial = (scene: BABYLON.Scene, name: string) => {
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

        /* 
        // Adapted from https://www.babylonjs-playground.com/#9AB3AV#9
        // But doesn't work :-(
        // Needs: npm install babylonjs-materials
        material = new BABYLON_MATERIALS.CustomMaterial(name, scene);
        material.alpha = 0.1;
        material.Fragment_Before_FragColor(`
            float fs = min(1.0, max(0.0, 1.0 - pow(dot(vNormalW, normalize((vEyePosition.xyz) - vPositionW)), 1.1)));

            vec3 f1 = 1.51 * refract(vNormalW, normalize(vec3(100.0) - vPositionW), 1.2);
            float l1 = sin(length(f1 * 0.1) * 1.2 + min((f1.y + abs(f1.x)), min(sin(f1.y), cos(0.01 * f1.x))) * 0.5 + 1.5) * 0.5;

            vec3 f2 = 2.151 * refract(vNormalW, normalize((vEyePosition.xyz) - vPositionW) * 2.0, 1.15);
            float l2 = sin(length(f2 * 0.1) * 1.2 + min((f2.y + abs(f2.y)), min(sin(f2.z), cos(0.01 * f2.x))) * 0.5 + 1.5) * 0.5;
            l2 = min(1.0, max(0.0, l2));

            color = vec4(vec3(1.0) * l2 + color.xyz, pow(l1, 5.0) + pow(l2 * 0.83 + (1.0 - fs), 12.0) * 0.5);
        `);
        material.backFaceCulling = true;
        */
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

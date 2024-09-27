import * as BABYLON from "babylonjs";

export const setLights = (
    scene: BABYLON.Scene,
    ...materials: BABYLON.ShaderMaterial[]
) => {
    const lights = scene.lights; // Get all lights in the scene

    const lightPositions: number[] = [];
    const lightDirections: number[] = [];
    const lightPositionsColors: number[] = [];
    const lightDirectionsColors: number[] = [];
    const lightPositionsIntensities: number[] = [];
    const lightDirectionsIntensities: number[] = [];

    lights.forEach((light) => {
        // Handle PointLight and SpotLight (which have positions)
        if (
            light instanceof BABYLON.PointLight ||
            light instanceof BABYLON.SpotLight
        ) {
            lightPositions.push(
                light.position.x,
                light.position.y,
                light.position.z
            );
            // Flatten the light color (Color3 -> Array of floats)
            lightPositionsColors.push(
                light.diffuse.r,
                light.diffuse.g,
                light.diffuse.b
            );
            // Add light intensity
            lightPositionsIntensities.push(light.intensity);
        }
        // Handle DirectionalLight and HemisphericLight (which have directions)
        else if (
            light instanceof BABYLON.DirectionalLight ||
            light instanceof BABYLON.HemisphericLight
        ) {
            lightDirections.push(
                light.direction.x,
                light.direction.y,
                light.direction.z
            );
            // Flatten the light color (Color3 -> Array of floats)
            lightDirectionsColors.push(
                light.diffuse.r,
                light.diffuse.g,
                light.diffuse.b
            );
            // Add light intensity
            lightDirectionsIntensities.push(light.intensity);
        }
    });

    materials.forEach((material) => {
        // Pass flattened arrays to the shader
        material.setArray3("lightPositions", lightPositions);
        material.setArray3("lightPositionsColors", lightPositionsColors);
        material.setFloats(
            "lightPositionsIntensities",
            lightPositionsIntensities
        );
        material.setInt("numLightsPositions", lightPositionsIntensities.length); // Pass the number of lights

        material.setArray3("lightDirections", lightDirections);
        material.setArray3("lightDirectionsColors", lightDirectionsColors);
        material.setFloats(
            "lightDirectionsIntensities",
            lightDirectionsIntensities
        );
        material.setInt(
            "numLightsDirections",
            lightDirectionsIntensities.length
        ); // Pass the number of lights
    });
    console.log("setLights", materials);
};

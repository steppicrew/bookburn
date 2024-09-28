import * as BABYLON from "babylonjs";
import { UpdateFn } from "./sceneUtils";

export const setLights = (
    scene: BABYLON.Scene
): { update: UpdateFn; uniformBuffer: BABYLON.UniformBuffer } => {
    const uniformBuffer = new BABYLON.UniformBuffer(scene.getEngine());

    // std140 layout aligns Vec3 on 4 floats (each Vec3 is represented as a Vec4)
    uniformBuffer.addUniform("lightPositions", 4, 10); // 10 Vec3 (padded)
    uniformBuffer.addUniform("lightPositionsColors", 4, 10); // 10 Vec3 (padded)
    uniformBuffer.addUniform("lightPositionsIntensities", 1, 10); // 10 floats
    uniformBuffer.addUniform("lightPositionsNum", 1); // 1 int

    uniformBuffer.addUniform("lightDirections", 4, 10); // 10 Vec3 (padded)
    uniformBuffer.addUniform("lightDirectionsColors", 4, 10); // 10 Vec3 (padded)
    uniformBuffer.addUniform("lightDirectionsIntensities", 1, 10); // 10 floats
    uniformBuffer.addUniform("lightDirectionsNum", 1); // 1 int

    uniformBuffer.update();

    const update = () => {
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
                    light.position.z,
                    0 // Padding for std140
                );
                // Flatten the light color (Color3 -> Array of floats)
                lightPositionsColors.push(
                    light.diffuse.r,
                    light.diffuse.g,
                    light.diffuse.b,
                    0 // Padding for std140
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
                    light.direction.z,
                    0 // Padding for std140
                );
                // Flatten the light color (Color3 -> Array of floats)
                lightDirectionsColors.push(
                    light.diffuse.r,
                    light.diffuse.g,
                    light.diffuse.b,
                    0 // Padding for std140
                );
                // Add light intensity
                lightDirectionsIntensities.push(light.intensity);
            }
        });

        // Pass flattened arrays to the shader
        uniformBuffer.updateArray("lightPositions", lightPositions);
        uniformBuffer.updateArray("lightPositionsColors", lightPositionsColors);
        uniformBuffer.updateArray(
            "lightPositionsIntensities",
            lightPositionsIntensities
        );
        uniformBuffer.updateInt(
            "lightPositionsNum",
            lightPositionsIntensities.length
        ); // Pass the number of lights

        uniformBuffer.updateArray("lightDirections", lightDirections);
        uniformBuffer.updateArray(
            "lightDirectionsColors",
            lightDirectionsColors
        );
        uniformBuffer.updateArray(
            "lightDirectionsIntensities",
            lightDirectionsIntensities
        );
        uniformBuffer.updateInt(
            "lightDirectionsNum",
            lightDirectionsIntensities.length
        ); // Pass the number of lights

        uniformBuffer.update();
    };

    return { update, uniformBuffer };
};

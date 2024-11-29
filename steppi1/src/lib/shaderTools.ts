import * as BABYLON from "babylonjs";
import { UpdateWrapper } from "./sceneUtils";

export const setLights = (() => {
    let _uniformBuffer: BABYLON.UniformBuffer | undefined = undefined;
    let _currentUpdate: (() => void) | undefined = undefined;

    const updateBuffer = (
        scene: BABYLON.Scene,
        uniformBuffer: BABYLON.UniformBuffer
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
                const sign = light instanceof BABYLON.DirectionalLight ? -1 : 1;
                lightDirections.push(
                    sign * light.direction.x,
                    sign * light.direction.y,
                    sign * light.direction.z,
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

    const getUniformBuffer = (
        scene: BABYLON.Scene,
        updates?: UpdateWrapper
    ) => {
        if (!_uniformBuffer) {
            const uniformBuffer = new BABYLON.UniformBuffer(scene.getEngine());
            _uniformBuffer = uniformBuffer;

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
        }
        if (updates) {
            const _thisUpdate = () => {
                if (_currentUpdate === undefined) {
                    _currentUpdate = _thisUpdate;
                }
                if (_currentUpdate === _thisUpdate) {
                    updateBuffer(scene, _uniformBuffer!);
                }
            };
            updates.add(_thisUpdate);
            updates.onRemove(_thisUpdate, () => {
                if (_currentUpdate === _thisUpdate) {
                    _currentUpdate = undefined;
                }
            });
        }
        return _uniformBuffer;
    };

    return getUniformBuffer;
})();

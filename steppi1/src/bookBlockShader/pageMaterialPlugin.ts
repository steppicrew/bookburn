import { MaterialPluginBase } from "babylonjs/Materials/materialPluginBase";
import {
    UniformBuffer,
    Material,
    Scene,
    AbstractEngine,
    SubMesh,
    Effect,
    ShaderLanguage,
    Nullable,
} from "babylonjs";
import vertexShader from "./shaders/book-vertexShader.glsl";

export class CustomMaterialPlugin extends MaterialPluginBase {
    private _materialUniformBuffer: UniformBuffer;
    private _sceneUniformBuffer: UniformBuffer;

    constructor(material: Material) {
        super(material, "CustomMaterialPlugin", 200);

        const engine: AbstractEngine = material.getScene().getEngine();

        // Initialize uniform buffers with the engine
        this._materialUniformBuffer = new UniformBuffer(
            engine,
            undefined,
            true,
            "Material"
        );
        this._sceneUniformBuffer = new UniformBuffer(
            engine,
            undefined,
            true,
            "Scene"
        );

        // Define uniforms for the Material uniform buffer
        this._materialUniformBuffer.addUniform("diffuseColor", 4);
        this._materialUniformBuffer.addUniform("reflectionColor", 4);
        this._materialUniformBuffer.addUniform("refractionColor", 4);
        this._materialUniformBuffer.addUniform("emissiveColor", 4);

        // Define uniforms for the Scene uniform buffer
        this._sceneUniformBuffer.addUniform("viewProjection", 16);
        this._sceneUniformBuffer.addUniform("view", 16);
        this._sceneUniformBuffer.addUniform("projection", 16);
        this._sceneUniformBuffer.addUniform("eyePosition", 4);
    }

    // Updated bindForSubMesh method with correct signature
    bindForSubMesh(
        uniformBuffer: UniformBuffer,
        scene: Scene,
        engine: AbstractEngine,
        subMesh: SubMesh
    ): void {
        // Update uniform buffers with new values before binding
        this._materialUniformBuffer.update();
        this._sceneUniformBuffer.update();

        // Get the effect for the current subMesh
        const effect = subMesh.effect;

        if (effect) {
            // Bind the uniform buffers to the effect
            this._materialUniformBuffer.bindToEffect(effect, "Material");
            this._sceneUniformBuffer.bindToEffect(effect, "Scene");
        }
    }

    // Corrected getCustomCode method with the correct return type
    getCustomCode(
        shaderType: string,
        shaderLanguage?: ShaderLanguage
    ): Nullable<{ [pointName: string]: string }> {
        const customShaderCode: { [pointName: string]: string } = {};

        if (shaderType === "vertex") {
            // Custom GLSL vertex shader code
            customShaderCode[shaderType] = vertexShader;
        }

        return customShaderCode;
    }

    // This method is called when the plugin is disposed of
    dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
        this._materialUniformBuffer.dispose();
        this._sceneUniformBuffer.dispose();
    }
}

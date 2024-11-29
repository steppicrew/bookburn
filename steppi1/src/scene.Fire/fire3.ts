import * as BABYLON from "babylonjs";

import vertexShader from "./shaders/fire3-vertexShader.glsl";
import fragmentShader from "./shaders/fire3-fragmentShader.glsl";

// https://www.babylonjs-playground.com/#1KWR9W#1
// Simpler:
// https://www.babylonjs-playground.com/#7IM02G#0

// @from https://medium.com/@dirkk/campfire-vr-fa654d15e92a

// @from https://www.shadertoy.com/view/XsXSWS

export function makeCreateFire(
    scene: BABYLON.Scene
): (particles?: number, size?: number) => BABYLON.Mesh {
    const shader = "shader" + Date.now() + Math.random();

    BABYLON.Effect.ShadersStore[`${shader}VertexShader`] = vertexShader;
    BABYLON.Effect.ShadersStore[`${shader}FragmentShader`] = fragmentShader;

    const materials: BABYLON.ShaderMaterial[] = [];

    scene.registerBeforeRender(() => {
        const time = performance.now() * 0.0005;
        materials.forEach((material) => {
            material.setFloat("time", time);
        });
    });

    const createMaterial = (mesh: BABYLON.Mesh) => {
        // Create a shared shader material
        const shaderMaterial = new BABYLON.ShaderMaterial(
            `fireShaderInstance_${mesh.uniqueId}`,
            scene,
            shader,
            {
                attributes: ["position"],
                uniforms: ["time", "worldViewProjection"],
            }
        );

        // Configure material properties
        shaderMaterial.backFaceCulling = false;
        // FIXME shaderMaterial.transparent = true;
        shaderMaterial.needDepthPrePass = true;

        // shaderMaterial.alphaBlending = true;

        // Set the blend mode to additive
        // shaderMaterial.alphaMode = BABYLON.Constants.ALPHA_ADD;

        // Clone the shared shader material for this mesh instance
        const material = shaderMaterial.clone(
            `fireShaderInstance_${mesh.uniqueId}`
        );

        materials.push(material);

        // meshMaterial.setFloat("size", size);
        // meshMaterial.setFloat("yMax", 0.3 + Math.PI * size);

        return material;
    };

    return function createFireNode(
        particles: number = 1,
        size: number = 0.5
    ): BABYLON.Mesh {
        const mesh = BABYLON.MeshBuilder.CreatePlane("fire3", {}, scene);

        scene.addMesh(mesh);

        mesh.material = createMaterial(mesh);
        mesh.material.alpha = 0.5;

        // mesh.material = new BABYLON.StandardMaterial("dummy", scene);
        // mesh.material.

        mesh.position.y += 1;
        mesh.scaling = new BABYLON.Vector3(5, 5, 5);

        return mesh;
    };

    /* FIXME: Dispose:
            mesh.dispose();
            mesh.material.dispose();
        */
}

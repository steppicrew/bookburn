import * as BABYLON from "babylonjs";

import { makeConsoleLogger } from "../scene.Gltf/ConsoleLogger";

const cl = makeConsoleLogger("disposeScene", true);

export const disposeScene = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    // Dispose of all meshes except the XR camera
    scene.meshes.slice().forEach((mesh) => {
        // Ensure we do not dispose the camera or other important components
        if (mesh instanceof BABYLON.Camera) {
            // FIXME: Can this happen??????
            cl.log(`Skipping camera mesh`);
            return;
        }
        cl.log(`Disposing mesh ${mesh.name}`);
        mesh.dispose();
    });

    // Dispose all particle systems
    scene.particleSystems.slice().forEach((particleSystem) => {
        cl.log(`Disposing particle system ${particleSystem.name}`);
        particleSystem.dispose();
    });

    // Dispose all lights
    scene.lights.slice().forEach((light) => {
        cl.log(`Disposing light ${light.name}`);
        light.dispose();
    });

    scene.materials.slice().forEach((material) => {
        if (material instanceof BABYLON.ShaderMaterial) {
            cl.log(`Disposing shader material: ${material.name}`);
            material.dispose(true, true);
        } else {
            cl.log(`Disposing material: ${material.name}`);
            material.dispose();
        }
    });

    // Dispose all textures, except environmentTexture
    scene.textures.slice().forEach((texture) => {
        if (texture === scene.environmentTexture) {
            cl.log(`Skipping texture mesh ${texture.name}`);
            return;
        }
        cl.log(`Disposing texture ${texture.name}`);
        texture.dispose();
    });

    // Dispose all post-processes (if any)
    scene.postProcesses.slice().forEach((postProcess) => {
        cl.log(`Disposing postProcess ${postProcess.name}`);
        postProcess.dispose();
    });

    // If you have any custom render targets or shader effects, dispose them here
    scene.customRenderTargets.slice().forEach((renderTarget) => {
        cl.log(`Disposing renderTarget ${renderTarget.name}`);
        renderTarget.dispose();
    });

    scene.getNodes().forEach((node) => {
        if (node instanceof BABYLON.Camera) {
            cl.log(`Skipping camera ${node.id}`);
            return;
        }
        cl.log(`Disposing node ${node.name}`);
        node.dispose();
    });

    scene.getEngine().releaseEffects();
    BABYLON.Effect.ResetCache();

    cl.log(`Remaining meshes: ${scene.meshes.map((m) => m.name)}`);
    cl.log(`Remaining nodes: ${scene.getNodes().map((n) => n.name)}`);

    /*
    // Clean up multi-canvas scenarios if using multiple viewports
    if (scene.activeCameras) {
        scene.activeCameras.slice().forEach((camera) => {
            if (camera !== xrHelper.baseExperience.camera) {
                camera.dispose();
            }
        });
    }
    */
};

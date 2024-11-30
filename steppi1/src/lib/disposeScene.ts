import * as BABYLON from "babylonjs";

export const disposeScene = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const logger = (message: string) => {
        console.log(`disposeScene: ${message}`);
    };

    // Dispose of all meshes except the XR camera
    scene.meshes.slice().forEach((mesh) => {
        // Ensure we do not dispose the camera or other important components
        if (mesh instanceof BABYLON.Camera) {
            // FIXME: Can this happen??????
            logger(`Skipping camera mesh`);
            return;
        }
        logger(`Disposing mesh ${mesh.name}`);
        mesh.dispose();
    });

    // Dispose all particle systems
    scene.particleSystems.slice().forEach((particleSystem) => {
        logger(`Disposing particle system ${particleSystem.name}`);
        particleSystem.dispose();
    });

    // Dispose all lights
    scene.lights.slice().forEach((light) => {
        logger(`Disposing light ${light.name}`);
        light.dispose();
    });

    scene.materials.slice().forEach((material) => {
        logger(`Disposing material: ${material.name}`);
        material.dispose();
    });

    // Dispose all textures, except environmentTexture
    scene.textures.slice().forEach((texture) => {
        if (texture === scene.environmentTexture) {
            logger(`Skipping texture mesh ${texture.name}`);
            return;
        }
        logger(`Disposing texture ${texture.name}`);
        texture.dispose();
    });

    // Dispose all post-processes (if any)
    scene.postProcesses.slice().forEach((postProcess) => {
        logger(`Disposing postProcess ${postProcess.name}`);
        postProcess.dispose();
    });

    // If you have any custom render targets or shader effects, dispose them here
    scene.customRenderTargets.slice().forEach((renderTarget) => {
        logger(`Disposing renderTarget ${renderTarget.name}`);
        renderTarget.dispose();
    });

    scene.getNodes().forEach((node) => {
        if (node instanceof BABYLON.Camera) {
            logger(`Skipping camera ${node.id}`);
            return;
        }
        logger(`Disposing node ${node.name}`);
        node.dispose();
    });

    scene.getEngine().releaseEffects();
    BABYLON.Effect.ResetCache();

    logger(`Remaining meshes: ${scene.meshes.map((m) => m.name)}`);
    logger(`Remaining nodes: ${scene.getNodes().map((n) => n.name)}`);

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

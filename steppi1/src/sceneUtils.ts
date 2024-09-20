import * as BABYLON from "babylonjs";

export const disposeScene = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    // Dispose of all meshes except the XR camera
    scene.meshes.slice().forEach((mesh) => {
        // Ensure we do not dispose the camera or other important components
        if (!(mesh instanceof BABYLON.Camera)) {
            mesh.dispose();
        }
    });

    // Dispose all particle systems
    scene.particleSystems.slice().forEach((particleSystem) => {
        particleSystem.dispose();
    });

    // Dispose all lights
    scene.lights.slice().forEach((light) => {
        light.dispose();
    });

    // Dispose all materials and their associated shaders/effects
    scene.materials.slice().forEach((material) => {
        material.dispose(true); // Disposes of associated shaders and effects
    });

    // Dispose all textures, except environmentTexture
    scene.textures.slice().forEach((texture) => {
        if (texture !== scene.environmentTexture) {
            texture.dispose();
        }
    });

    // Dispose all post-processes (if any)
    scene.postProcesses.slice().forEach((postProcess) => {
        postProcess.dispose();
    });

    // If you have any custom render targets or shader effects, dispose them here
    scene.customRenderTargets.slice().forEach((renderTarget) => {
        renderTarget.dispose();
    });

    scene.getEngine().releaseEffects();
    BABYLON.Effect.ResetCache();

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

export type UpdateFn = (remove: () => void) => void;

export const updateWrapper = () => {
    const updates: Map<UpdateFn, (() => void)[]> = new Map();

    const add = (update: UpdateFn) => updates.set(update, []);
    const onRemove = (update: UpdateFn, onRemove: () => void) =>
        updates.get(update)?.push(onRemove);
    const remove = (update: UpdateFn) => {
        updates.get(update)?.forEach((onRemove) => onRemove());
        updates.delete(update);
    };
    const update = () => {
        updates.keys().forEach((update) => update(() => remove(update)));
    };

    return {
        add,
        onRemove,
        remove,
        update,
    };
};

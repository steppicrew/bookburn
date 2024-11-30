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

export type UpdateFn = (remove: () => void) => void;
export interface UpdateWrapper {
    add: (update: UpdateFn) => void;
    onRemove: (update: UpdateFn, onRemove: () => void) => void;
    remove: (update: UpdateFn) => void;
    update: () => void;
    dispose: () => void;
    addUpdates: (childWrapper: UpdateWrapper) => void;
}

export const updateWrapper = (): UpdateWrapper => {
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

    const dispose = () => {
        updates.forEach((update) => {
            update.forEach((onRemove) => onRemove());
        });
        updates.clear();
    };

    const addWrapper = (childWrapper: UpdateWrapper) => {
        add(childWrapper.update);
        onRemove(childWrapper.update, childWrapper.dispose);
    };

    return {
        add,
        onRemove,
        remove,
        update,
        dispose,
        addUpdates: addWrapper,
    };
};

export const TextureManager = (() => {
    const textures: Map<string, BABYLON.Texture> = new Map();
    return {
        get: (url: string, scene: BABYLON.Scene) => {
            const texture = textures.get(url);
            if (texture) {
                return texture;
            }
            {
                const texture = new BABYLON.Texture(url, scene);
                texture.onDispose = () => {
                    textures.delete(url);
                };
                textures.set(url, texture);
                return texture;
            }
        },
        reset: () => {
            textures.clear();
        },
    };
})();

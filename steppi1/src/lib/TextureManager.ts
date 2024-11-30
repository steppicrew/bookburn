import * as BABYLON from "babylonjs";

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

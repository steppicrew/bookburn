import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

// TODO: Does not support the same name in multiple Scenes
const assetsByName: Record<string, BABYLON.TransformNode> = {};

const loadGlbAsset = async (
    scene: BABYLON.Scene,
    path: string,
    prefix: string,
    name: string
) => {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        path,
        `${name}.glb`,
        scene
    );

    const root = new BABYLON.TransformNode(name, scene);
    result.meshes.forEach((mesh) => {
        if (mesh instanceof BABYLON.Mesh) {
            mesh.parent = root;
        }
    });

    assetsByName[prefix + "/" + name] = root;
    root.setEnabled(false);
};

const assetsPathMap: Record<string, string> = {
    furniture: "assets/kenney_furniture-kit/",
};

const loadAsset = async (scene: BABYLON.Scene, name: string) => {
    const matches = name.split("/");
    if (!(matches[0] in assetsPathMap)) {
        throw new Error("Unknown assets path");
    }
    await loadGlbAsset(
        scene,
        assetsPathMap[matches[0]],
        matches[0],
        matches[1]
    );
};

export const assetLoader = async (scene: BABYLON.Scene) => {
    await loadAsset(scene, "furniture/books");
};

export const getAsset = async (scene: BABYLON.Scene, name: string) => {
    if (!(name in assetsByName)) {
        throw new Error(`No such asset: ${name} (Maybe not loaded?)`);
    }
    return assetsByName[name];
};

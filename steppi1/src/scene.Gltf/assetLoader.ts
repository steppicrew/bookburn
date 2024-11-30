import * as BABYLON from "babylonjs";
import { AssetKey } from "../lib/AssetKey";

const loadGlbAsset = async (
    scene: BABYLON.Scene,
    path: string,
    prefix: string,
    name: string
) => {
    console.log(`Loading asset ${prefix}/${name}`);

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        path,
        `${name}.glb`,
        scene
    );

    const root = new BABYLON.TransformNode(name, scene);
    root.setEnabled(false);

    result.meshes.forEach((mesh) => {
        if (mesh instanceof BABYLON.Mesh && mesh.parent === null) {
            mesh.parent = root;
        }

        // PBRMaterial don't work with HMR. Replace them with StandardMaterial
        if (mesh.material instanceof BABYLON.PBRMaterial) {
            const nextMaterial = new BABYLON.StandardMaterial(
                mesh.material.name + "_1",
                scene
            );
            nextMaterial.diffuseColor = mesh.material.albedoColor;
            nextMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            mesh.material = nextMaterial;
            console.log(
                `Reassigned material ${mesh.material.name} to mesh ${mesh.name}`
            );
        }
    });

    return root;
};

// TODO: Does not support the same name in multiple Scenes
const assetsByName: Record<string, BABYLON.TransformNode> = {};

const assetsPathMap: Record<string, string> = {
    root: "assets/",
    furniture: "assets/kenney_furniture-kit/",
    building: "assets/kenney_building-kit/",
};

const loadAsset = async (scene: BABYLON.Scene, assetKey: AssetKey) => {
    const [prefix, name] = assetKey.split("/");
    if (!(prefix in assetsPathMap)) {
        throw new Error("Unknown assets path");
    }
    const asset = await loadGlbAsset(
        scene,
        assetsPathMap[prefix],
        prefix,
        name
    );

    if (prefix === "furniture") {
        asset.scaling = new BABYLON.Vector3(2, 2, 2);
    }

    assetsByName[assetKey] = asset;
    console.log(`Registering ${assetKey}`);

    asset.onDispose = () => {
        console.log(`Unregistering ${assetKey}`);
        if (!assetsByName[assetKey].isDisposed) {
            assetsByName[assetKey].dispose();
        }
        delete assetsByName[`${assetKey}`];
    };
};

export const getAsset = async (scene: BABYLON.Scene, assetKey: AssetKey) => {
    if (!(assetKey in assetsByName)) {
        await loadAsset(scene, assetKey);
    }

    if (assetsByName[assetKey].isDisposed()) {
        throw `getAsset holds a disposed asset! ${assetKey}`;
    }

    return assetsByName[assetKey];
};

const nextCloneIndex: Record<string, number> = {};

export const getAssetClone = async (
    scene: BABYLON.Scene,
    assetKey: AssetKey
) => {
    const asset = await getAsset(scene, assetKey);
    let index = 0;
    if (assetKey in nextCloneIndex) {
        index = ++nextCloneIndex[assetKey];
    } else {
        nextCloneIndex[assetKey] = index;
    }
    const clone = asset.clone(`${assetKey}_${index}`, null);
    if (clone === null) {
        throw new Error("asset.clone() === null");
    }
    return clone;
};

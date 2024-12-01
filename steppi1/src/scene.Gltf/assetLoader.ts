import * as BABYLON from "babylonjs";
import { AssetKey } from "../lib/AssetKey";

const loadGlbAsset = async (
    scene: BABYLON.Scene,
    path: string,
    prefix: string,
    name: string
): Promise<BABYLON.Mesh[]> => {
    const assetKey = `${prefix}/${name}`;
    console.log(`Loading asset ${assetKey}`);

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        path,
        `${name}.glb`,
        scene
    );

    const meshes = result.meshes.filter((mesh) => {
        if (mesh.parent === null) {
            return false;
        }

        if (!(mesh instanceof BABYLON.Mesh)) {
            throw new Error(`Mesh type ${typeof mesh} not allowed`);
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

        mesh.bakeCurrentTransformIntoVertices();
        mesh.isVisible = false;
        return true;
    });

    return meshes as BABYLON.Mesh[];
};

// TODO: Does not support the same name in multiple Scenes
const assetsByName: Record<string, BABYLON.Mesh[]> = {};

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
        asset.forEach((mesh) => (mesh.scaling = new BABYLON.Vector3(2, 2, 2)));
    }

    assetsByName[assetKey] = asset;
    console.log(`Registering ${assetKey}`);

    asset.forEach((mesh) => {
        mesh.onDispose = () => {
            const index = assetsByName[assetKey].findIndex((m) => m === mesh);
            if (index < 0) {
                throw new Error(
                    `Mesh not found while unregistering ${assetKey}`
                );
            }
            assetsByName[assetKey].splice(index, 1);
            if (assetsByName[assetKey].length === 0) {
                console.log(`Unregistering ${assetKey}`);
                delete assetsByName[assetKey];
            }
        };
    });
};

export const getAsset = async (scene: BABYLON.Scene, assetKey: AssetKey) => {
    if (!(assetKey in assetsByName)) {
        await loadAsset(scene, assetKey);
    }

    assetsByName[assetKey].forEach((mesh) => {
        if (mesh.isDisposed()) {
            throw `getAsset holds a disposed asset: ${assetKey}`;
        }
    });

    return assetsByName[assetKey];
};

const nextCloneIndex: Record<string, number> = {};

export const getAssetInstance = async (
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
    return asset.map((mesh) => {
        const instance = mesh.createInstance(`${assetKey}_${index}`);
        if (instance === null) {
            throw new Error("asset.instance() === null");
        }
        instance.isVisible = true;
        return instance;
    });
};

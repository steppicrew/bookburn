import * as BABYLON from "babylonjs";

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
};

const loadAsset = async (scene: BABYLON.Scene, assetKey: string) => {
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

    //    assetKey= scene.

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

export const getAsset = async (scene: BABYLON.Scene, assetKey: string) => {
    if (!(assetKey in assetsByName)) {
        await loadAsset(scene, assetKey);
    }

    if (assetsByName[assetKey].isDisposed()) {
        throw `getAsset holds a disposed asset! ${assetKey}`;
    }

    return assetsByName[assetKey];
};

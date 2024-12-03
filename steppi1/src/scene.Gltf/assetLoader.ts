import * as BABYLON from "babylonjs";

import { AssetKey } from "../lib/AssetKey";
import { makeConsoleLogger } from "./ConsoleLogger";
import {
    createMaterialFromKenneyBuildingKitColormap,
    glassMaterial,
} from "./materialUtils";

const cl = makeConsoleLogger("assetLoader", true);

const makeMaterials =
    // : Record<string, (scene: BABYLON.Scene, name:string) => BABYLON.Material>
    {
        roof: (scene: BABYLON.Scene, name: string) => {
            return createMaterialFromKenneyBuildingKitColormap(
                scene,
                name,
                10,
                2
            );
        },
        stairs: (scene: BABYLON.Scene, name: string) => {
            return createMaterialFromKenneyBuildingKitColormap(
                scene,
                name,
                12,
                3
            );
        },
        glass: (scene: BABYLON.Scene, name: string) => {
            return glassMaterial(scene, name);
        },
        default: (scene: BABYLON.Scene, name: string) => {
            return createMaterialFromKenneyBuildingKitColormap(
                scene,
                name,
                10,
                3
            );
        },
    } as const;

const materialSubstitutes: Array<
    [regex: RegExp, materialName: keyof typeof makeMaterials]
> = [
    [/^building[/]stairs-.*[/]colormap$/, "stairs"],
    [/^building[/]roof-.*[/]colormap$/, "roof"],
    [/^.*[/]glass$/, "glass"],
    [/^/, "default"],
];

const loadGlbAsset = async (
    scene: BABYLON.Scene,
    path: string,
    prefix: string,
    name: string
): Promise<BABYLON.Mesh[]> => {
    const assetKey = `${prefix}/${name}`;
    cl.log(`Loading asset ${assetKey}`);

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
            throw new Error(`Mesh type ${mesh.getClassName()} not allowed`);
        }

        if (mesh.material) {
            let material: BABYLON.Material | undefined;
            for (const [regex, materialName] of materialSubstitutes) {
                if (regex.test(`${assetKey}/${mesh.material.name}`)) {
                    const substituteMaterialName =
                        materialName + "__substitute";
                    const material1 = scene.getMaterialByName(
                        substituteMaterialName
                    );
                    if (material1) {
                        material = material1;
                    } else {
                        material = makeMaterials[materialName](
                            scene,
                            substituteMaterialName
                        );
                    }
                    cl.log(
                        `Reassigned material ${substituteMaterialName} to mesh ${mesh.name} (was ${mesh.material.name})`
                    );
                    break;
                }
            }
            if (!material) {
                throw new Error("No material substitute matched");
            }

            mesh.material.dispose(false, true);
            mesh.material = material;
        }

        mesh.bakeCurrentTransformIntoVertices();
        mesh.isVisible = false;
        mesh.receiveShadows = true;
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
    cl.log(`Registering ${assetKey}`);

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
                cl.log(`Unregistering ${assetKey}`);
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
    assetKey: AssetKey,
    shadowGenerator?: BABYLON.ShadowGenerator
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
        shadowGenerator?.addShadowCaster(instance);

        // FIXME: Remove hack
        // FIXME: DrawCell killer
        if (instance.material?.name.startsWith("glass")) {
            // instance.material.alpha = 0.5;
        }

        return instance;
    });
};

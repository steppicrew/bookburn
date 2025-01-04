import * as BABYLON from "babylonjs";

import { AssetKey } from "./AssetKey";
import { makeConsoleLogger } from "../scene.Gltf/ConsoleLogger";
import {
    applyPlanarProjection,
    makePlainMaterial,
    makeRoofTilesMaterial,
    makeWallMaterial,
    makeWoodMaterial,
    makeGlassMaterial,
    applyPerpendicularUVs,
} from "../scene.Gltf/materialUtils";

const cl = makeConsoleLogger("assetLoader", true);

const makeMaterials =
    // : Record<string, (scene: BABYLON.Scene, name:string, mesh: BABYLON.Mesh) => BABYLON.Material>
    {
        wall: (scene: BABYLON.Scene, name: string, mesh: BABYLON.Mesh) => {
            applyPerpendicularUVs(mesh);
            const material = makeWallMaterial(scene, name);
            return material;
        },

        roof: (scene: BABYLON.Scene, name: string, mesh: BABYLON.Mesh) => {
            applyPlanarProjection(mesh);
            // return createPlainMaterial(scene, name, 0.4, 0.1, 0.1);
            return makeRoofTilesMaterial(scene, name);
        },

        stairs: (scene: BABYLON.Scene, name: string, mesh: BABYLON.Mesh) => {
            // applyPlanarProjection(mesh);
            return makeWoodMaterial(scene, name);
        },

        glass: (scene: BABYLON.Scene, _name: string, mesh: BABYLON.Mesh) => {
            const material = makeGlassMaterial(scene);
            // material.backFaceCulling = false;
            return material;
        },

        default: (scene: BABYLON.Scene, name: string, mesh: BABYLON.Mesh) =>
            makePlainMaterial(scene, name, 1, 1, 1),
    } as const;

const materialSubstitutes: Array<
    [regex: RegExp, materialName: keyof typeof makeMaterials]
> = [
    // [/^building[/]wall-window-.*[/]colormap$/, "wall"],
    [/^building[/]wall(?:-.*|)[/]colormap$/, "wall"],
    [/^building[/]roof-.*[/]colormap$/, "roof"],
    [/^building[/]stairs-.*[/]colormap$/, "stairs"],
    [/^.*[/]glass$/, "glass"],
    [/^/, "default"],
];

const loadGlbAsset = async (
    scene: BABYLON.Scene,
    path: string,
    prefix: string,
    name: string,
    shadowGenerator?: BABYLON.ShadowGenerator
): Promise<BABYLON.Mesh[]> => {
    const assetKey = `${prefix}/${name}`;
    cl.log(`Loading asset ${assetKey}`);

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null,
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
                        assetKey + "__" + materialName + "__substitute";
                    const material1 = scene.getMaterialByName(
                        substituteMaterialName
                    );
                    if (material1) {
                        material = material1;
                    } else {
                        material = makeMaterials[materialName](
                            scene,
                            substituteMaterialName,
                            mesh
                        );
                    }
                    cl.log(
                        `Reassigned material ${assetKey}/${mesh.material.name} to ${substituteMaterialName}`
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

        // Thin instance test
        // mesh.isVisible = false;
        shadowGenerator?.addShadowCaster(mesh);

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

const loadAsset = async (
    scene: BABYLON.Scene,
    assetKey: AssetKey,
    shadowGenerator?: BABYLON.ShadowGenerator
) => {
    const [prefix, name] = assetKey.split("/");
    if (!(prefix in assetsPathMap)) {
        throw new Error("Unknown assets path");
    }
    const asset = await loadGlbAsset(
        scene,
        assetsPathMap[prefix],
        prefix,
        name,
        shadowGenerator
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

export const getAsset = async (
    scene: BABYLON.Scene,
    assetKey: AssetKey,
    shadowGenerator?: BABYLON.ShadowGenerator
) => {
    if (!(assetKey in assetsByName)) {
        await loadAsset(scene, assetKey, shadowGenerator);
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
    const asset = await getAsset(scene, assetKey); // Don't pass shadowGenerator for Instance
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
        return instance;
    });
};

const refreshMeshes = new Set<BABYLON.Mesh>();

export const getAssetThinInstance = async (
    scene: BABYLON.Scene,
    assetKey: AssetKey,
    matrix: BABYLON.Matrix,
    shadowGenerator?: BABYLON.ShadowGenerator
) => {
    const asset = await getAsset(scene, assetKey, shadowGenerator); // Pass shadowGenerator for ThinInstance
    return asset.map((mesh) => {
        refreshMeshes.add(mesh);
        mesh.thinInstanceAdd(matrix, false);
    });
};

export const flushAssetThinInstances = () => {
    for (const mesh of refreshMeshes) {
        mesh.thinInstanceBufferUpdated("matrix");
        mesh.thinInstanceRefreshBoundingInfo(true);
    }
    refreshMeshes.clear();
};

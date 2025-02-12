import * as BABYLON from "babylonjs";
import { makeWoodMaterial } from "../scene.Gltf/materialUtils";
import { getAssetThinInstance } from "../lib/assetLoader";

type TiledBoxOptions = Parameters<typeof BABYLON.MeshBuilder.CreateTiledBox>[1];

export const makeShelfNode = async (
    scene: BABYLON.Scene,
    shadowGenerator: BABYLON.ShadowGenerator | undefined,
    x: number,
    z: number
): Promise<BABYLON.Mesh[]> => {
    const matrix = BABYLON.Matrix.Identity();
    matrix.setTranslation(new BABYLON.Vector3(x, 0, z));
    return await getAssetThinInstance(
        scene,
        "furniture/bookcaseClosedWide",
        matrix,
        shadowGenerator
    );

    /*
    const mat = new BABYLON.StandardMaterial("bricks", scene);
    mat.diffuseTexture = new BABYLON.Texture(
        "https://assets.babylonjs.com/environments/bricktile.jpg",
        scene
    );
    */

    /*
    const handRoot = new BABYLON.TransformNode(`shelf-root`, scene);

    const mat = makeWoodMaterial(scene);

    const options: TiledBoxOptions = {
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        pattern: BABYLON.Mesh.FLIP_TILE,
        alignVertical: BABYLON.Mesh.TOP,
        alignHorizontal: BABYLON.Mesh.LEFT,
        tileSize: 3,
        tileWidth: 1,
    };

    const width = 6.9;
    const height = 3.9;
    const depth = 0.05;

    {
        const tiledBox = BABYLON.MeshBuilder.CreateTiledBox(
            "tiledBox",
            { ...options, width, height, depth },
            scene
        );
        tiledBox.material = mat;
        handRoot.addChild(tiledBox);
    }

    {
        const width = 0.05;
        const height = 3.9;
        const depth = 1;

        const tiledBox = BABYLON.MeshBuilder.CreateTiledBox(
            "tiledBox",
            { ...options, width, height, depth },
            scene
        );
        tiledBox.material = mat;
        handRoot.addChild(tiledBox);
    }

    return handRoot;
    */
};

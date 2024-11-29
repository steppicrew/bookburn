import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { getAsset } from "./assetLoader";

export const sceneContent = async (scene: BABYLON.Scene) => {
    const useMeshInstances = async (assetName: string) => {
        const asset = await getAsset(scene, "furniture/books");

        for (let i = 0; i < 4; i++) {
            const instanceParent = new BABYLON.TransformNode(
                `instanceGroup_${i}`,
                scene
            );

            asset.getChildMeshes().forEach((childMesh) => {
                if (childMesh instanceof BABYLON.Mesh && childMesh.geometry) {
                    const instance = childMesh.createInstance(
                        `${childMesh.name}_instance_${i}`
                    );
                    instance.parent = instanceParent;
                    return;
                }
                console.log(
                    `sceneContent(): Mesh ${childMesh.name} has no geometry and cannot be instanced.`
                );
            });

            instanceParent.position = new BABYLON.Vector3(i * 3, 0, 0); // Offset each group
            console.log(`Instance group created: ${instanceParent.name}`);
        }
    };

    await useMeshInstances("furniture/books");
};

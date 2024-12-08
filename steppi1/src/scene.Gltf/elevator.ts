import * as BABYLON from "babylonjs";
import { makeGlassMaterial, makeWoodMaterial } from "./materialUtils";
import { enableGravity } from "./playerGravity";

const insideBox = (box: BABYLON.Mesh, point: BABYLON.Vector3) => {
    var boundInfo = box.getRawBoundingInfo();
    var max = boundInfo.maximum;
    var min = boundInfo.minimum;
    if (point.x < min.x || point.x > max.x) {
        return false;
    }
    if (point.y < min.y || point.y > max.y) {
        return false;
    }
    if (point.z < min.z || point.z > max.z) {
        return false;
    }
    return true;
};

// FIXME: add name
export const addElevator = (
    scene: BABYLON.Scene,
    x: number,
    y: number,
    z: number,
    height: number,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    if (!xrHelper) {
        return;
    }

    const xrCamera = xrHelper.baseExperience.camera;

    const shaft = BABYLON.MeshBuilder.CreateBox(
        "elevatorShaft",
        { width: 3, depth: 2, height },
        scene
    );
    shaft.position = new BABYLON.Vector3(x, y + height / 2 + 0.05, z);

    shaft.material = makeGlassMaterial(scene);
    shaft.material.backFaceCulling = false;

    const platform = BABYLON.MeshBuilder.CreateBox(
        "elevatorPlatform",
        { width: 2.9, depth: 1.9, height: 0.2 },
        scene
    );

    platform.material = makeWoodMaterial(scene);
    platform.parent = shaft;

    const bounds = shaft.getBoundingInfo().boundingBox;
    platform.position = new BABYLON.Vector3(0, bounds.minimum.y, 0);
    xrHelper.teleportation.addFloorMesh(platform);

    let lastInside = false;

    xrHelper.baseExperience.sessionManager.onXRFrameObservable.add((frame) => {
        const inside = insideBox(
            shaft,
            xrCamera.position.subtract(shaft.getAbsolutePosition())
        );

        if (lastInside !== inside) {
            enableGravity(lastInside);
            lastInside = inside;
            if (inside) {
                platform.position.y = bounds.minimum.y;
            }
        }

        if (inside) {
            if (platform.position.y < bounds.maximum.y - 2.4) {
                platform.position.y = Math.min(
                    bounds.maximum.y - 2.4,
                    platform.position.y + 0.1
                );
                xrCamera.position.y =
                    platform.getAbsolutePosition().y + xrCamera.realWorldHeight;
            }
        } else {
            if (platform.position.y >= bounds.minimum.y) {
                platform.position.y = Math.max(
                    bounds.minimum.y,
                    platform.position.y - 0.15
                );
            }
        }
    });
};

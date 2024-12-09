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

function easeInOutElevator(
    minValue: number,
    maxValue: number,
    currentValue: number,
    minSpeed: number,
    maxSpeed: number,
    direction: number
): number {
    const progress = BABYLON.Scalar.Clamp(
        (currentValue - minValue) / (maxValue - minValue),
        0,
        1
    );
    const easeFactor =
        0.5 * (1 - Math.cos(Math.PI * 2 * (progress * 0.8 + 0.1)));
    const speed = Math.max(minSpeed, maxSpeed * easeFactor);
    let nextValue = currentValue + direction * speed;
    if (direction > 0) {
        nextValue = Math.min(nextValue, maxValue);
    } else {
        nextValue = Math.max(nextValue, minValue);
    }
    return nextValue;
}

// FIXME: add name
export const addElevator = (
    scene: BABYLON.Scene,
    x: number,
    y: number,
    z: number,
    height: number,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const xrCamera = xrHelper.baseExperience.camera;

    const position = new BABYLON.Vector3(x, y + height / 2 + 0.05, z);

    const shaft = BABYLON.MeshBuilder.CreateBox(
        "elevatorShaft",
        { width: 3, depth: 2, height },
        scene
    );
    shaft.position = position.clone();

    shaft.material = makeGlassMaterial(scene);
    shaft.material.backFaceCulling = false;

    const platform = BABYLON.MeshBuilder.CreateBox(
        "elevatorPlatform",
        { width: 2.9, depth: 1.9, height: 0.2 },
        scene
    );

    console.log(position);
    platform.material = makeWoodMaterial(scene);

    const bounds1 = shaft.getBoundingInfo().boundingBox;
    const minimumY = position.y + bounds1.minimum.y;
    const maximumY = position.y + bounds1.maximum.y - 2.4;

    platform.position = new BABYLON.Vector3(position.x, minimumY, position.z);
    xrHelper.teleportation.addFloorMesh(platform);

    const sound = new BABYLON.Sound(
        "elevatorSound",
        "assets/sound/413457__thatmisfit__mechanical-elevator-lights-buzzing.mp3",
        scene,
        null,
        {
            spatialSound: false,
            loop: true,
            autoplay: false,
            volume: 12,
        }
    );

    let lastInside = false;

    const maxUpSpeed = BABYLON.Scalar.Clamp(
        (maximumY - minimumY) / 100,
        0.3,
        0.5
    );
    const maxDownSpeed = BABYLON.Scalar.Clamp(
        (maximumY - minimumY) / 100,
        0.3,
        0.8
    );

    if (false) {
        // For debugging:

        let inside = true;

        scene.registerBeforeRender(() => {
            if (inside) {
                if (platform.position.y < maximumY) {
                    platform.position.y = easeInOutElevator(
                        minimumY,
                        maximumY,
                        platform.position.y,
                        0.01,
                        maxUpSpeed,
                        1
                    );
                    xrCamera.position.y =
                        platform.position.y + xrCamera.realWorldHeight;
                } else {
                    inside = false;
                }
            } else {
                if (platform.position.y > minimumY) {
                    platform.position.y = easeInOutElevator(
                        minimumY,
                        maximumY,
                        platform.position.y,
                        0.2,
                        maxDownSpeed,
                        -1
                    );
                } else {
                    inside = true;
                }
            }
        });

        return shaft;
    }

    xrHelper.baseExperience.sessionManager.onXRFrameObservable.add((frame) => {
        const inside = insideBox(
            shaft,
            xrCamera.position.subtract(shaft.getAbsolutePosition())
        );

        if (lastInside !== inside) {
            enableGravity(lastInside);
            lastInside = inside;
            if (inside) {
                platform.position.y = minimumY;
                sound.play(0.1);
            } else {
                sound.stop(0.1);
            }
        }

        if (inside) {
            if (platform.position.y < maximumY) {
                platform.position.y = easeInOutElevator(
                    minimumY,
                    maximumY,
                    platform.position.y,
                    0.01,
                    maxUpSpeed,
                    1
                );
                xrCamera.position.y =
                    platform.position.y + xrCamera.realWorldHeight;
            }
        } else {
            if (platform.position.y > minimumY) {
                platform.position.y = easeInOutElevator(
                    minimumY,
                    maximumY,
                    platform.position.y,
                    0.2,
                    maxDownSpeed,
                    -1
                );
            }
        }
    });

    return shaft;
};

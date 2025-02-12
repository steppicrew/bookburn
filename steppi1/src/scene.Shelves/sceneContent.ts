import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import {
    addHouse,
    flushTeleportationCells as flushHouses,
} from "../nodeLib/houseNode";
import { CreateCamera2 } from "../lib/camera1";
import { flushAssetThinInstances } from "../lib/assetLoader";
import { makeShelfNode } from "./shelfNode";
import { addPerson } from "../nodeLib/personNode";

export const addHouses = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    // outline MUST be counter clockwise

    await addHouse(scene, -20, -20, [20, -20], {
        floors: 15,
        shadowGenerator,
    });
};

export const sceneContent = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    shadowGenerator?: BABYLON.ShadowGenerator,
    xrHelper?: BABYLON.WebXRDefaultExperience
) => {
    addPerson(scene);
    // addDebugGrid(scene);

    await addHouses(scene, shadowGenerator, xrHelper);

    const shelfNodes: BABYLON.Mesh[][] = [];

    const countX = 20;

    for (let i = 0; i < countX; i++) {
        const x = -5 - 0.9 * i;
        shelfNodes.push(await makeShelfNode(scene, shadowGenerator, x, 10));
    }

    // shelfNode.position.x = 5;
    // shelfNode.position.z = 20;

    if (0) {
        scene.onBeforeCameraRenderObservable.addOnce(() => {
            camera.node.target = new BABYLON.Vector3(
                15.955011708538676,
                3.9295872002316834,
                45.58911580022531
            );
            camera.node.alpha = 7.998549738511245;
            camera.node.beta = 1.38474887577081;
            camera.node.radius = 0.0002;
        });
    }
    if (0) {
        scene.onBeforeCameraRenderObservable.addOnce(() => {
            camera.node.target = new BABYLON.Vector3(
                15.494180795142732,
                3.894973079882696,
                6.9659862740685075
            );
            camera.node.alpha = 6.804378734146906;
            camera.node.beta = 1.4913888263252668;
            camera.node.radius = 0.0002;
        });
    }

    flushAssetThinInstances();
    flushHouses(scene, xrHelper);

    if (0) {
        let t0 = performance.now();
        let tl = 5000;
        scene.onBeforeRenderObservable.add(() => {
            // xrHelper?.baseExperience.sessionManager.onXRFrameObservable.add((frame) => {
            let x1 = (tl + t0 - performance.now()) / tl;
            if (x1 < -2000 / tl) {
                t0 = performance.now();
            }
            if (x1 < 0) {
                x1 = 0;
            }
            shelfNodes.forEach((shelfNode, i) => {
                shelfNode.forEach((mesh, j) => {
                    const x = 0.9 * (countX * 0.5 - i) + Math.pow(x1, 2) * 40;
                    const y = -Math.pow(x1, 5) - 0.01;
                    const z = -2 + Math.cos((i - countX * 0.5) / countX);
                    let matrix = BABYLON.Matrix.Translation(x, y, z);

                    const rotationMatrixY = BABYLON.Matrix.RotationY(
                        0.2 * Math.sin(i * 1.5) +
                            (i & 1 ? -1 : 1) * Math.sin(x1)
                    );
                    const rotationMatrixX = BABYLON.Matrix.RotationX(
                        (i & 1 ? -0.05 : 0.05) * Math.sin(i)
                    );
                    matrix = rotationMatrixY
                        .multiply(rotationMatrixX)
                        .multiply(matrix);

                    mesh.thinInstanceSetMatrixAt(i, matrix);
                    mesh.thinInstanceBufferUpdated("matrix");
                });
            });
        });
    }
    if (1) {
        function lerp(a: number, b: number, t: number): number {
            return a * (1 - t) + b * t;
        }

        let t0 = performance.now();
        let duration = 5000; // 5 Sekunden Animation
        const radius = 6; // Radius der Kreisbahn

        // Bezier Kontrollpunkte
        const p0 = new BABYLON.Vector3(-5, 0, 10); // Start
        const p10 = new BABYLON.Vector3(-20, 0, 0); // Kontrollpunkt 1
        const p11 = new BABYLON.Vector3(-40, 0, 0); // Kontrollpunkt 1
        const p21 = new BABYLON.Vector3(-5, 0, -5); // Kontrollpunkt 2
        const p20 = new BABYLON.Vector3(-10, 0, -5); // Kontrollpunkt 2
        const p3 = new BABYLON.Vector3(0, 0, -10); // Ende/Kreisstart

        scene.onBeforeRenderObservable.add(() => {
            let t1 = (duration + t0 - performance.now()) / duration;
            if (t1 < -2000 / duration) {
                t0 = performance.now();
            }
            if (t1 < 0) {
                t1 = 0;
            }

            shelfNodes.forEach((shelfNode, i) => {
                let position: BABYLON.Vector3;

                const t2 = Math.pow(t1, 1.5);

                // Bezier Kurve
                const tBezier = t2 + (i / (shelfNodes.length - 1)) * (1 - t2);
                const b = 1 - tBezier;
                const bezierPosition = new BABYLON.Vector3(
                    p0.x * b * b * b +
                        3 * (i & 1 ? p11 : p10).x * tBezier * b * b +
                        3 * (i & 1 ? p21 : p20).x * tBezier * tBezier * b +
                        p3.x * tBezier * tBezier * tBezier,
                    0,
                    p0.z * b * b * b +
                        3 * (i & 1 ? p11 : p10).z * tBezier * b * b +
                        3 * (i & 1 ? p21 : p20).z * tBezier * tBezier * b +
                        p3.z * tBezier * tBezier * tBezier
                );

                // Halbkreisbahn
                const tCircle =
                    t2 - 1 + (i / (shelfNodes.length - 1)) * (1 - (t2 - 1));
                const angle =
                    (1 + tCircle) * Math.PI * 0.5 +
                    (i / shelfNode.length) * Math.PI * 2;
                const circlePosition = new BABYLON.Vector3(
                    radius * Math.cos(angle),
                    0,
                    radius * Math.sin(angle)
                );

                // Interpolation zwischen Bezier und Halbkreis
                const blendFactor = Math.max(0, Math.min(1, 1 - t2));
                position = BABYLON.Vector3.Lerp(
                    bezierPosition,
                    circlePosition,
                    blendFactor
                );

                const y0 = -(Math.pow(t1, 5) * i) / (shelfNodes.length - 1);
                const y1 = (Math.pow(t1, 5) * 30 * i) / (shelfNodes.length - 1);
                const y = i & 1 ? y1 : y0;

                let matrix = BABYLON.Matrix.Translation(
                    position.x,
                    y,
                    position.z
                );

                // Rotation zur Kreismitte
                const rotationAngle = Math.atan2(
                    position.z,
                    lerp(position.x, -position.x, 1 - t1)
                );
                const rotationMatrix = BABYLON.Matrix.RotationY(
                    rotationAngle + Math.PI / 2
                );

                matrix = rotationMatrix.multiply(matrix);

                shelfNode.forEach((mesh) => {
                    mesh.thinInstanceSetMatrixAt(i, matrix);
                });
            });

            // Aktualisieren Sie den Buffer nur für shelfNode[0]
            shelfNodes[0].forEach((mesh) => {
                mesh.thinInstanceBufferUpdated("matrix");
            });
        });
    }

    /*
    // https://doc.babylonjs.com/features/featuresDeepDive/webXR/WebXRSelectedFeatures/WebXRLayers/

    try {
        // Attempt to enable the 'xr-layers' feature
        await xrHelper?.baseExperience.featuresManager.enableFeature(
            BABYLON.WebXRFeatureName.LAYERS,
            "stable"
        );
        console.log("XR Layers enabled successfully!");
    } catch (error) {
        // Handle unsupported feature gracefully
        console.log(
            "sceneContent: XR Layers feature is not supported in this environment:",
            error
        );
    }
    */

    /*
    xrHelper?.onInitialXRPoseSetObservable.add((xrCamera) => {
        // floor is at y === 2
        xrCamera.position.y = 2;
    });
    */
};

import * as BABYLON from "babylonjs";
import { createBook } from "./book";
import { state } from "./state";
import { CreateSceneFn } from "./sceneEx";
import { CreateCamera2 } from "./camera1";
import { createGround } from "./baseScene";
import { makeCreateFire3 } from "./fire";

const setupBook = async (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const book = createBook(scene);

    book.node.position.x = 4;
    book.node.rotation = new BABYLON.Vector3(0, (2 * Math.PI) / 3, 0);

    // Fallback for non-VR
    state.canvas.addEventListener("pointerdown", () => {
        book.flipPage();
    });

    xrHelper.input.onControllerAddedObservable.add((controller) => {
        controller.onMotionControllerInitObservable.add((motionController) => {
            const triggerComponent = motionController.getComponent(
                "xr-standard-trigger"
            );
            triggerComponent?.onButtonStateChangedObservable.add((state) => {
                if (state.pressed) {
                    book.flipPage(1);
                }
            });
        });
    });
};

export const createScene1: CreateSceneFn = async (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    // *** Light ***

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1.2, 1, 0),
        scene
    );

    let angle = 0;

    const update = () => {
        angle += 0.01;

        light.direction = new BABYLON.Vector3(
            Math.sin(angle),
            1,
            Math.cos(angle)
        );
    };

    // *** Environment texture ***
    // The HDR texture set up in the code you provided is not directly
    // visible as a background in the scene but is used primarily for
    // lighting, reflections, and overall environment effects.

    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "./assets/Runyon_Canyon_A_2k_cube_specular.dds",
        scene
    );
    hdrTexture.name = "envTex";
    hdrTexture.gammaSpace = false;

    scene.registerBeforeRender(() => {
        hdrTexture.setReflectionTextureMatrix(BABYLON.Matrix.RotationY(0));
    });

    scene.environmentTexture = hdrTexture;

    // *** Skybox ***

    const skybox = BABYLON.MeshBuilder.CreateBox(
        "skyBox",
        { size: 1000.0 },
        scene
    );
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = hdrTexture;
    skyboxMaterial.reflectionTexture.coordinatesMode =
        BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    // *** Ground ***

    const ground = createGround(scene);
    xrHelper.teleportation.addFloorMesh(ground);

    // *** Book ***

    await setupBook(scene, xrHelper);

    const createFire = makeCreateFire3(scene);

    // ** Fire **
    const relX = 8;

    const fireNode1 = createFire(1000, 5);
    fireNode1.position.x -= relX * 1;

    const fireNode2 = createFire(50, 5);
    fireNode2.position.x -= relX * 2;

    const fireNode3 = createFire(50, 3);
    fireNode3.position.x -= relX * 3;

    const fireNode4 = createFire(10, 3);
    fireNode4.position.x -= relX * 4;

    return update;
};

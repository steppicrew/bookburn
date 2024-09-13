import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { createGround } from "./baseScene";
import { createBook } from "./book";
import { createBook2 } from "./book2";
import { createCamera2 } from "./camera1";
import { createFire1 } from "./fire";

const setupBook = async (
    canvas: HTMLCanvasElement,
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const book = createBook(scene);

    book.node.position.x = 4;
    book.node.rotation = new BABYLON.Vector3(0, (2 * Math.PI) / 3, 0);

    // Fallback for non-VR
    canvas.addEventListener("pointerdown", () => {
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

const createScene1 = async (
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement
) => {
    const scene = new BABYLON.Scene(engine);
    const camera = await createCamera2(canvas, scene);
    const xrHelper = await scene.createDefaultXRExperienceAsync();

    // *** Light ***

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1, 1, 0),
        scene
    );

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

    await setupBook(canvas, scene, xrHelper);

    let angle = 0;

    const update = () => {
        angle += 0.01;

        light.direction = new BABYLON.Vector3(
            Math.sin(angle),
            1,
            Math.cos(angle)
        );
    };

    // ** Fire **
    const fireNode1 = createFire1(scene, light);
    fireNode1.position.x -= 3 * 1;

    const fireNode2 = createFire1(scene, light, 1);
    fireNode2.position.x -= 3 * 2;

    const fireNode3 = createFire1(scene, light, 2);
    fireNode3.position.x -= 3 * 3;

    const fireNode4 = createFire1(scene, light, 6);
    fireNode4.position.x -= 3 * 4;
    return {
        update,
        render: () => scene.render(),
    };
};

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById(
        "renderCanvas"
    ) as any as HTMLCanvasElement;

    const engine = new BABYLON.Engine(canvas, true);

    // To prevent limitations of lights per mesh
    // FIXME: Notwendig?
    // engine.disableUniformBuffers = true;

    window.addEventListener("resize", () => {
        engine.resize();
    });

    (async () => {
        const scene = await createScene1(engine, canvas);
        engine.runRenderLoop(() => {
            scene.update();
            scene.render();
        });
    })();
});

import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { createBook } from "./book";
import { createCamera2 } from "./camera1";
import { createPage } from "./book/page";

const setupBook = async (
    canvas: HTMLCanvasElement,
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience
) => {
    const page = createPage(scene, 21, 27);
    xrHelper.input.onControllerAddedObservable.add((controller) => {
        controller.onMotionControllerInitObservable.add((motionController) => {
            const triggerComponent = motionController.getComponent(
                "xr-standard-trigger"
            );
        });
    });
    return page;
};

const createScene1 = async (
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement
) => {
    const scene = new BABYLON.Scene(engine);
    const camera = await createCamera2(canvas, scene);
    const xrHelper = await scene.createDefaultXRExperienceAsync();

    // *** Light ***

    const light = new BABYLON.DirectionalLight(
        "light",
        new BABYLON.Vector3(0, 0, 1),
        scene
    );

    // *** Book ***

    await setupBook(canvas, scene, xrHelper);

    const update = () => {};

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

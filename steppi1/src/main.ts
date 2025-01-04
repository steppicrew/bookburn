import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { CreateSceneFn, SceneEx } from "./lib/sceneEx";
import { state } from "./state";
import logo from "./assets/bookburn.svg?raw";

import { initXrDebugging } from "./lib/initXrDebugging";
import { createScene as createBooksScene } from "./scene.Books/scene.Books";
import { createScene as createBooks2Scene } from "./scene.Books2/scene.Books";
import { createScene as createGltfScene } from "./scene.Gltf/scene.Gltf";

let createScene: CreateSceneFn | undefined;

const scenes: Record<string, { title: string; createScene: CreateSceneFn }> = {
    gltf: { title: '"City Vertigo"', createScene: createGltfScene },
    gltf_test: {
        title: "Houses test scene",
        createScene: createGltfScene,
    },
    books: {
        title: "Book/Physics test scene",
        createScene: createBooksScene,
    },
    books2: {
        title: "Book2/Physics test scene",
        createScene: createBooks2Scene,
    },
};

const selected = location.search.substring(1);

if (selected in scenes) {
    createScene = scenes[selected].createScene;
}

const start = async () => {
    if (!createScene) {
        // let logo = '<img class="logo" src="/assets/bookburn.svg" />';
        let html = "";
        for (const id in scenes) {
            html += `<a href="?${id}"><h1>${scenes[id].title}</h1></a>`;
        }
        document.body.innerHTML = `<div id="scenes"><p>Select a scene:</p>${html}<div class="logo">${logo}</div></div>`;
        return;
    }

    if (!state.canvas) {
        state.canvas = document.getElementById(
            "renderCanvas"
        ) as unknown as HTMLCanvasElement;
    }

    if (!state.engine) {
        state.engine = new BABYLON.Engine(state.canvas, true);

        // To prevent limitations of lights per mesh
        // engine.disableUniformBuffers = true;

        window.addEventListener("resize", () => {
            state.engine.resize();
        });
    }

    if (!state.sceneEx) {
        // Initialize the scene only once
        state.sceneEx = await SceneEx.create(state.engine, state.canvas);
        await state.sceneEx.setupCreateScene(createScene);
    }

    // Start the render loop if not already running
    if (!state.engine.isDisposed) {
        state.engine.runRenderLoop(() => {
            state.sceneEx.update();
            state.sceneEx.render();
        });
    }
};

window.addEventListener("DOMContentLoaded", start);

// Vite HMR support
if (import.meta.hot) {
    /*
    if (false) {
        const ms = [
            "beforeUpdate",
            "afterUpdate",
            "beforeFullReload",
            "beforePrune",
            "invalidate",
            "error",
            "ws:disconnect",
            "ws:connect",
        ];
        ms.forEach((event) =>
            import.meta.hot!.on(`vite:${event}`, (args) => {
                console.log("HMR EVENT", event, args);
            })
        );
    }
    */

    import.meta.hot.on("vite:beforeUpdate", async (_args) => {
        console.log("HMR EVENT beforeUpdate: remove scene");
        if (createScene) {
            await state.sceneEx.setupBeforeHMR();
        }
    });

    import.meta.hot.on("vite:afterUpdate", async (_args) => {
        console.log("HMR EVENT afterUpdate: re-create scene");
        if (createScene) {
            await state.sceneEx.setupCreateScene(createScene);
            await state.sceneEx.setupAfterHMR();
        }
    });

    import.meta.hot.accept(() => {});
}

//if (xrHelper.baseExperience.state === BABYLON.WebXRState.IN_XR) {
initXrDebugging();
// }

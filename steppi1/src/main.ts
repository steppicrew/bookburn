import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Optional: if you're loading external assets like glTF models
import { SceneEx } from "./sceneEx";
import { state } from "./state";
import { createScene1 } from "./scene2";

const start = async () => {
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
        await state.sceneEx.setup(createScene1);
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

    import.meta.hot!.on("vite:afterUpdate", (args) => {
        console.log("HMR EVENT afterUpdate: re-create scene");
        state.sceneEx.setup(createScene1);
    });

    import.meta.hot.accept(() => {
        // Dummy
    });
}

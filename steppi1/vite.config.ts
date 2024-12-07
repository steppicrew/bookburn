import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import glsl from "vite-plugin-glsl";

// You can set your own entry point:
// Create a file .env.local with this contents:
// VITE_SCENE=Gltf

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const entryScene = env.VITE_SCENE;
    console.log("ENTRY SCENE:", entryScene);
    return {
        server: {
            host: "0.0.0.0", // Bind to all interfaces
            open: false, // Automatically open the browser on start
            hmr: {
                overlay: true, // Ensure the error overlay is enabled
            },
        },
        plugins: [glsl(), basicSsl({})],
        assetsInclude: ["**/*.gltf", "**/*.glb"],
        build: {
            assetsDir: "assets",
            outDir: "dist",
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, `index.html`),
                },
            },
        },
        define: {
            // To access in code
            "process.env.SCENE": JSON.stringify(entryScene),
        },
        // to serve HavokPhysics.wasm from it's original location
        optimizeDeps: { exclude: ["@babylonjs/havok"] },
    };
});

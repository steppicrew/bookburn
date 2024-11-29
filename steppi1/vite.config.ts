import { defineConfig, loadEnv } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import glsl from "vite-plugin-glsl";
import path from "path";

// You can set your own entry point:
// Create a file .env.local with this contents:
// VITE_SCENE=Gltf

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const entryScene = env.VITE_ENTRY_POINT;
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
            outDir: "dist",
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, `src/main.ts`),
                },
            },
        },
        define: {
            "process.env.SCENE": JSON.stringify(entryScene), // To access in code
        },
    };
});

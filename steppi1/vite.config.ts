import { defineConfig, loadEnv } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import glsl from "vite-plugin-glsl";
import path from "path";

// You can set your own entry point:
// Create a file .env.local with this contents:
// VITE_ENTRY_POINT=main.Gltf.ts

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const entryPoint = env.VITE_ENTRY_POINT || "main";
    console.log("ENTRY POINT:", entryPoint);
    return {
        server: {
            host: "0.0.0.0", // Bind to all interfaces
            open: false, // Automatically open the browser on start
            hmr: {
                overlay: true, // Ensure the error overlay is enabled
            },
        },
        plugins: [
            glsl(),
            basicSsl({}),
            {
                name: "html-transform",
                transformIndexHtml(html) {
                    return html.replace(
                        /<script type="module" src=".*"><\/script>/,
                        `<script type="module" src="/src/${entryPoint}"></script>`
                    );
                },
            },
        ],
        assetsInclude: ["**/*.gltf", "**/*.glb"],
        build: {
            outDir: "dist",
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, `src/${entryPoint}.ts`),
                },
            },
        },
        define: {
            "process.env.ENTRY_POINT": JSON.stringify(entryPoint), // Optional, to access in code
        },
    };
});

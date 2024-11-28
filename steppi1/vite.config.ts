import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import glsl from "vite-plugin-glsl";

export default defineConfig({
    server: {
        host: "0.0.0.0", // Bind to all interfaces
        open: true, // Automatically open the browser on start
        hmr: {
            overlay: true, // Ensure the error overlay is enabled
        },
    },
    build: {
        outDir: "dist", // Output directory for production build
    },
    plugins: [glsl(), basicSsl({})],
    assetsInclude: ["**/*.gltf", "**/*.glb"],
});

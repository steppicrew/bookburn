import { defineConfig } from "vite";

export default defineConfig({
    server: {
        host: "0.0.0.0", // Bind to all interfaces
        open: true, // Automatically open the browser on start
    },
    build: {
        outDir: "dist", // Output directory for production build
    },
});

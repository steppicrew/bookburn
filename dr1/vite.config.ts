import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
    server: {
        host: "0.0.0.0", // Bind to all interfaces
        // open: true, // Automatically open the browser on start
    },
    build: {
        outDir: "dist", // Output directory for production build
    },
    plugins: [
        basicSsl({
            /** name of certification */
            // name: "test",
            /** custom trust domains */
            // domains: ["*"],
            /** custom certification directory */
            // certDir: "./.cert",
        }),
    ],
});

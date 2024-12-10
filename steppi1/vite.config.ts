import { defineConfig, loadEnv, Plugin } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import glsl from "vite-plugin-glsl";

// You can set your own entry point:
// Create a file .env.local with this contents:
// VITE_SCENE=Gltf

const logger = (): Plugin => ({
    name: "custom-log-socket",
    configureServer(server) {
        server.ws.on("connection", (socket) => {
            console.log("A client connected to WebSocket");

            socket.on("message", (rawMsg) => {
                const msg = JSON.parse(rawMsg.toString());
                if (typeof msg === "object" && msg !== null) {
                    if (msg.type === "custom") {
                        const event = JSON.parse(msg.event.toString());
                        if (event.event === "log-message") {
                            console.log(
                                `[Client ${event.data.type}]`,
                                ...event.data.message
                            );
                        } else {
                            console.log("???", event);
                        }
                    }
                }
            });
        });
    },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    return {
        base: "./",
        server: {
            host: "0.0.0.0", // Bind to all interfaces
            open: false, // Automatically open the browser on start
            hmr: {
                overlay: true, // Ensure the error overlay is enabled
            },
        },
        plugins: [glsl(), basicSsl({}), logger()],
        // to serve HavokPhysics.wasm from it's original location
        optimizeDeps: { exclude: ["@babylonjs/havok"] },
    };
});


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [
        {
            name: "jsx-in-js",
            enforce: "pre",
            transform(code, id) {
                if (
                    id.includes("/src/") &&
                    id.endsWith(".js") &&
                    code.includes("<")
                ) {
                    return {
                        code,
                        map: null,
                        moduleType: "jsx",
                    };
                }
            },
        },
        react(),
    ],

    esbuild: {
        loader: "jsx",
        include: /src\/.*\.js$/,
    },

    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },
        },
    },
});

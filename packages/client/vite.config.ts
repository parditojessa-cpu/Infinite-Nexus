import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "service-worker.ts",
      injectRegister: false,
      manifest: {
        name: "Finite Nexus — LMS",
        short_name: "Finite Nexus",
        description: "Learning Management System for Senior High School",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f5f3ee",
        theme_color: "#0f4c81",
        icons: [
          { src: "/icons/finite-nexus-logo.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/finite-nexus-logo.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/finite-nexus-logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        id: "/student-app",
        name: "English Examination Portal",
        short_name: "English Exam",

        start_url: "/pwa-launch",
        scope: "/",

        display: "standalone",

        theme_color: "#800000",
        background_color: "#ffffff",

        icons: [
          {
            src: "/VEC_Logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/VEC_Logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
  },
});

// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // gọi BE của bạn
      "/api": { target: "http://localhost:8089", changeOrigin: true },

      // (DEV only) gọi thẳng Superset nếu bạn tắt CSRF ở Superset
      "/sp": {
        target: "http://localhost:8088",
        changeOrigin: true,
        secure: false,
        rewrite: p => p.replace(/^\/sp/, "/api/v1"),
      },
    },
  },
});

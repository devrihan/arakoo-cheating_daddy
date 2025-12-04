import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // Ensures relative paths for Electron
  root: "src", // <--- TELLS VITE TO LOOK IN SRC FOLDER
  build: {
    outDir: "../dist", // Output to 'dist' in the project root
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
const port = Number(process.env.PORT ?? 5173);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT ?? ""}"`);
}

const isStandalone =
  process.env.VITE_STANDALONE === "true" || process.env.STANDALONE === "1";
const basePath = isStandalone ? "./" : (process.env.BASE_PATH ?? "/");

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_STANDALONE": JSON.stringify(isStandalone ? "true" : "false"),
    ...(isStandalone
      ? {
          "process.env.NODE_ENV": JSON.stringify("production"),
        }
      : {}),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(
      import.meta.dirname,
      isStandalone ? "dist/standalone" : "dist/public",
    ),
    emptyOutDir: true,
    ...(isStandalone
      ? {
          lib: {
            entry: path.resolve(import.meta.dirname, "src/main.tsx"),
            name: "WeeklyPlanner",
            formats: ["iife"],
            fileName: () => "app.js",
          },
          cssCodeSplit: false,
          modulePreload: false,
          target: "es2018",
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        }
      : {}),
  },
  server: {
    port,
    host: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: true,
  },
});

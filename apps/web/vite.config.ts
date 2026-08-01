import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { stubHeavyClientPackagesForSsr } from "./lib/ssr-stubs/vite-plugin";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    minify: true,
  },
  plugins: [
    // Must run before SSR resolves heavy client deps into the Worker graph.
    stubHeavyClientPackagesForSsr(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart({
      // App lives at apps/web root (no src/)
      srcDirectory: ".",
      router: {
        routeFileIgnorePattern:
          "^(components|steps|hooks|utils|error\\.tsx|sitemap\\.ts|robots\\.ts)$",
      },
    }),
    react(),
  ],
});

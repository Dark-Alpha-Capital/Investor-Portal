import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // App lives at apps/web root (no src/); defaults assume src/
      srcDirectory: ".",
    }),
    react(),
    nitro({
      rollupConfig: {
        external: [
          "cloudflare:workers",
          "cloudflare:workflows",
          "cloudflare:sockets",
          "cloudflare:email",
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "next/dynamic": "/compat/next-dynamic.tsx",
      "next/link": "/compat/next-link.tsx",
      "next/navigation": "/compat/next-navigation.ts",
      "next/image": "/compat/next-image.tsx",
      "next/server": "/compat/next-server.ts",
      "next/headers": "/compat/next-headers.ts",
      "next/cache": "/compat/next-cache.ts",
      "next/font/google": "/compat/next-font-google.ts",
      next: "/compat/next.ts",
    },
  },
})

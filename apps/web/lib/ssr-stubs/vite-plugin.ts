import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const stubsDir = path.dirname(fileURLToPath(import.meta.url));

const exactStubs: Record<string, string> = {
  streamdown: path.join(stubsDir, "streamdown.tsx"),
  "@streamdown/cjk": path.join(stubsDir, "streamdown-plugin.ts"),
  "@streamdown/code": path.join(stubsDir, "streamdown-plugin.ts"),
  "@streamdown/math": path.join(stubsDir, "streamdown-plugin.ts"),
  "@streamdown/mermaid": path.join(stubsDir, "streamdown-plugin.ts"),
  shiki: path.join(stubsDir, "shiki.ts"),
  "@tiptap/react": path.join(stubsDir, "tiptap-react.tsx"),
  "@tiptap/starter-kit": path.join(stubsDir, "tiptap-extension.ts"),
  "@tiptap/extension-placeholder": path.join(stubsDir, "tiptap-extension.ts"),
  "pdfjs-dist": path.join(stubsDir, "empty.ts"),
  mammoth: path.join(stubsDir, "empty.ts"),
  xlsx: path.join(stubsDir, "empty.ts"),
  jszip: path.join(stubsDir, "empty.ts"),
};

function shouldStub(id: string): string | null {
  const bare = id.split("?")[0];
  if (bare in exactStubs) {
    return exactStubs[bare] ?? null;
  }
  if (
    bare === "mermaid" ||
    bare.startsWith("mermaid/") ||
    bare === "katex" ||
    bare.startsWith("katex/") ||
    bare === "cytoscape" ||
    bare.startsWith("cytoscape/") ||
    bare.startsWith("shiki/") ||
    bare.startsWith("@shikijs/") ||
    bare.startsWith("pdfjs-dist/") ||
    bare.startsWith("mammoth/") ||
    bare.startsWith("xlsx/") ||
    bare.startsWith("jszip/")
  ) {
    return path.join(stubsDir, "empty.ts");
  }
  return null;
}

/**
 * Keep shiki / mermaid / katex / tip tap out of the Cloudflare Worker SSR graph.
 * Those packages are client-only; with `no_bundle: true` every SSR chunk counts
 * toward the 3 MiB gzip Worker limit.
 */
export function stubHeavyClientPackagesForSsr(): Plugin {
  return {
    name: "stub-heavy-client-packages-for-ssr",
    enforce: "pre",
    resolveId(id) {
      if (this.environment?.name !== "ssr") {
        return null;
      }
      return shouldStub(id);
    },
  };
}

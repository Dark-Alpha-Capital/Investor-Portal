import { describe, expect, test } from "bun:test";
import { createDealFileStore } from "./deal-file-store";

type FakeStat = { mime?: string; size?: number };

function makeFakeClient() {
  const files = new Map<string, { data: Uint8Array; mime: string }>();
  return {
    files,
    getDirectoryContents: async (dirPath: string) => {
      const prefix = dirPath.replace(/\/+$/, "") + "/";
      const entries: Array<{
        filename: string;
        basename: string;
        type: string;
        mime?: string;
        size?: number;
        lastmod?: string;
      }> = [];
      for (const [path, file] of files) {
        if (path.startsWith(prefix)) {
          const rest = path.slice(prefix.length);
          if (rest.includes("/")) {
            const folder = rest.split("/")[0];
            if (!entries.some((e) => e.basename === folder)) {
              entries.push({
                filename: `${prefix}${folder}`,
                basename: folder,
                type: "directory",
                mime: "httpd/unix-directory",
              });
            }
          } else {
            entries.push({
              filename: path,
              basename: path.split("/").pop() ?? "",
              type: "file",
              mime: file.mime,
              size: file.data.byteLength,
              lastmod: "2026-01-01",
            });
          }
        }
      }
      return entries;
    },
    exists: async (path: string) => {
      if (files.has(path)) return true;
      // Treat ancestor directories of any stored file as existing.
      for (const stored of files.keys()) {
        if (stored.startsWith(path.replace(/\/+$/, "") + "/")) return true;
      }
      return false;
    },
    deleteFile: async (path: string) => {
      files.delete(path);
    },
    getFileContents: async (path: string) => {
      const file = files.get(path);
      if (!file) throw new Error("404");
      return file.data;
    },
    createDirectory: async () => {},
    putFileContents: async () => true,
    stat: async (path: string): Promise<FakeStat | { data: FakeStat }> => {
      const file = files.get(path);
      return { data: { mime: file?.mime ?? "", size: file?.data.byteLength ?? 0 } };
    },
    getFileDownloadLink: (path: string) => `/dl${path}`,
  };
}

describe("deal-file-store", () => {
  const client = makeFakeClient();
  const store = createDealFileStore({
    client: client as never,
    getDealFolderPath: async (dealId) => `/investor-portal/deals/${dealId}`,
    putFile: async ({ finalPath, body, contentType }) => {
      client.files.set(finalPath, { data: body, mime: contentType });
      return true;
    },
  });

  test("upload stores under the resolved deal folder with unique name", async () => {
    const result = await store.upload("acme", {
      relativePath: "financials/Q3 model.xlsx",
      body: new TextEncoder().encode("mock-excel"),
      length: 10,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    // sanitizeRelativePath collapses spaces to underscores (production behavior).
    expect(result.path).toBe("/investor-portal/deals/acme/financials/Q3_model.xlsx");
    expect(result.name).toBe("Q3_model.xlsx");
  });

  test("upload dedupes collisions with (1), (2) suffixes", async () => {
    const first = await store.upload("acme", {
      relativePath: "terms.pdf",
      body: new TextEncoder().encode("a"),
      length: 1,
      contentType: "application/pdf",
    });
    const second = await store.upload("acme", {
      relativePath: "terms.pdf",
      body: new TextEncoder().encode("b"),
      length: 1,
      contentType: "application/pdf",
    });
    expect(first.path).toBe("/investor-portal/deals/acme/terms.pdf");
    expect(second.path).toBe("/investor-portal/deals/acme/terms (1).pdf");
  });

  test("rejects oversized uploads with status 413", async () => {
    try {
      await store.upload("acme", {
        relativePath: "big.bin",
        body: new Uint8Array(51 * 1024 * 1024),
        length: 51 * 1024 * 1024,
        contentType: "application/octet-stream",
      });
      expect.unreachable();
    } catch (e) {
      expect((e as { status?: number }).status).toBe(413);
    }
  });

  test("listFolder returns folders and files with relative paths", async () => {
    await store.upload("acme", {
      relativePath: "legal/term-sheet.pdf",
      body: new TextEncoder().encode("x"),
      length: 1,
      contentType: "application/pdf",
    });
    const { folders, files } = await store.listFolder("acme");
    expect(folders.map((f) => f.relativePath)).toContain("legal");
    const filesRel = files.map((f) => f.relativePath);
    expect(filesRel).toContain("terms (1).pdf");
  });

  test("delete removes a file inside the deal folder", async () => {
    await store.upload("acme", {
      relativePath: "notes.txt",
      body: new TextEncoder().encode("hi"),
      length: 2,
      contentType: "text/plain",
    });
    await store.delete("acme", "/investor-portal/deals/acme/notes.txt");
    const { files } = await store.listFolder("acme");
    expect(files.map((f) => f.relativePath)).not.toContain("notes.txt");
  });

  test("delete rejects paths outside the deal folder", async () => {
    expect(
      store.delete("acme", "/investor-portal/deals/other/secret.txt"),
    ).rejects.toThrow("Invalid file path");
  });

  test("download returns contents and stored mime", async () => {
    await store.upload("acme", {
      relativePath: "report.pdf",
      body: new TextEncoder().encode("pdf"),
      length: 3,
      contentType: "application/pdf",
    });
    const { contents, mimeType, fileName } = await store.download(
      "acme",
      "/investor-portal/deals/acme/report.pdf",
    );
    expect(new TextDecoder().decode(contents)).toBe("pdf");
    expect(mimeType).toBe("application/pdf");
    expect(fileName).toBe("report.pdf");
  });
});

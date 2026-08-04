import { createFileRoute } from "@tanstack/react-router";
import { requireAdminApiSession } from "@/lib/auth/require-admin-api";
import { createDealFileStore } from "@/lib/deals/deal-file-store";

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  csv: "text/csv",
  txt: "text/plain",
  rtf: "application/rtf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
  flac: "audio/flac",
};

function inferMimeFromName(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? null;
}

export const Route = createFileRoute("/api/deals/$dealId/file")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const guarded = await requireAdminApiSession();
          if (!guarded.ok) {
            return guarded.response;
          }

          const { dealId } = params;
          const url = new URL(request.url);
          const filePath = url.searchParams.get("path");
          const mode = url.searchParams.get("mode");

          if (!filePath) {
            return Response.json(
              { success: false, message: "File path is required" },
              { status: 400 },
            );
          }

          const { contents, mimeType, fileName } =
            await createDealFileStore().download(dealId, filePath);

          const resolvedMime =
            mimeType && mimeType !== "application/octet-stream"
              ? mimeType
              : (inferMimeFromName(fileName) ?? mimeType) ||
                "application/octet-stream";
          const disposition = mode === "download" ? "attachment" : "inline";

          return new Response(contents as unknown as BodyInit, {
            headers: {
              "Content-Type": resolvedMime,
              "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
              "Cache-Control": "private, no-store",
            },
          });
        } catch (error) {
          console.error("Error streaming deal file:", error);
          const status = (error as { status?: number } | undefined)?.status;
          if (typeof status === "number" && status >= 400 && status < 500) {
            return Response.json(
              {
                success: false,
                message:
                  error instanceof Error
                    ? error.message
                    : "Request failed",
              },
              { status },
            );
          }
          return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { stripHtmlToText } from "./engine";

/**
 * MVP PDF renderer: plain-text layout from rendered HTML/Markdown.
 * Swap for Browser Rendering or firm PDF templates later without changing callers.
 */
export async function renderPdfFromHtml(
  html: string,
  title: string
): Promise<Uint8Array> {
  const text = stripHtmlToText(html);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const titleSize = 16;
  const lineHeight = 14;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawWrapped = (
    content: string,
    size: number,
    useBold = false
  ): void => {
    const activeFont = useBold ? bold : font;
    const words = content.split(/\s+/).filter(Boolean);
    let line = "";

    const flush = () => {
      if (!line) return;
      if (y < margin + lineHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y,
        size,
        font: activeFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight;
      line = "";
    };

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const width = activeFont.widthOfTextAtSize(candidate, size);
      if (width > maxWidth) {
        flush();
        line = word;
      } else {
        line = candidate;
      }
    }
    flush();
  };

  drawWrapped(title, titleSize, true);
  y -= 8;
  page.drawText("PLACEHOLDER — NOT A LEGAL DOCUMENT", {
    x: margin,
    y,
    size: 9,
    font: bold,
    color: rgb(0.6, 0.2, 0.1),
  });
  y -= lineHeight * 1.5;

  for (const paragraph of text.split(/\n+/)) {
    if (!paragraph.trim()) {
      y -= lineHeight / 2;
      continue;
    }
    drawWrapped(paragraph.trim(), fontSize);
    y -= 4;
  }

  return pdf.save();
}

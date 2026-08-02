import type { TemplateVariables } from "../types";

const VAR_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Simple mustache-style renderer. Unknown variables are left intact
 * so missing data is visible during review.
 */
export function renderTemplate(
  body: string,
  variables: TemplateVariables | Record<string, string>
): string {
  return body.replace(VAR_PATTERN, (match, key: string) => {
    const value = variables[key as keyof TemplateVariables];
    return value != null && value !== "" ? String(value) : match;
  });
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h1>/gi, "\n\n")
    .replace(/<\/h2>/gi, "\n\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

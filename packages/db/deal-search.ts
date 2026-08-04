import { and, or, sql, type AnyColumn, type SQL } from "drizzle-orm";

/**
 * Loose, word-based deal search. Splits `raw` into whitespace-separated tokens
 * and ANDs them, so a query like "packaging 9" matches a deal named
 * "packaging equipment 9 colorado". Each token must appear (case-insensitively)
 * in at least one of the given `columns`, but the tokens no longer have to form
 * a contiguous substring of a single field.
 *
 * D1/SQLite has no ILIKE, so this uses `lower(col) like ?` (SQLite LIKE is
 * ASCII case-insensitive, and the value is lowercased before matching).
 *
 * Returns `undefined` when there are no tokens to match.
 */
export function tokenizedSearchCondition(
  raw: string,
  columns: AnyColumn[]
): SQL | undefined {
  const words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;

  const perWord = words.map((word) => {
    const pattern = `%${word}%`;
    return or(...columns.map((col) => sql`lower(${col}) like ${pattern}`))!;
  });

  return perWord.length === 1 ? perWord[0] : and(...perWord);
}

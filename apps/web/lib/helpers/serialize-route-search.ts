/** Serialize TanStack Router `location.search` for server-fn URLSearchParams parsing. */
export function serializeRouteSearch(search: unknown): string {
  if (typeof search === "string") {
    return search.startsWith("?") ? search.slice(1) : search;
  }

  if (!search || typeof search !== "object") {
    return "";
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}

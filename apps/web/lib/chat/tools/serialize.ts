/** Recursively convert Dates to ISO strings for tool JSON results. */
export function serializeForToolResult<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, nested) => {
      if (nested instanceof Date) {
        return nested.toISOString();
      }
      return nested;
    }),
  ) as T;
}

/** Mask provider/server error details before they reach the client stream. */
export function chatStreamErrorMessage(error: unknown): string {
  if (error == null) {
    console.error("Chat stream error: unknown");
    return "An error occurred.";
  }

  if (typeof error === "string") {
    console.error("Chat stream error:", error);
    return "An error occurred.";
  }

  if (error instanceof Error) {
    console.error("Chat stream error:", error);
    return "An error occurred.";
  }

  console.error("Chat stream error:", error);
  return "An error occurred.";
}

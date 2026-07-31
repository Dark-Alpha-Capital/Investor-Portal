"use client";

/**
 * Configure AI SDK client warning logging.
 * Dev: keep warnings visible. Prod: silence to avoid console noise for end users.
 */
export function configureAiSdkClientWarnings() {
  if (typeof globalThis === "undefined") {
    return;
  }

  if (import.meta.env.PROD) {
    globalThis.AI_SDK_LOG_WARNINGS = false;
    return;
  }

  globalThis.AI_SDK_LOG_WARNINGS = ({ warnings, provider, model }) => {
    for (const warning of warnings) {
      console.warn(`AI SDK Warning (${provider}/${model}):`, warning);
    }
  };
}

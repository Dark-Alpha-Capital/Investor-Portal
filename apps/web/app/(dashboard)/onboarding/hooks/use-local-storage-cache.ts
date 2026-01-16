"use client";

/**
 * Cached localStorage utility to reduce I/O overhead
 * Following React best practices: Cache Storage API Calls (7.5)
 */
const storageCache = new Map<string, string | null>();

function getCachedLocalStorage(key: string): string | null {
  if (!storageCache.has(key)) {
    if (typeof window === "undefined") return null;
    try {
      const value = localStorage.getItem(key);
      storageCache.set(key, value);
      return value;
    } catch {
      return null;
    }
  }
  return storageCache.get(key) ?? null;
}

function setCachedLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
    storageCache.set(key, value);
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

function removeCachedLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
    storageCache.delete(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

// Invalidate cache on external changes
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key) {
      storageCache.delete(e.key);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Clear cache when tab becomes visible to sync with external changes
      storageCache.clear();
    }
  });
}

export { getCachedLocalStorage, setCachedLocalStorage, removeCachedLocalStorage };

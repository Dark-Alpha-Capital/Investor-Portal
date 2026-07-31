/** Run work after the current synchronous handler returns (non-blocking). */
export function after(callback: () => void | Promise<void>) {
  queueMicrotask(() => {
    void callback();
  });
}

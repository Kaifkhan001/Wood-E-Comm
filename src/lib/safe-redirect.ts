/** Prevents open redirects: only same-site relative paths are allowed. */
export function safeNext(next: unknown, fallback = "/account") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next.slice(0, 200);
}

// Solo deja pasar enlaces https:// (bloquea javascript:, data:, etc.).
export function safeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

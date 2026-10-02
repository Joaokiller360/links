export const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function fetchLinks(lang, signal) {
  const res = await fetch(`${BASE}/api/links?lang=${lang}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitLead(data) {
  const res = await fetch(`${BASE}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.fields = body.errors || {};
    throw err;
  }
  return body;
}

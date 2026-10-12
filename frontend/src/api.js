export const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// `version` cambia con cada foto nueva, así el navegador no muestra la anterior desde caché.
export const avatarUrl = (version) => (version ? `${BASE}/api/avatar?v=${encodeURIComponent(version)}` : null);

export async function fetchLinks(signal) {
  const res = await fetch(`${BASE}/api/links`, { signal });
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

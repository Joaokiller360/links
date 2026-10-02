import { BASE } from '../api.js';

async function request(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/admin${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const adminApi = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  logout: (token) => request('/logout', { token, method: 'POST' }),
  getContent: (token) => request('/content', { token }),
  saveContent: (token, content) => request('/content', { token, method: 'PUT', body: content }),
  getLeads: (token) => request('/leads', { token }),
  deleteLead: (token, email) => request(`/leads/${encodeURIComponent(email)}`, { token, method: 'DELETE' }),
};

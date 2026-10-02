import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJsonAtomic } from './store.js';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'leads.json');
const MAX_LEADS = Number(process.env.MAX_LEADS) || 5000;
// Sin cuantificadores solapados alrededor de los puntos: coste lineal.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const CONTROL_RE = /[\u0000-\u001f\u007f]/;
const CONTROL_RE_ALL = /[\u0000-\u001f\u007f]/g;

// Serializa lecturas/escrituras para no corromper el archivo con requests concurrentes.
let queue = Promise.resolve();

function enqueue(fn) {
  const task = queue.then(fn);
  queue = task.catch(() => {});
  return task;
}

export function validateLead(body) {
  const name = typeof body?.name === 'string' ? body.name.replace(CONTROL_RE_ALL, '').trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const lang = body?.lang === 'pt' ? 'pt' : 'es';
  const errors = {};
  if (name.length < 2 || name.length > 100) errors.name = 'invalid_name';
  // Longitud antes que la regex, para no evaluar entradas enormes.
  if (email.length > 254 || CONTROL_RE.test(email) || !EMAIL_RE.test(email)) errors.email = 'invalid_email';
  return { lead: { name, email, lang }, errors };
}

export function saveLead(lead) {
  return enqueue(async () => {
    const leads = await readJson(FILE, []);
    if (leads.some((l) => l.email === lead.email)) return { full: false };
    if (leads.length >= MAX_LEADS) return { full: true };
    leads.push({ ...lead, createdAt: new Date().toISOString() });
    await writeJsonAtomic(FILE, leads);
    return { full: false };
  });
}

export function listLeads() {
  return enqueue(() => readJson(FILE, []));
}

export function deleteLead(email) {
  return enqueue(async () => {
    const leads = await readJson(FILE, []);
    const rest = leads.filter((l) => l.email !== email);
    if (rest.length === leads.length) return false;
    await writeJsonAtomic(FILE, rest);
    return true;
  });
}

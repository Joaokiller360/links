import express from 'express';
import { adminEnabled, login, logout, requireAdmin } from './auth.js';
import { loadContent, saveContent, validateContent } from './content.js';
import { deleteLead, listLeads } from './leads.js';

const router = express.Router();

// Los handlers async pasan errores a next() para el manejador global.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.post('/login', express.json({ limit: '1kb' }), (req, res) => {
  if (!adminEnabled()) return res.status(503).json({ ok: false, error: 'admin_disabled' });
  const { status, token } = login(req.ip, req.body?.email, req.body?.password);
  if (status === 429) return res.status(429).json({ ok: false, error: 'too_many_attempts' });
  if (status !== 200) return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  res.json({ ok: true, token });
});

// Todo lo de abajo exige sesión de admin; el body se parsea después de autenticar.
router.use(requireAdmin);
router.use(express.json({ limit: '100kb' }));

router.post('/logout', (req, res) => {
  logout(req.adminToken);
  res.json({ ok: true });
});

router.get(
  '/content',
  wrap(async (_req, res) => {
    res.json({ ok: true, content: await loadContent() });
  }),
);

router.put(
  '/content',
  wrap(async (req, res) => {
    const { content, errors } = validateContent(req.body);
    if (errors.length) return res.status(400).json({ ok: false, errors });
    await saveContent(content);
    res.json({ ok: true, content });
  }),
);

router.get(
  '/leads',
  wrap(async (_req, res) => {
    res.json({ ok: true, leads: await listLeads() });
  }),
);

router.delete(
  '/leads/:email',
  wrap(async (req, res) => {
    const removed = await deleteLead(req.params.email.toLowerCase());
    res.status(removed ? 200 : 404).json({ ok: removed });
  }),
);

export default router;

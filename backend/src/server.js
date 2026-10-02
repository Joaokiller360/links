import express from 'express';
import cors from 'cors';
import adminRouter from './admin.js';
import { loadContent, localize } from './content.js';
import { saveLead, validateLead } from './leads.js';

const PORT = Number(process.env.PORT) || 4010;
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
app.disable('x-powered-by');
// Detrás de un proxy (p. ej. TRUST_PROXY=1) para que el límite de intentos de login use la IP real.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.use(
  cors({
    origin: CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);

// El panel tiene su propio parser (límite mayor, solo tras autenticar).
app.use('/api/admin', adminRouter);
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/links', async (req, res, next) => {
  try {
    res.json(localize(await loadContent(), req.query.lang));
  } catch (err) {
    next(err);
  }
});

app.post('/api/leads', async (req, res, next) => {
  try {
    const { lead, errors } = validateLead(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ ok: false, errors });
    }
    const { full } = await saveLead(lead);
    if (full) return res.status(503).json({ ok: false, error: 'store_full' });
    // Misma respuesta para correos nuevos y repetidos: no revela quién ya está guardado.
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'not_found' });
});

app.use((err, _req, res, _next) => {
  const clientError = Number.isInteger(err.status) && err.status >= 400 && err.status < 500;
  if (clientError) {
    // No registrar err.body: contiene el cuerpo crudo de la petición (datos personales).
    console.warn(`${err.status} ${err.type || 'client_error'}`);
    return res.status(err.status).json({ ok: false, error: 'bad_request' });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: 'server_error' });
});

app.listen(PORT, HOST, () => {
  console.log(`API escuchando en http://${HOST}:${PORT}`);
});

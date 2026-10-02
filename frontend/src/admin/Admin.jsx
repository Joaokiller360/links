import { useCallback, useEffect, useState } from 'react';
import { adminApi } from './adminApi.js';
import { safeUrl } from '../safeUrl.js';

const TOKEN_KEY = 'adminToken';
const LANGS = ['es', 'pt'];
const NETWORKS = ['instagram', 'tiktok', 'youtube', 'x', 'github', 'linkedin', 'otro'];

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage no disponible */
  }
}

export default function Admin() {
  const [token, setToken] = useState(readToken);

  const signOut = useCallback(() => {
    writeToken(null);
    setToken(null);
  }, []);

  useEffect(() => {
    document.title = 'Admin · Mis links';
  }, []);

  if (!token) {
    return (
      <Login
        onLogin={(t) => {
          writeToken(t);
          setToken(t);
        }}
      />
    );
  }
  return <Dashboard token={token} onSignOut={signOut} />;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { token } = await adminApi.login(email, password);
      onLogin(token);
    } catch (err) {
      setError(
        err.status === 429
          ? 'Demasiados intentos. Espera 15 minutos.'
          : err.status === 503
            ? 'El panel está desactivado: define ADMIN_EMAIL y ADMIN_PASSWORD (12+ caracteres) en backend/.env.'
            : err.status === 401
              ? 'Correo o contraseña incorrectos.'
              : 'No se pudo conectar con la API.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page admin">
      <form className="admin-card admin-login" onSubmit={handleSubmit}>
        <h1>Panel de administración</h1>
        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn primary" type="submit" disabled={busy || !email || !password}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        {error && <p className="admin-msg error">{error}</p>}
        <a className="admin-back" href="/">
          ← Volver a la página
        </a>
      </form>
    </main>
  );
}

function Dashboard({ token, onSignOut }) {
  const [tab, setTab] = useState('links');

  async function handleSignOut() {
    try {
      await adminApi.logout(token);
    } catch {
      /* la sesión puede haber expirado ya */
    }
    onSignOut();
  }

  return (
    <main className="page admin">
      <header className="admin-header">
        <h1>Panel</h1>
        <div className="admin-actions">
          <a className="btn" href="/" target="_blank" rel="noopener noreferrer">
            Ver página
          </a>
          <button className="btn" type="button" onClick={handleSignOut}>
            Salir
          </button>
        </div>
      </header>
      <div className="admin-tabs" role="tablist">
        {[
          ['links', 'Contenido'],
          ['leads', 'Contactos'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'links' ? (
        <ContentEditor token={token} onUnauthorized={onSignOut} />
      ) : (
        <Leads token={token} onUnauthorized={onSignOut} />
      )}
    </main>
  );
}

const emptyLink = () => ({
  icon: '🔗',
  url: 'https://',
  primary: false,
  title: { es: '', pt: '' },
  subtitle: { es: '', pt: '' },
});

const emptySocial = () => ({ network: 'instagram', handle: '@', url: 'https://' });

function ContentEditor({ token, onUnauthorized }) {
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState({ kind: 'loading' });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    adminApi
      .getContent(token)
      .then((data) => {
        setContent(data.content);
        setStatus({ kind: 'idle' });
      })
      .catch((err) => (err.status === 401 ? onUnauthorized() : setStatus({ kind: 'error', text: 'No se pudo cargar.' })));
  }, [token, onUnauthorized]);

  // Aplica un cambio sobre una copia y marca el formulario como modificado.
  function edit(fn) {
    setContent((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setStatus({ kind: 'dirty' });
  }

  function move(list, i, delta) {
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  }

  async function handleSave() {
    setStatus({ kind: 'saving' });
    setErrors([]);
    try {
      const data = await adminApi.saveContent(token, content);
      setContent(data.content);
      setStatus({ kind: 'saved' });
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setErrors(err.data?.errors || []);
      setStatus({ kind: 'error', text: 'Revisa los campos marcados.' });
    }
  }

  if (!content) {
    return <p className="admin-msg">{status.kind === 'error' ? status.text : 'Cargando…'}</p>;
  }

  const has = (path) => errors.includes(path);
  const { profile, links, socials } = content;

  return (
    <div className="admin-editor">
      <section className="admin-card">
        <h2>Perfil</h2>
        <div className="grid-2">
          <Field label="Nombre" invalid={has('profile.name')}>
            <input value={profile.name} maxLength={60} onChange={(e) => edit((c) => (c.profile.name = e.target.value))} />
          </Field>
          <Field label="Iniciales (avatar)" invalid={has('profile.initials')}>
            <input
              value={profile.initials}
              maxLength={3}
              onChange={(e) => edit((c) => (c.profile.initials = e.target.value))}
            />
          </Field>
          {LANGS.map((l) => (
            <Field key={l} label={`Frase (${l.toUpperCase()}) · una línea por renglón, máx. 3`} invalid={has(`profile.tagline.${l}`)}>
              <textarea
                rows={3}
                value={profile.tagline[l].join('\n')}
                onChange={(e) => edit((c) => (c.profile.tagline[l] = e.target.value.split('\n').slice(0, 3)))}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Links</h2>
          <button
            className="btn"
            type="button"
            disabled={links.length >= 30}
            onClick={() => edit((c) => c.links.push(emptyLink()))}
          >
            + Añadir link
          </button>
        </div>
        {links.length === 0 && <p className="admin-msg">Todavía no hay links.</p>}
        {links.map((link, i) => (
          <div key={i} className="admin-item">
            <div className="admin-item-head">
              <strong>
                {link.icon} {link.title.es || 'Link sin título'}
              </strong>
              <div className="admin-actions">
                <button className="btn icon" type="button" aria-label="Subir" onClick={() => edit((c) => move(c.links, i, -1))}>
                  ↑
                </button>
                <button className="btn icon" type="button" aria-label="Bajar" onClick={() => edit((c) => move(c.links, i, 1))}>
                  ↓
                </button>
                <button
                  className="btn icon danger"
                  type="button"
                  aria-label="Eliminar"
                  onClick={() => edit((c) => c.links.splice(i, 1))}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="grid-link">
              <Field label="Icono" invalid={has(`links.${i}.icon`)}>
                <input value={link.icon} maxLength={8} onChange={(e) => edit((c) => (c.links[i].icon = e.target.value))} />
              </Field>
              <Field label="URL (https://)" invalid={has(`links.${i}.url`) || !safeUrl(link.url)}>
                <input
                  type="url"
                  value={link.url}
                  maxLength={500}
                  onChange={(e) => edit((c) => (c.links[i].url = e.target.value))}
                />
              </Field>
            </div>
            <div className="grid-2">
              {LANGS.map((l) => (
                <Field key={`t${l}`} label={`Título (${l.toUpperCase()})`} invalid={has(`links.${i}.title`)}>
                  <input
                    value={link.title[l]}
                    maxLength={80}
                    onChange={(e) => edit((c) => (c.links[i].title[l] = e.target.value))}
                  />
                </Field>
              ))}
              {LANGS.map((l) => (
                <Field key={`s${l}`} label={`Subtítulo (${l.toUpperCase()}) · opcional`} invalid={has(`links.${i}.subtitle`)}>
                  <input
                    value={link.subtitle[l]}
                    maxLength={120}
                    onChange={(e) => edit((c) => (c.links[i].subtitle[l] = e.target.value))}
                  />
                </Field>
              ))}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={link.primary}
                onChange={(e) => edit((c) => (c.links[i].primary = e.target.checked))}
              />
              Destacado (botón verde)
            </label>
          </div>
        ))}
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Redes sociales</h2>
          <button
            className="btn"
            type="button"
            disabled={socials.length >= 10}
            onClick={() => edit((c) => c.socials.push(emptySocial()))}
          >
            + Añadir red
          </button>
        </div>
        {socials.map((s, i) => (
          <div key={i} className="admin-item grid-social">
            <Field label="Red" invalid={has(`socials.${i}.network`)}>
              <select value={s.network} onChange={(e) => edit((c) => (c.socials[i].network = e.target.value))}>
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Usuario" invalid={has(`socials.${i}.handle`)}>
              <input value={s.handle} maxLength={40} onChange={(e) => edit((c) => (c.socials[i].handle = e.target.value))} />
            </Field>
            <Field label="URL (https://)" invalid={has(`socials.${i}.url`) || !safeUrl(s.url)}>
              <input type="url" value={s.url} maxLength={500} onChange={(e) => edit((c) => (c.socials[i].url = e.target.value))} />
            </Field>
            <button
              className="btn icon danger"
              type="button"
              aria-label="Eliminar red"
              onClick={() => edit((c) => c.socials.splice(i, 1))}
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <div className="admin-savebar">
        <span className={`admin-msg${status.kind === 'error' ? ' error' : ''}`}>
          {status.kind === 'dirty' && 'Cambios sin guardar'}
          {status.kind === 'saving' && 'Guardando…'}
          {status.kind === 'saved' && 'Guardado ✓'}
          {status.kind === 'error' && status.text}
        </span>
        <button className="btn primary" type="button" onClick={handleSave} disabled={status.kind === 'saving'}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function Field({ label, invalid, children }) {
  return (
    <label className={`field${invalid ? ' invalid' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Leads({ token, onUnauthorized }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    adminApi
      .getLeads(token)
      .then((data) => setLeads(data.leads))
      .catch((err) => (err.status === 401 ? onUnauthorized() : setError('No se pudieron cargar los contactos.')));
  }, [token, onUnauthorized]);

  useEffect(load, [load]);

  async function handleDelete(email) {
    if (!window.confirm(`¿Eliminar ${email}?`)) return;
    try {
      await adminApi.deleteLead(token, email);
      setLeads((prev) => prev.filter((l) => l.email !== email));
    } catch (err) {
      if (err.status === 401) onUnauthorized();
      else setError('No se pudo eliminar.');
    }
  }

  if (error) return <p className="admin-msg error">{error}</p>;
  if (!leads) return <p className="admin-msg">Cargando…</p>;

  return (
    <section className="admin-card">
      <h2>Contactos ({leads.length})</h2>
      {leads.length === 0 ? (
        <p className="admin-msg">Nadie ha dejado su correo todavía.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Idioma</th>
                <th>Fecha</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...leads].reverse().map((l) => (
                <tr key={l.email}>
                  <td>{l.name}</td>
                  <td>{l.email}</td>
                  <td>{l.lang}</td>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="btn icon danger" type="button" aria-label="Eliminar" onClick={() => handleDelete(l.email)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

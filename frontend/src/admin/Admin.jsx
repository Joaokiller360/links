import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from './adminApi.js';
import { avatarUrl } from '../api.js';
import { safeUrl } from '../safeUrl.js';
import Avatar from '../components/Avatar.jsx';

// Clases compartidas del panel.
const page = 'mx-auto max-w-[760px] px-4 pt-12 pb-14 max-[440px]:pt-9';
const card = 'mb-4 flex flex-col gap-3.5 rounded-xl border border-line bg-card p-4.5';
const itemBox = 'rounded-[10px] border border-line bg-page p-3.5';
const row = 'flex items-center justify-between gap-3';
const actions = 'flex gap-1.5';
const h1 = 'text-[22px] font-bold tracking-[-0.01em]';
const h2 = 'text-[15px] font-bold tracking-[-0.01em]';
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
const control =
  'min-h-9 w-full resize-y rounded-lg border border-line px-2.5 py-2 text-[13.5px] text-ink focus:border-brand focus:outline-none group-data-invalid:border-danger';
const controlPage = `${control} bg-page`;
const controlCard = `${control} bg-card`;
const fieldLabel = 'flex min-w-0 flex-col gap-[5px] text-xs text-muted';
const cell = 'border-b border-line px-2.5 py-2 text-left whitespace-nowrap';

const msg = (error) => `text-[13px] ${error ? 'text-danger-soft' : 'text-muted'}`;

function btn({ primary, danger, icon } = {}) {
  return [
    'inline-flex min-h-[34px] cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border text-[13px] font-semibold disabled:cursor-default disabled:opacity-50',
    focusRing,
    icon ? 'w-[34px]' : 'px-3.5',
    primary
      ? 'border-brand bg-brand text-brand-ink not-disabled:hover:bg-brand-hover'
      : 'border-line-hover text-ink not-disabled:hover:bg-card-hover',
    danger && 'not-disabled:hover:border-danger not-disabled:hover:text-danger-soft',
  ]
    .filter(Boolean)
    .join(' ');
}

const TOKEN_KEY = 'adminToken';
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
    <main className={page}>
      <form className={`${card} mx-auto mt-[10vh] max-w-[380px]`} onSubmit={handleSubmit}>
        <h1 className={h1}>Panel de administración</h1>
        <label className={fieldLabel}>
          <span>Correo</span>
          <input
            className={controlPage}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </label>
        <label className={fieldLabel}>
          <span>Contraseña</span>
          <input
            className={controlPage}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className={btn({ primary: true })} type="submit" disabled={busy || !email || !password}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        {error && <p className={msg(true)}>{error}</p>}
        <a className="text-[12.5px] text-muted" href="/">
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
    <main className={page}>
      <header className={row}>
        <h1 className={h1}>Panel De Administración</h1>
        <div className={actions}>
          <a className={btn()} href="/" target="_blank" rel="noopener noreferrer">
            Ver página
          </a>
          <button className={btn()} type="button" onClick={handleSignOut}>
            Salir
          </button>
        </div>
      </header>
      <div className="mt-5 mb-4 inline-flex gap-0.5 rounded-full border border-line bg-card p-[3px]" role="tablist">
        {[
          ['links', 'Contenido'],
          ['leads', 'Contactos'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-semibold ${focusRing} ${
              tab === id ? 'bg-brand text-brand-ink' : 'text-muted'
            }`}
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
  title: '',
  subtitle: '',
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
      .catch((err) =>
        err.status === 401 ? onUnauthorized() : setStatus({ kind: 'error', text: 'No se pudo cargar.' }),
      );
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
    return <p className={msg(status.kind === 'error')}>{status.kind === 'error' ? status.text : 'Cargando…'}</p>;
  }

  const has = (path) => errors.includes(path);
  const { profile, links, socials } = content;

  return (
    <div>
      <section className={card}>
        <h2 className={h2}>Perfil</h2>
        <AvatarPicker
          token={token}
          profile={profile}
          onUnauthorized={onUnauthorized}
          onChange={(avatar) => setContent((prev) => ({ ...prev, profile: { ...prev.profile, avatar } }))}
        />
        <div className="grid grid-cols-2 gap-2.5 max-[600px]:grid-cols-1">
          <Field label="Nombre" invalid={has('profile.name')}>
            <input
              className={controlPage}
              value={profile.name}
              maxLength={60}
              onChange={(e) => edit((c) => (c.profile.name = e.target.value))}
            />
          </Field>
          <Field label="Iniciales (si no hay foto)" invalid={has('profile.initials')}>
            <input
              className={controlPage}
              value={profile.initials}
              maxLength={3}
              onChange={(e) => edit((c) => (c.profile.initials = e.target.value))}
            />
          </Field>
          <Field label="Frase · una línea por renglón, máx. 3" invalid={has('profile.tagline')} wide>
            <textarea
              className={controlPage}
              rows={3}
              value={profile.tagline.join('\n')}
              onChange={(e) => edit((c) => (c.profile.tagline = e.target.value.split('\n').slice(0, 3)))}
            />
          </Field>
        </div>
      </section>

      <section className={card}>
        <div className={row}>
          <h2 className={h2}>Links</h2>
          <button
            className={btn()}
            type="button"
            disabled={links.length >= 30}
            onClick={() => edit((c) => c.links.push(emptyLink()))}
          >
            + Añadir link
          </button>
        </div>
        {links.length === 0 && <p className={msg()}>Todavía no hay links.</p>}
        {links.map((link, i) => (
          <div key={i} className={`${itemBox} flex flex-col gap-2.5`}>
            <div className={row}>
              <strong className="truncate text-[13.5px]">
                {link.icon} {link.title || 'Link sin título'}
              </strong>
              <div className={actions}>
                <button
                  className={btn({ icon: true })}
                  type="button"
                  aria-label="Subir"
                  onClick={() => edit((c) => move(c.links, i, -1))}
                >
                  ↑
                </button>
                <button
                  className={btn({ icon: true })}
                  type="button"
                  aria-label="Bajar"
                  onClick={() => edit((c) => move(c.links, i, 1))}
                >
                  ↓
                </button>
                <button
                  className={btn({ icon: true, danger: true })}
                  type="button"
                  aria-label="Eliminar"
                  onClick={() => edit((c) => c.links.splice(i, 1))}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="grid grid-cols-[90px_1fr] gap-2.5">
              <Field label="Icono" invalid={has(`links.${i}.icon`)}>
                <input
                  className={controlCard}
                  value={link.icon}
                  maxLength={8}
                  onChange={(e) => edit((c) => (c.links[i].icon = e.target.value))}
                />
              </Field>
              <Field label="URL (https://)" invalid={has(`links.${i}.url`) || !safeUrl(link.url)}>
                <input
                  className={controlCard}
                  type="url"
                  value={link.url}
                  maxLength={500}
                  onChange={(e) => edit((c) => (c.links[i].url = e.target.value))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-[600px]:grid-cols-1">
              <Field label="Título" invalid={has(`links.${i}.title`)}>
                <input
                  className={controlCard}
                  value={link.title}
                  maxLength={80}
                  onChange={(e) => edit((c) => (c.links[i].title = e.target.value))}
                />
              </Field>
              <Field label="Subtítulo · opcional" invalid={has(`links.${i}.subtitle`)}>
                <input
                  className={controlCard}
                  value={link.subtitle}
                  maxLength={120}
                  onChange={(e) => edit((c) => (c.links[i].subtitle = e.target.value))}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              <input
                className="accent-brand"
                type="checkbox"
                checked={link.primary}
                onChange={(e) => edit((c) => (c.links[i].primary = e.target.checked))}
              />
              Destacado (botón verde)
            </label>
          </div>
        ))}
      </section>

      <section className={card}>
        <div className={row}>
          <h2 className={h2}>Redes sociales</h2>
          <button
            className={btn()}
            type="button"
            disabled={socials.length >= 10}
            onClick={() => edit((c) => c.socials.push(emptySocial()))}
          >
            + Añadir red
          </button>
        </div>
        {socials.map((s, i) => (
          <div
            key={i}
            className={`${itemBox} grid grid-cols-[130px_1fr_1.6fr_auto] items-end gap-2.5 max-[600px]:grid-cols-1`}
          >
            <Field label="Red" invalid={has(`socials.${i}.network`)}>
              <select
                className={controlCard}
                value={s.network}
                onChange={(e) => edit((c) => (c.socials[i].network = e.target.value))}
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Usuario" invalid={has(`socials.${i}.handle`)}>
              <input
                className={controlCard}
                value={s.handle}
                maxLength={40}
                onChange={(e) => edit((c) => (c.socials[i].handle = e.target.value))}
              />
            </Field>
            <Field label="URL (https://)" invalid={has(`socials.${i}.url`) || !safeUrl(s.url)}>
              <input
                className={controlCard}
                type="url"
                value={s.url}
                maxLength={500}
                onChange={(e) => edit((c) => (c.socials[i].url = e.target.value))}
              />
            </Field>
            <button
              className={btn({ icon: true, danger: true })}
              type="button"
              aria-label="Eliminar red"
              onClick={() => edit((c) => c.socials.splice(i, 1))}
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <div
        className={`${row} sticky bottom-3 rounded-xl border border-line-hover bg-card/95 px-3.5 py-3 backdrop-blur-[6px]`}
      >
        <span className={msg(status.kind === 'error')}>
          {status.kind === 'dirty' && 'Cambios sin guardar'}
          {status.kind === 'saving' && 'Guardando…'}
          {status.kind === 'saved' && 'Guardado ✓'}
          {status.kind === 'error' && status.text}
        </span>
        <button
          className={btn({ primary: true })}
          type="button"
          onClick={handleSave}
          disabled={status.kind === 'saving'}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

const AVATAR_SIZE = 400;

// Recorta al centro en cuadrado y reduce a 400 px. Al recodificar se descartan los
// metadatos EXIF (p. ej. la ubicación GPS de las fotos del móvil).
async function prepareAvatar(file) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(side, AVATAR_SIZE);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas
    .getContext('2d')
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  // Si el navegador no sabe generar WebP, toBlob devuelve PNG.
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) throw new Error('encode_failed');
  return blob;
}

function AvatarPicker({ token, profile, onChange, onUnauthorized }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      const { content } = await action();
      onChange(content.profile.avatar);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setError(err.status === 413 ? 'La imagen es demasiado grande.' : 'No se pudo procesar la imagen.');
    } finally {
      setBusy(false);
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) run(async () => adminApi.uploadAvatar(token, await prepareAvatar(file)));
  }

  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <Avatar initials={profile.initials} photo={avatarUrl(profile.avatar)} />
      <div className={actions}>
        <input ref={input} type="file" accept="image/*" hidden onChange={handleFile} />
        <button className={btn()} type="button" disabled={busy} onClick={() => input.current.click()}>
          {busy ? 'Subiendo…' : profile.avatar ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {profile.avatar && (
          <button
            className={btn({ danger: true })}
            type="button"
            disabled={busy}
            onClick={() => window.confirm('¿Quitar la foto?') && run(() => adminApi.deleteAvatar(token))}
          >
            Quitar
          </button>
        )}
      </div>
      {error && <p className={`${msg(true)} basis-full`}>{error}</p>}
    </div>
  );
}

function Field({ label, invalid, wide, children }) {
  return (
    <label className={`group ${fieldLabel}${wide ? ' col-span-full' : ''}`} data-invalid={invalid || undefined}>
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

  if (error) return <p className={msg(true)}>{error}</p>;
  if (!leads) return <p className={msg()}>Cargando…</p>;

  return (
    <section className={card}>
      <h2 className={h2}>Contactos ({leads.length})</h2>
      {leads.length === 0 ? (
        <p className={msg()}>Nadie ha dejado su correo todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={`${cell} font-semibold text-muted`}>Nombre</th>
                <th className={`${cell} font-semibold text-muted`}>Correo</th>
                <th className={`${cell} font-semibold text-muted`}>Fecha</th>
                <th className={cell} />
              </tr>
            </thead>
            <tbody>
              {[...leads].reverse().map((l) => (
                <tr key={l.email}>
                  <td className={cell}>{l.name}</td>
                  <td className={cell}>{l.email}</td>
                  <td className={cell}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td className={cell}>
                    <button
                      className={btn({ icon: true, danger: true })}
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => handleDelete(l.email)}
                    >
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

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJsonAtomic } from './store.js';

// El contenido se edita desde el panel /admin y se guarda en data/content.json.
// Esto es solo el contenido inicial mientras ese archivo no existe.
export const NETWORKS = ['instagram', 'tiktok', 'youtube', 'x', 'github', 'linkedin', 'otro'];

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'content.json');

const DEFAULT_CONTENT = {
  profile: {
    name: 'Tu Nombre',
    initials: 'TN',
    tagline: ['Una frase corta sobre ti.', 'Lo que haces o lo que te gusta.'],
  },
  links: [
    {
      id: 'l1',
      icon: '🌐',
      url: 'https://example.com/',
      primary: true,
      title: 'Mi web personal',
      subtitle: 'Todo sobre mí en un solo lugar',
    },
    {
      id: 'l2',
      icon: '💬',
      url: 'https://wa.me/10000000000',
      primary: false,
      title: 'Escríbeme por WhatsApp',
      subtitle: 'Respondo rápido',
    },
    {
      id: 'l3',
      icon: '✍️',
      url: 'https://example.com/blog',
      primary: false,
      title: 'Mi blog',
      subtitle: 'Notas, ideas y lo que voy aprendiendo',
    },
  ],
  socials: [
    { id: 's1', network: 'instagram', handle: '@tu_usuario', url: 'https://instagram.com/tu_usuario' },
  ],
};

let cache = null;

// Versiones anteriores guardaban textos por idioma ({ es, pt }); se conserva el español.
const spanish = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value.es : value);

function migrate(content) {
  return {
    ...content,
    profile: { ...content.profile, tagline: spanish(content.profile.tagline) },
    links: content.links.map((link) => ({ ...link, title: spanish(link.title), subtitle: spanish(link.subtitle) })),
  };
}

export async function loadContent() {
  if (!cache) cache = migrate(await readJson(FILE, DEFAULT_CONTENT));
  return cache;
}

export async function saveContent(content) {
  await writeJsonAtomic(FILE, content);
  cache = content;
}

function text(value, min, max) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v.length >= min && v.length <= max ? v : null;
}

function httpsUrl(value) {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

// Reconstruye el contenido campo por campo; nada del input se copia sin validar.
export function validateContent(input) {
  const errors = [];
  const p = input?.profile;
  const name = text(p?.name, 1, 60);
  const initials = text(p?.initials, 1, 3);
  if (name === null) errors.push('profile.name');
  if (initials === null) errors.push('profile.initials');
  const lines = p?.tagline;
  let tagline = [];
  if (!Array.isArray(lines) || lines.length > 3 || lines.some((x) => text(x, 0, 120) === null)) {
    errors.push('profile.tagline');
  } else {
    tagline = lines.map((x) => x.trim()).filter(Boolean);
  }

  let links = [];
  if (!Array.isArray(input?.links) || input.links.length > 30) {
    errors.push('links');
  } else {
    links = input.links.map((k, i) => {
      const link = {
        id: `l${i + 1}`,
        icon: text(k?.icon ?? '', 0, 8),
        url: httpsUrl(k?.url),
        primary: k?.primary === true,
        title: text(k?.title, 1, 80),
        subtitle: text(k?.subtitle ?? '', 0, 120),
      };
      for (const field of ['icon', 'url', 'title', 'subtitle']) {
        if (link[field] === null) errors.push(`links.${i}.${field}`);
      }
      return link;
    });
  }

  let socials = [];
  if (!Array.isArray(input?.socials) || input.socials.length > 10) {
    errors.push('socials');
  } else {
    socials = input.socials.map((s, i) => {
      const social = {
        id: `s${i + 1}`,
        network: NETWORKS.includes(s?.network) ? s.network : null,
        handle: text(s?.handle, 1, 40),
        url: httpsUrl(s?.url),
      };
      for (const field of ['network', 'handle', 'url']) {
        if (social[field] === null) errors.push(`socials.${i}.${field}`);
      }
      return social;
    });
  }

  return { content: { profile: { name, initials, tagline }, links, socials }, errors };
}

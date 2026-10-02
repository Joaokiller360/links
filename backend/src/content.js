import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJsonAtomic } from './store.js';

// El contenido se edita desde el panel /#/admin y se guarda en data/content.json.
// Esto es solo el contenido inicial mientras ese archivo no existe.
export const SUPPORTED_LANGS = ['es', 'pt'];
export const NETWORKS = ['instagram', 'tiktok', 'youtube', 'x', 'github', 'linkedin', 'otro'];

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'content.json');

const DEFAULT_CONTENT = {
  profile: {
    name: 'Tu Nombre',
    initials: 'TN',
    tagline: {
      es: ['Una frase corta sobre ti.', 'Lo que haces o lo que te gusta.'],
      pt: ['Uma frase curta sobre você.', 'O que você faz ou do que gosta.'],
    },
  },
  links: [
    {
      id: 'l1',
      icon: '🌐',
      url: 'https://example.com/',
      primary: true,
      title: { es: 'Mi web personal', pt: 'Meu site pessoal' },
      subtitle: { es: 'Todo sobre mí en un solo lugar', pt: 'Tudo sobre mim em um só lugar' },
    },
    {
      id: 'l2',
      icon: '💬',
      url: 'https://wa.me/10000000000',
      primary: false,
      title: { es: 'Escríbeme por WhatsApp', pt: 'Fale comigo pelo WhatsApp' },
      subtitle: { es: 'Respondo rápido', pt: 'Respondo rápido' },
    },
    {
      id: 'l3',
      icon: '✍️',
      url: 'https://example.com/blog',
      primary: false,
      title: { es: 'Mi blog', pt: 'Meu blog' },
      subtitle: { es: 'Notas, ideas y lo que voy aprendiendo', pt: 'Notas, ideias e o que venho aprendendo' },
    },
  ],
  socials: [
    { id: 's1', network: 'instagram', handle: '@tu_usuario', url: 'https://instagram.com/tu_usuario' },
  ],
};

let cache = null;

export async function loadContent() {
  if (!cache) cache = await readJson(FILE, DEFAULT_CONTENT);
  return cache;
}

export async function saveContent(content) {
  await writeJsonAtomic(FILE, content);
  cache = content;
}

export function localize(content, lang) {
  const l = SUPPORTED_LANGS.includes(lang) ? lang : 'es';
  const { profile, links, socials } = content;
  return {
    lang: l,
    profile: { name: profile.name, initials: profile.initials, tagline: profile.tagline[l] },
    links: links.map(({ title, subtitle, ...rest }) => ({ ...rest, title: title[l], subtitle: subtitle[l] })),
    socials,
  };
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

function translated(value, min, max) {
  const out = {};
  for (const l of SUPPORTED_LANGS) {
    const v = text(value?.[l], min, max);
    if (v === null) return null;
    out[l] = v;
  }
  return out;
}

// Reconstruye el contenido campo por campo; nada del input se copia sin validar.
export function validateContent(input) {
  const errors = [];
  const p = input?.profile;
  const name = text(p?.name, 1, 60);
  const initials = text(p?.initials, 1, 3);
  if (name === null) errors.push('profile.name');
  if (initials === null) errors.push('profile.initials');
  const tagline = {};
  for (const l of SUPPORTED_LANGS) {
    const lines = p?.tagline?.[l];
    if (!Array.isArray(lines) || lines.length > 3 || lines.some((x) => text(x, 0, 120) === null)) {
      errors.push(`profile.tagline.${l}`);
    } else {
      tagline[l] = lines.map((x) => x.trim()).filter(Boolean);
    }
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
        title: translated(k?.title, 1, 80),
        subtitle: translated(k?.subtitle, 0, 120),
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

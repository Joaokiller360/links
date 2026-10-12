import { readFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileAtomic } from './store.js';

// La foto de perfil se guarda tal cual en data/avatar; el tipo se deduce de sus bytes.
const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'avatar');

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const AVATAR_MAX_BYTES = 1024 * 1024;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Solo se aceptan imágenes reconocibles por su firma, no por el Content-Type declarado.
export function imageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

let cache; // undefined = sin leer, null = no hay foto

export async function loadAvatar() {
  if (cache === undefined) {
    try {
      const data = await readFile(FILE);
      cache = { data, type: imageType(data) };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      cache = null;
    }
  }
  return cache;
}

export async function saveAvatar(data) {
  await writeFileAtomic(FILE, data);
  cache = { data, type: imageType(data) };
}

export async function deleteAvatar() {
  await unlink(FILE).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });
  cache = null;
}

import { LANGS } from '../i18n.js';

export default function LangToggle({ value, onChange }) {
  return (
    <div className="lang-toggle" role="group" aria-label="Idioma / Idioma">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={l === value ? 'active' : ''}
          aria-pressed={l === value}
          onClick={() => onChange(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { fetchLinks } from './api.js';
import { initialLang, persistLang, strings } from './i18n.js';
import Avatar from './components/Avatar.jsx';
import LangToggle from './components/LangToggle.jsx';
import LinkCard from './components/LinkCard.jsx';
import LeadForm from './components/LeadForm.jsx';
import SocialChip from './components/SocialChip.jsx';

export default function App() {
  const [lang, setLang] = useState(initialLang);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const t = strings[lang];
  const profile = content?.profile;

  useEffect(() => {
    document.documentElement.lang = lang;
    persistLang(lang);
  }, [lang]);

  useEffect(() => {
    if (profile?.name) document.title = profile.name;
  }, [profile?.name]);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(false);
    fetchLinks(lang, ctrl.signal)
      .then(setContent)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true);
      });
    return () => ctrl.abort();
  }, [lang, reload]);

  return (
    <main className="page">
      <header className="header">
        {profile ? (
          <>
            <Avatar initials={profile.initials} />
            <h1 className="name">{profile.name}</h1>
            <p className="tagline">
              {profile.tagline.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          </>
        ) : (
          <>
            <div className="avatar skeleton" />
            <div className="name-skeleton skeleton" />
          </>
        )}
        <LangToggle value={lang} onChange={setLang} />
      </header>

      <nav className="links" aria-busy={!content && !error}>
        {error ? (
          <div className="load-error">
            <span>{t.loadError}</span>
            <button type="button" onClick={() => setReload((n) => n + 1)}>
              {t.retry}
            </button>
          </div>
        ) : content ? (
          content.links.map((link) => <LinkCard key={link.id} {...link} />)
        ) : (
          Array.from({ length: 5 }, (_, i) => <div key={i} className="link-card skeleton" />)
        )}
      </nav>

      <LeadForm lang={lang} t={t} />

      {content?.socials?.length > 0 && (
        <div className="socials">
          {content.socials.map((s) => (
            <SocialChip key={s.id} {...s} />
          ))}
        </div>
      )}

      {profile && (
        <footer className="footer">
          <p>
            © {new Date().getFullYear()} {profile.name}
          </p>
        </footer>
      )}
    </main>
  );
}

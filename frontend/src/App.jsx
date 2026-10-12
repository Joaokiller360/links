import { useEffect, useState } from 'react';
import { avatarUrl, fetchLinks } from './api.js';
import { strings as t } from './strings.js';
import Avatar from './components/Avatar.jsx';
import LinkCard from './components/LinkCard.jsx';
import LeadForm from './components/LeadForm.jsx';
import SocialChip from './components/SocialChip.jsx';

export default function App() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const profile = content?.profile;

  useEffect(() => {
    if (profile?.name) document.title = profile.name;
  }, [profile?.name]);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(false);
    fetchLinks(ctrl.signal)
      .then(setContent)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true);
      });
    return () => ctrl.abort();
  }, [reload]);

  return (
    <main className="mx-auto max-w-[470px] px-4 pt-12 pb-14 max-[440px]:pt-9">
      <header className="flex flex-col items-center text-center">
        {profile ? (
          <>
            <Avatar initials={profile.initials} photo={avatarUrl(profile.avatar)} />
            <h1 className="mt-3.5 text-[22px] font-bold tracking-[-0.02em]">{profile.name}</h1>
            <p className="mt-2 text-sm leading-normal text-muted">
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
            <Avatar className="motion-safe:animate-pulse" />
            <div className="mt-3.5 mb-[50px] h-[22px] w-[140px] rounded-md bg-card motion-safe:animate-pulse" />
          </>
        )}
      </header>

      <nav className="mt-8 flex flex-col gap-3" aria-busy={!content && !error}>
        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4.5 py-4 text-[13px] text-muted">
            <span>{t.loadError}</span>
            <button
              className="cursor-pointer rounded-lg border border-line-hover px-3 py-1.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              type="button"
              onClick={() => setReload((n) => n + 1)}
            >
              {t.retry}
            </button>
          </div>
        ) : content ? (
          content.links.map((link) => <LinkCard key={link.id} {...link} />)
        ) : (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 rounded-xl border border-line bg-card motion-safe:animate-pulse" />
          ))
        )}
      </nav>

      <LeadForm />

      {content?.socials?.length > 0 && (
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {content.socials.map((s) => (
            <SocialChip key={s.id} {...s} />
          ))}
        </div>
      )}

      {profile && (
        <footer className="mt-8 text-center text-[11px] leading-[1.7] text-muted-2">
          <p>
            © {new Date().getFullYear()} {profile.name}
          </p>
        </footer>
      )}
    </main>
  );
}

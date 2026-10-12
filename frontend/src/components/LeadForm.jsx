import { useState } from 'react';
import { submitLead } from '../api.js';
import { strings as t } from '../strings.js';

const input =
  'h-[38px] min-w-0 flex-1 rounded-lg border border-line bg-page px-3 text-[13px] text-ink placeholder:text-muted-2 focus:border-brand focus:outline-none aria-invalid:border-danger motion-safe:transition-colors max-[440px]:w-full max-[440px]:flex-none';

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export default function LeadForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [fieldError, setFieldError] = useState(null); // 'name' | 'email' | null

  async function handleSubmit(e) {
    e.preventDefault();
    if (name.trim().length < 2) return setFieldError('name');
    if (!EMAIL_RE.test(email.trim())) return setFieldError('email');
    setFieldError(null);
    setStatus('sending');
    try {
      await submitLead({ name, email });
      setStatus('done');
    } catch (err) {
      if (err.fields?.name) setFieldError('name');
      else if (err.fields?.email) setFieldError('email');
      setStatus('error');
    }
  }

  const message =
    status === 'done'
      ? t.success
      : fieldError === 'name'
        ? t.invalidName
        : fieldError === 'email'
          ? t.invalidEmail
          : status === 'error'
            ? t.error
            : null;

  return (
    <section className="mt-6 rounded-xl border border-line bg-card p-4.5">
      <h2 className="mb-3 text-[13px] font-semibold">
        <span aria-hidden="true">📬</span> {t.contactTitle}
      </h2>
      {status === 'done' ? (
        <p className="text-[12.5px] text-brand" role="status">
          {message}
        </p>
      ) : (
        <form className="flex gap-2 max-[440px]:flex-col" onSubmit={handleSubmit} noValidate>
          <input
            className={input}
            type="text"
            name="name"
            autoComplete="name"
            maxLength={100}
            placeholder={t.namePlaceholder}
            aria-label={t.namePlaceholder}
            aria-invalid={fieldError === 'name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={input}
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            placeholder={t.emailPlaceholder}
            aria-label={t.emailPlaceholder}
            aria-invalid={fieldError === 'email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="h-[38px] flex-none cursor-pointer rounded-lg bg-brand px-4 text-[13px] font-bold text-brand-ink not-disabled:hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-progress disabled:opacity-70 motion-safe:transition-colors max-[440px]:w-full"
            type="submit"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? t.sending : t.submit}
          </button>
        </form>
      )}
      {status !== 'done' && message && (
        <p className="mt-2.5 text-[12.5px] text-danger-soft" role="alert">
          {message}
        </p>
      )}
    </section>
  );
}

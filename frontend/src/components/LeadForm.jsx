import { useState } from 'react';
import { submitLead } from '../api.js';
import { strings as t } from '../strings.js';

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
    <section className="lead">
      <h2 className="lead-title">
        <span aria-hidden="true">📬</span> {t.contactTitle}
      </h2>
      {status === 'done' ? (
        <p className="lead-msg success" role="status">
          {message}
        </p>
      ) : (
        <form className="lead-form" onSubmit={handleSubmit} noValidate>
          <input
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
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t.sending : t.submit}
          </button>
        </form>
      )}
      {status !== 'done' && message && (
        <p className="lead-msg error" role="alert">
          {message}
        </p>
      )}
    </section>
  );
}

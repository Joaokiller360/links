import { safeUrl } from '../safeUrl.js';

export default function LinkCard({ icon, title, subtitle, url, primary }) {
  return (
    <a
      className={`link-card${primary ? ' primary' : ''}`}
      href={safeUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="link-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="link-text">
        <span className="link-title">{title}</span>
        {subtitle && <span className="link-subtitle">{subtitle}</span>}
      </span>
      <svg className="link-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M5 12h14M13 6l6 6-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

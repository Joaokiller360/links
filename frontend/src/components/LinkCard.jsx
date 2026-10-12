import { safeUrl } from '../safeUrl.js';

export default function LinkCard({ icon, title, subtitle, url, primary }) {
  return (
    <a
      className={`group flex min-h-16 items-center gap-3.5 rounded-xl border px-4.5 py-3 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:transition ${
        primary
          ? 'border-brand bg-brand text-brand-ink hover:border-brand-hover hover:bg-brand-hover'
          : 'border-line bg-card hover:border-line-hover hover:bg-card-hover'
      }`}
      href={safeUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="w-5.5 flex-none text-center text-lg" aria-hidden="true">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-sm ${primary ? 'font-medium' : 'font-semibold'}`}>{title}</span>
        {subtitle && (
          <span className={`text-[11.5px] ${primary ? 'text-brand-ink/75' : 'text-muted-2'}`}>{subtitle}</span>
        )}
      </span>
      <svg
        className={`flex-none group-hover:translate-x-0.5 motion-safe:transition ${
          primary ? 'text-brand-ink/75' : 'text-muted-2 group-hover:text-ink'
        }`}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
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

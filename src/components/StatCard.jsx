import PropTypes from 'prop-types';
import { useId } from 'react';

const ACCENT_CONFIG = Object.freeze({
  sky: Object.freeze({
    container: 'border-sky-200',
    icon: 'bg-sky-100 text-sky-700',
  }),
  violet: Object.freeze({
    container: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-700',
  }),
  emerald: Object.freeze({
    container: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-700',
  }),
  amber: Object.freeze({
    container: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-700',
  }),
});

function ChartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4.5 19.5V12h4v7.5m3.5 0V4.5h4v15m3.5 0V8.25h-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M3 19.5h18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export default function StatCard({
  title,
  value,
  subtitle = null,
  icon = null,
  accent = 'sky',
}) {
  const titleId = useId();
  const config = ACCENT_CONFIG[accent] ?? ACCENT_CONFIG.sky;

  return (
    <article
      aria-labelledby={titleId}
      className={`flex h-full items-start gap-4 rounded-xl border bg-white p-5 shadow-sm sm:p-6 ${config.container}`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.icon}`}
      >
        {icon ?? <ChartIcon />}
      </span>

      <div className="min-w-0 flex-1">
        <h2
          className="text-sm font-semibold text-slate-600"
          id={titleId}
        >
          {title}
        </h2>
        <p className="mt-1 break-words text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {subtitle ? (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
    </article>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  accent: PropTypes.oneOf([
    'sky',
    'violet',
    'emerald',
    'amber',
  ]),
};
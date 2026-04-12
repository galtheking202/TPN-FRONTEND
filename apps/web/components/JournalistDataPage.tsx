import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { newsService } from '../services/newsService';
import type { IngestByChannelResponse, ChannelGroup, IngestReport } from '../services/newsService';

// ── Theme ─────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#FF6B35',
  Economy: '#00C896',
  Health: '#FF4D6D',
  Technology: '#0057FF',
  Environment: '#3DBF6E',
  'Defence and Security': '#9747FF',
  Sports: '#FFB800',
  Intelligence: '#FF3333',
  Cyber: '#00D4FF',
  Finance: '#00C896',
};

const PLATFORM_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  telegram: { bg: '#0057FF18', border: '#0057FF44', text: '#0057FF', label: 'telegram' },
  twitter:  { bg: '#38BDF818', border: '#38BDF844', text: '#38BDF8', label: 'x / twitter' },
  x:        { bg: '#38BDF818', border: '#38BDF844', text: '#38BDF8', label: 'x / twitter' },
  unknown:  { bg: '#50507018', border: '#50507044', text: '#505070', label: 'unknown' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeDate(s: string): Date {
  return new Date(/[Z+\-]\d*$/.test(s) ? s : s + 'Z');
}

function timeAgo(dateString: string | undefined): string {
  if (!dateString) return '';
  const diff = Date.now() - normalizeDate(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return normalizeDate(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(s: string): string {
  return normalizeDate(s).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── IngestReportCard ──────────────────────────────────────────────────────────

function IngestReportCard({ report }: { report: IngestReport }) {
  const { t } = useTranslation();
  const catColor = CATEGORY_COLORS[report.category] ?? '#0057FF';

  return (
    <article className="bg-[#111118] border border-[#1E1E2A] rounded-xl p-4 space-y-2.5">
      {/* Top line: category badge + location + timestamp */}
      <div className="flex items-center flex-wrap gap-2">
        <span
          className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded shrink-0"
          style={{ color: catColor, background: catColor + '22', border: `1px solid ${catColor}44` }}
        >
          {report.category}
        </span>
        {report.location_name && (
          <span className="flex items-center gap-1 text-[11px] text-[#A8A8C0] min-w-0">
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="shrink-0 text-[#505070]" aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="truncate">{report.location_name}</span>
          </span>
        )}
        <span
          className="text-[10px] text-[#505070] ml-auto shrink-0 cursor-default"
          title={formatDateTime(report.created_at)}
        >
          {timeAgo(report.created_at)}
        </span>
      </div>

      {/* Report body */}
      <p className="text-[13px] text-[#A8A8C0] leading-relaxed">{report.report_txt}</p>

      {/* Key points */}
      {report.key_points && report.key_points.length > 0 && (
        <ul className="space-y-1 pl-1">
          {report.key_points.map((point, i) => (
            <li key={i} className="text-[12px] text-[#A8A8C0] leading-relaxed flex gap-2">
              <span className="text-[#0057FF] shrink-0 select-none mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Updated tag */}
      {report.updated_at && (
        <div className="pt-0.5">
          <span
            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded cursor-default"
            style={{ color: '#FFB800', background: '#FFB80018', border: '1px solid #FFB80044' }}
            title={formatDateTime(report.updated_at)}
          >
            {t('journalist.updated', { time: timeAgo(report.updated_at) })}
          </span>
        </div>
      )}
    </article>
  );
}

// ── ChannelSection ────────────────────────────────────────────────────────────

function ChannelSection({ group }: { group: ChannelGroup }) {
  const [expanded, setExpanded] = useState(true);
  const platform = group.platform ?? 'unknown';
  const ps = PLATFORM_STYLES[platform] ?? PLATFORM_STYLES.unknown;
  const count = group.reports.length;

  return (
    <section className="border border-[#1E1E2A] rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#111118] hover:bg-[#16161F] transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0057FF]"
        aria-expanded={expanded}
      >
        <span className="font-bold text-white text-[14px] flex-1 truncate min-w-0">
          {group.channel_name}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0"
          style={{ color: ps.text, background: ps.bg, border: `1px solid ${ps.border}` }}
        >
          {ps.label}
        </span>
        <span className="text-[11px] text-[#505070] shrink-0">
          ({count} {count === 1 ? 'report' : 'reports'})
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#505070" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Reports list */}
      {expanded && (
        <div className="p-4 space-y-3 bg-[#0A0A0F]">
          {group.reports.map(report => (
            <IngestReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── JournalistDataPage ────────────────────────────────────────────────────────

export default function JournalistDataPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<IngestByChannelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    newsService
      .fetchIngestByChannel()
      .then(result => { setData(result); })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-4" aria-busy="true">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#0057FF]"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-[#505070] text-sm font-bold tracking-widest uppercase mono">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-24 text-center border-2 border-dashed border-[#0057FF]/30 rounded-xl">
        <p className="text-[#A8A8C0] text-sm">{t('journalist.no_data')}</p>
      </div>
    );
  }

  if (data.channels.length === 0) {
    return (
      <div className="py-24 text-center border border-[#1E1E2A] rounded-xl">
        <p className="text-[#A8A8C0] text-sm">{t('journalist.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-[12px] text-[#505070] font-medium">
        {t('journalist.summary', { count: data.total_reports, channels: data.channels.length })}
      </p>

      {/* Channel sections */}
      <div className="space-y-3">
        {data.channels.map(group => (
          <ChannelSection key={group.channel_name} group={group} />
        ))}
      </div>
    </div>
  );
}

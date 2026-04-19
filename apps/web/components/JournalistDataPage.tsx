import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { newsService } from '../services/newsService';
import type { IngestByChannelResponse, ChannelGroup, IngestReport } from '../services/newsService';

// ── Theme ─────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { solid: string; soft: string; ink: string }> = {
  Politics:               { solid: '#C06B4A', soft: '#F3DDD0', ink: '#8A3D1E' },
  Economy:                { solid: '#5A9A8A', soft: '#DCEDE8', ink: '#36695C' },
  Health:                 { solid: '#C4798A', soft: '#F1DAE0', ink: '#8B4757' },
  Technology:             { solid: '#6B85C7', soft: '#D8E0F0', ink: '#3F5490' },
  Environment:            { solid: '#7BA381', soft: '#DDE9DE', ink: '#466B4D' },
  'Defence and Security': { solid: '#8A7AB0', soft: '#E4DEEC', ink: '#564479' },
  Sports:                 { solid: '#C99A4C', soft: '#F2E4C8', ink: '#8A6824' },
  Intelligence:           { solid: '#C46A5E', soft: '#F5D9D2', ink: '#8B3D35' },
  Cyber:                  { solid: '#6B85C7', soft: '#D8E0F0', ink: '#3F5490' },
  Finance:                { solid: '#5A9A8A', soft: '#DCEDE8', ink: '#36695C' },
};

const PLATFORM_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  telegram: { bg: '#D8E0F0', border: '#6B85C744', text: '#3F5490', label: 'telegram' },
  twitter:  { bg: '#D6EAF5', border: '#7BA5C744', text: '#2E5F7A', label: 'x / twitter' },
  x:        { bg: '#D6EAF5', border: '#7BA5C744', text: '#2E5F7A', label: 'x / twitter' },
  website:  { bg: '#F3EFE7', border: '#8A826F44', text: '#5C5648', label: 'website' },
  rss:      { bg: '#F3EFE7', border: '#8A826F44', text: '#5C5648', label: 'rss' },
  unknown:  { bg: '#F3EFE7', border: '#8A826F44', text: '#5C5648', label: 'unknown' },
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
  const cat = CATEGORY_COLORS[report.category] ?? { solid: '#6B85C7', soft: '#D8E0F0', ink: '#3F5490' };

  return (
    <article className="bg-white border border-[#E8E2D6] rounded-xl p-4 space-y-2.5" style={{ boxShadow: '0 1px 2px rgba(60,45,20,0.06)' }}>
      {/* Top line: category badge + location + timestamp */}
      <div className="flex items-center flex-wrap gap-2">
        <span
          className="category-badge shrink-0"
          style={{ background: cat.soft, color: cat.ink }}
        >
          {report.category}
        </span>
        {report.location_name && (
          <span className="flex items-center gap-1 text-[11px] text-[#5C5648] min-w-0">
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="shrink-0 text-[#8A826F]" aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="truncate">{report.location_name}</span>
          </span>
        )}
        <span
          className="text-[11px] text-[#8A826F] ml-auto shrink-0 cursor-default"
          title={formatDateTime(report.created_at)}
        >
          {timeAgo(report.created_at)}
        </span>
      </div>

      {/* Report body */}
      <p className="text-[13px] text-[#5C5648] leading-relaxed">{report.report_txt}</p>

      {/* Key points */}
      {report.key_points && report.key_points.length > 0 && (
        <ul className="space-y-1 pl-1">
          {report.key_points.map((point, i) => (
            <li key={i} className="text-[12px] text-[#5C5648] leading-relaxed flex gap-2">
              <span className="text-[#6B85C7] shrink-0 select-none mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Updated tag */}
      {report.updated_at && (
        <div className="pt-0.5">
          <span
            className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full cursor-default"
            style={{ color: '#8A6824', background: '#F2E4C8', border: '1px solid #C99A4C44' }}
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
  const platform = (group.platform ?? 'unknown').toLowerCase();
  const ps = PLATFORM_STYLES[platform] ?? PLATFORM_STYLES.unknown;
  const count = group.reports.length;

  return (
    <section className="border border-[#E8E2D6] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(60,45,20,0.06)' }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F3EFE7] transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B85C7]"
        aria-expanded={expanded}
      >
        <span className="font-semibold text-[#1F1B16] text-[14px] flex-1 truncate min-w-0">
          {group.channel_name}
        </span>
        <span
          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
          style={{ color: ps.text, background: ps.bg, border: `1px solid ${ps.border}` }}
        >
          {ps.label}
        </span>
        <span className="text-[11px] text-[#8A826F] shrink-0">
          {count} {count === 1 ? 'report' : 'reports'}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#8A826F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Reports list */}
      {expanded && (
        <div className="p-4 space-y-3 bg-[#FAF7F2]">
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
              className="w-2 h-2 rounded-full bg-[#6B85C7]"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-[#8A826F] text-sm font-medium">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-24 text-center border-2 border-dashed border-[#6B85C7]/30 rounded-xl">
        <p className="text-[#5C5648] text-sm">{t('journalist.no_data')}</p>
      </div>
    );
  }

  if (data.channels.length === 0) {
    return (
      <div className="py-24 text-center border border-[#E8E2D6] rounded-xl bg-white">
        <p className="text-[#5C5648] text-sm">{t('journalist.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-[12px] text-[#8A826F] font-medium">
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

import React, { useMemo, useState } from 'react';

// ─── Theme ────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#C06B4A',
  Economy: '#00C896',
  Health: '#FF4D6D',
  Technology: '#6B85C7',
  Environment: '#3DBF6E',
  'Defence and Security': '#8A7AB0',
  Sports: '#FFB800',
  Intelligence: '#C46A5E',
  Cyber: '#00D4FF',
  Finance: '#00C896',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface IngestReport {
  id: string;
  channel: string;
  channelType: 'Telegram' | 'Twitter' | 'Forum' | 'Dark Web' | 'News Wire';
  category: string;
  report: string;
  timestamp: string;
  lastUpdated: string;
  keywords: string[];
  credibility: number;
  isUrgent: boolean;
  region: string;
}

const MOCK_REPORTS: IngestReport[] = [
  {
    id: '1',
    channel: '@geopolitics_now',
    channelType: 'Telegram',
    category: 'Politics',
    report:
      'Senior officials from three NATO member states convened an unscheduled emergency session in Brussels on Tuesday evening. Sources indicate the session lasted over six hours and centered on military posture adjustments in the eastern flank. No official statement has been released.',
    timestamp: '2026-03-29T07:14:00Z',
    lastUpdated: '2026-03-29T09:02:00Z',
    keywords: ['NATO', 'Brussels', 'military', 'eastern flank'],
    credibility: 8,
    isUrgent: true,
    region: 'Europe',
  },
  {
    id: '2',
    channel: 'FinanceLeaks_Wire',
    channelType: 'Telegram',
    category: 'Finance',
    report:
      'Internal memo from a major European investment bank suggests exposure to sovereign debt in three emerging markets exceeds regulatory thresholds. The memo, dated March 25, references stress-test scenarios not yet disclosed to regulators.',
    timestamp: '2026-03-29T05:48:00Z',
    lastUpdated: '2026-03-29T06:30:00Z',
    keywords: ['bank', 'sovereign debt', 'regulatory', 'exposure'],
    credibility: 6,
    isUrgent: false,
    region: 'Europe',
  },
  {
    id: '3',
    channel: 'CyberWatch_Intel',
    channelType: 'Forum',
    category: 'Cyber',
    report:
      'A previously undocumented threat actor designated TA-2291 has been observed deploying a new loader variant targeting critical infrastructure operators in the Gulf region. The loader uses certificate pinning to evade common sandbox detection.',
    timestamp: '2026-03-28T22:31:00Z',
    lastUpdated: '2026-03-29T01:15:00Z',
    keywords: ['threat actor', 'loader', 'critical infrastructure', 'Gulf', 'sandbox'],
    credibility: 9,
    isUrgent: true,
    region: 'Middle East',
  },
  {
    id: '4',
    channel: '@defence_pulse',
    channelType: 'Telegram',
    category: 'Defence and Security',
    report:
      'Satellite imagery analysis from a third-party firm indicates increased logistics activity at a military depot 80 km north of the border. The activity pattern is consistent with pre-positioning of armored units. Assessment confidence: moderate.',
    timestamp: '2026-03-28T18:05:00Z',
    lastUpdated: '2026-03-28T20:40:00Z',
    keywords: ['satellite', 'military depot', 'armored', 'logistics', 'border'],
    credibility: 7,
    isUrgent: false,
    region: 'Eastern Europe',
  },
  {
    id: '5',
    channel: 'AP Diplomatic Feed',
    channelType: 'News Wire',
    category: 'Politics',
    report:
      'The foreign ministry of Country X denied reports of back-channel negotiations with a regional rival, calling the claims "categorically false." Three diplomatic sources speaking anonymously confirmed talks are ongoing through a third-party mediator.',
    timestamp: '2026-03-28T14:22:00Z',
    lastUpdated: '2026-03-28T16:55:00Z',
    keywords: ['diplomacy', 'negotiations', 'foreign ministry', 'back-channel'],
    credibility: 8,
    isUrgent: false,
    region: 'Asia',
  },
  {
    id: '6',
    channel: 'darknet_chatter_bot',
    channelType: 'Dark Web',
    category: 'Intelligence',
    report:
      'Chatter on a monitored dark web forum references a planned coordinated operation targeting financial messaging infrastructure. Specifics remain vague but multiple independent handles have corroborated the timeline as "within 30 days."',
    timestamp: '2026-03-28T09:50:00Z',
    lastUpdated: '2026-03-28T13:22:00Z',
    keywords: ['dark web', 'financial', 'messaging infrastructure', 'coordinated'],
    credibility: 4,
    isUrgent: true,
    region: 'Global',
  },
  {
    id: '7',
    channel: '@health_signals_mena',
    channelType: 'Telegram',
    category: 'Health',
    report:
      'Local health authorities in two provinces have imposed movement restrictions following a cluster of unspecified respiratory illness. Regional WHO office has dispatched a rapid response team. Case count is unconfirmed but estimated at over 400.',
    timestamp: '2026-03-27T21:10:00Z',
    lastUpdated: '2026-03-28T07:45:00Z',
    keywords: ['WHO', 'respiratory', 'restrictions', 'cluster', 'outbreak'],
    credibility: 7,
    isUrgent: true,
    region: 'MENA',
  },
  {
    id: '8',
    channel: 'EconWatch_Global',
    channelType: 'Twitter',
    category: 'Economy',
    report:
      'Preliminary Q1 trade data from a G20 member shows a 14% contraction in exports, significantly below consensus estimates. The data has not yet been officially published; figures cited from an early government briefing document.',
    timestamp: '2026-03-27T16:45:00Z',
    lastUpdated: '2026-03-27T19:10:00Z',
    keywords: ['trade', 'G20', 'exports', 'contraction', 'Q1'],
    credibility: 6,
    isUrgent: false,
    region: 'Global',
  },
  {
    id: '9',
    channel: 'TechInsider_Wire',
    channelType: 'News Wire',
    category: 'Technology',
    report:
      'A major cloud provider experienced a partial outage affecting government-tier contracts in two regions for approximately 90 minutes. Internal post-mortem cites a misconfigured routing table update pushed during a routine maintenance window.',
    timestamp: '2026-03-27T11:30:00Z',
    lastUpdated: '2026-03-27T14:05:00Z',
    keywords: ['cloud', 'outage', 'government', 'routing', 'maintenance'],
    credibility: 9,
    isUrgent: false,
    region: 'North America',
  },
  {
    id: '10',
    channel: '@environ_watch',
    channelType: 'Telegram',
    category: 'Environment',
    report:
      'An NGO monitoring industrial discharge reports elevated toxin levels in a river basin shared by two nations. The readings, taken over three consecutive days, exceed safe limits by a factor of 6. Neither government has responded to press inquiries.',
    timestamp: '2026-03-26T08:00:00Z',
    lastUpdated: '2026-03-26T11:30:00Z',
    keywords: ['environment', 'toxin', 'river', 'discharge', 'NGO'],
    credibility: 7,
    isUrgent: false,
    region: 'Central Asia',
  },
];

const ALL_KEYWORDS = Array.from(
  new Set(MOCK_REPORTS.flatMap((r) => r.keywords)),
).sort();

const CHANNEL_TYPE_ICONS: Record<string, React.ReactNode> = {
  Telegram: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.604c-.15.666-.546.827-1.107.515l-3.062-2.256-1.478 1.42c-.163.163-.3.3-.615.3l.218-3.105 5.637-5.09c.245-.218-.053-.338-.38-.12L6.94 14.26l-3.01-.937c-.654-.204-.666-.654.136-.968l11.736-4.524c.546-.196 1.022.134.76.417z"/>
    </svg>
  ),
  Twitter: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Forum: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  'Dark Web': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  'News Wire': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
    </svg>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLocalTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function credibilityColor(score: number): string {
  if (score >= 7) return '#00C896';
  if (score >= 4) return '#FFB800';
  return '#C46A5E';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CredibilityBar({ score }: { score: number }) {
  const color = credibilityColor(score);
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: 2,
              backgroundColor: i < score ? color : 'transparent',
              border: `1px solid ${i < score ? color : '#E8E2D6'}`,
            }}
          />
        ))}
      </div>
      <span style={{ color, fontSize: 10, fontWeight: 700, marginLeft: 4 }}>
        {score}/10
      </span>
    </div>
  );
}

function ReportCard({ item }: { item: IngestReport }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[item.category] ?? '#6B85C7';

  return (
    <article
      onClick={() => setExpanded((v) => !v)}
      className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-xl p-4 cursor-pointer hover:border-[#D4CDBD] transition-colors"
      style={item.isUrgent ? { borderLeftWidth: 3, borderLeftColor: '#C46A5E' } : {}}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center justify-center rounded shrink-0"
            style={{ width: 22, height: 22, background: '#FFFDF9', border: '1px solid #E8E2D6', color: '#8A826F' }}
          >
            {CHANNEL_TYPE_ICONS[item.channelType]}
          </div>
          <span className="text-[#1F1B16] text-[13px] font-bold truncate">{item.channel}</span>
          <span
            className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded"
            style={{ color: '#8A826F', background: '#FFFDF9', border: '1px solid #E8E2D6' }}
          >
            {item.channelType}
          </span>
        </div>
        <span className="text-[10px] text-[#8A826F] shrink-0 ml-3">
          Last updated: {formatLocalTime(item.lastUpdated)}
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
        {item.isUrgent && (
          <span
            className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded"
            style={{ color: '#C46A5E', background: '#C46A5E22', border: '1px solid #C46A5E' }}
          >
            ● URGENT
          </span>
        )}
        <span
          className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
          style={{ color: catColor, background: catColor + '22', border: `1px solid ${catColor}` }}
        >
          {item.category}
        </span>
        <span
          className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded"
          style={{ color: '#8A826F', background: '#FFFDF9', border: '1px solid #E8E2D6' }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {item.region}
        </span>
      </div>

      {/* Report text */}
      <p
        className="text-[#5C5648] text-[13px] leading-relaxed mb-1"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
        } as React.CSSProperties}
      >
        {item.report}
      </p>

      {!expanded && (
        <p className="text-[#8A826F] text-[10px] font-semibold text-right mb-1">
          Click to expand ↓
        </p>
      )}

      {/* Keywords on expand */}
      {expanded && (
        <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
          {item.keywords.map((kw) => (
            <span
              key={kw}
              className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{ color: '#8A7AB0', background: '#9747FF18', border: '1px solid #9747FF44' }}
            >
              # {kw}
            </span>
          ))}
        </div>
      )}

      {/* Credibility */}
      <div className="flex items-center gap-2 pt-2.5 mt-1 border-t border-[#E8E2D6]">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A826F" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span className="text-[10px] font-semibold text-[#8A826F] mr-1">Credibility</span>
        <CredibilityBar score={item.credibility} />
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function JournalistSearchScreen({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(MOCK_REPORTS.map((r) => r.category))).sort(),
    [],
  );

  const toggleKeyword = (kw: string) => {
    setActiveKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw],
    );
  };

  const clearAll = () => {
    setQuery('');
    setActiveKeywords([]);
    setActiveCategory(null);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_REPORTS.filter((r) => {
      const matchesQuery =
        !q ||
        r.report.toLowerCase().includes(q) ||
        r.channel.toLowerCase().includes(q) ||
        r.keywords.some((k) => k.toLowerCase().includes(q));
      const matchesKeywords =
        activeKeywords.length === 0 ||
        activeKeywords.every((kw) =>
          r.keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase()),
        );
      const matchesCategory = !activeCategory || r.category === activeCategory;
      return matchesQuery && matchesKeywords && matchesCategory;
    });
  }, [query, activeKeywords, activeCategory]);

  const hasFilters = query.trim() || activeKeywords.length > 0 || activeCategory;

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="border-b border-[#E8E2D6] bg-[#FFFFFF] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg hover:bg-[#FFFDF9] transition-colors focus:outline-none"
            style={{ width: 32, height: 32, border: '1px solid #E8E2D6', color: '#5C5648' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 32, height: 32, background: '#6B85C718', border: '1px solid #6B85C744' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B85C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div>
            <p className="text-[#1F1B16] text-[13px] font-black tracking-[0.12em]">INGEST SEARCH</p>
            <p className="text-[#8A826F] text-[10px] font-medium">Journalist Intelligence Tool</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: '#FFFDF9', border: '1px solid #E8E2D6' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#8A826F]" />
          <span className="text-[9px] font-bold tracking-widest text-[#8A826F]">MOCK DATA</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="border-b border-[#E8E2D6] bg-[#FAF7F2] px-6 py-3 space-y-3 shrink-0">

        {/* Search bar */}
        <div
          className="flex items-center gap-2 rounded-xl px-3"
          style={{ background: '#FFFFFF', border: '1px solid #E8E2D6', height: 42 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A826F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports, channels, keywords…"
            className="flex-1 bg-transparent text-[#1F1B16] text-sm placeholder-[#8A826F] focus:outline-none"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#8A826F] hover:text-[#1F1B16] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {categories.map((cat) => {
            const color = CATEGORY_COLORS[cat] ?? '#6B85C7';
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(active ? null : cat)}
                className="shrink-0 text-[11px] font-bold px-3 py-1 rounded-full transition-colors focus:outline-none"
                style={{
                  color: active ? color : color + 'AA',
                  background: active ? color + '33' : color + '12',
                  border: `1px solid ${active ? color : color + '44'}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Keyword chips */}
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] text-[#8A826F] mb-1.5">KEYWORDS</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {ALL_KEYWORDS.map((kw) => {
              const active = activeKeywords.includes(kw);
              return (
                <button
                  key={kw}
                  onClick={() => toggleKeyword(kw)}
                  className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors focus:outline-none"
                  style={{
                    color: active ? '#8A7AB0' : '#8A826F',
                    background: active ? '#9747FF22' : '#FFFFFF',
                    border: `1px solid ${active ? '#9747FF88' : '#E8E2D6'}`,
                  }}
                >
                  # {kw}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Results header ── */}
      <div className="flex items-center justify-between px-6 py-2.5 shrink-0">
        <span className="text-[11px] font-semibold text-[#8A826F] tracking-wide">
          {results.length} {results.length === 1 ? 'report' : 'reports'} found
        </span>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#8A826F] hover:text-[#1F1B16] transition-colors px-2 py-1 rounded focus:outline-none"
            style={{ border: '1px solid #E8E2D6', background: '#FFFFFF' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Clear all
          </button>
        )}
      </div>

      {/* ── Results list ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-3">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 gap-3 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8A826F" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-[#5C5648] font-bold text-base">No reports found</p>
            <p className="text-[#8A826F] text-sm leading-relaxed max-w-xs">
              Try a different query or adjust your keyword filters.
            </p>
          </div>
        ) : (
          results.map((item) => <ReportCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

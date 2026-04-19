
import React, { useRef, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { NotifPrefs } from './NotificationDrawer';
import { SavedFilter } from '../types';

// ── Language drum (self-contained here) ───────────────────────────────────────

type LanguageCode = 'en' | 'he' | 'fr' | 'ru' | 'ar';

const LANGUAGE_OPTIONS: { code: LanguageCode; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'he', label: 'HE', name: 'עברית' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'ar', label: 'AR', name: 'العربية' },
];

const DRUM_ITEM_H = 36;

const LanguageDrum: React.FC<{ value: LanguageCode; onChange: (l: LanguageCode) => void }> = ({ value, onChange }) => {
  const N = LANGUAGE_OPTIONS.length;
  const [idx, setIdx] = useState(() => LANGUAGE_OPTIONS.findIndex(l => l.code === value));
  const stripRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const i = LANGUAGE_OPTIONS.findIndex(l => l.code === value);
    if (i !== idx) setIdx(i);
  }, [value]);

  const items5 = [
    LANGUAGE_OPTIONS[(idx - 2 + N) % N],
    LANGUAGE_OPTIONS[(idx - 1 + N) % N],
    LANGUAGE_OPTIONS[idx],
    LANGUAGE_OPTIONS[(idx + 1) % N],
    LANGUAGE_OPTIONS[(idx + 2) % N],
  ];

  const spin = (dir: 1 | -1) => {
    if (busyRef.current || !stripRef.current) return;
    busyRef.current = true;
    const el = stripRef.current;
    el.style.transition = 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)';
    el.style.transform = `translateY(${dir === 1 ? -2 * DRUM_ITEM_H : 0}px)`;
    setTimeout(() => {
      const newIdx = (idx + dir + N) % N;
      el.style.transition = 'none';
      el.style.transform = `translateY(${-DRUM_ITEM_H}px)`;
      flushSync(() => setIdx(newIdx));
      onChange(LANGUAGE_OPTIONS[newIdx].code);
      requestAnimationFrame(() => { busyRef.current = false; });
    }, 230);
  };

  return (
    <div className="flex flex-col items-center select-none w-full" dir="ltr">
      <button
        onClick={() => spin(-1)}
        className="w-full flex justify-center py-2 text-[#8A826F] hover:text-[#6B85C7] transition-colors focus:outline-none"
        aria-label="Previous language"
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true"><path d="M5 0L0 6h10z"/></svg>
      </button>

      <div
        className="relative overflow-hidden border border-[#E8E2D6] w-full rounded-lg"
        style={{ height: DRUM_ITEM_H * 3 }}
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          className="absolute inset-x-0 pointer-events-none z-10 border-t border-b border-[#6B85C7]/40"
          style={{ top: DRUM_ITEM_H, height: DRUM_ITEM_H }}
        />
        <div
          className="absolute inset-x-0 top-0 pointer-events-none z-10"
          style={{ height: DRUM_ITEM_H * 0.75, background: 'linear-gradient(to bottom, #FAF7F2 20%, transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
          style={{ height: DRUM_ITEM_H * 0.75, background: 'linear-gradient(to top, #FAF7F2 20%, transparent)' }}
        />
        <div ref={stripRef} style={{ transform: `translateY(${-DRUM_ITEM_H}px)` }}>
          {items5.map((item, i) => (
            <div
              key={item.code + '-' + i}
              style={{ height: DRUM_ITEM_H }}
              className={`flex items-center justify-between px-4 ${i === 2 ? 'text-[#1F1B16]' : 'text-[#8A826F]'}`}
            >
              <span className={`text-[11px] tracking-widest uppercase ${i === 2 ? 'font-black text-[#6B85C7]' : 'font-bold'}`}>
                {item.label}
              </span>
              <span className={`text-[10px] ${i === 2 ? 'font-medium' : 'font-normal'}`}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => spin(1)}
        className="w-full flex justify-center py-2 text-[#8A826F] hover:text-[#6B85C7] transition-colors focus:outline-none"
        aria-label="Next language"
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true"><path d="M5 6L0 0h10z"/></svg>
      </button>
    </div>
  );
};

// ── Toggle row ─────────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{ label: string; active: boolean; onChange: () => void; description?: string }> = ({
  label, active, onChange, description,
}) => (
  <div className="flex items-center justify-between py-3 border-b border-[#E8E2D6]/60 last:border-0">
    <div>
      <div className="text-[11px] font-bold tracking-widest uppercase text-[#5C5648]">{label}</div>
      {description && <div className="text-[10px] text-[#8A826F] mt-0.5">{description}</div>}
    </div>
    <button
      onClick={onChange}
      aria-pressed={active}
      className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B85C7] focus:ring-offset-1 focus:ring-offset-[#FFFFFF] shrink-0 ${active ? 'bg-[#6B85C7]' : 'bg-[#E8E2D6]'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

// ── Section header ──────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ label: string; badge?: number }> = ({ label, badge }) => (
  <div className="flex items-center gap-2 mb-3 pt-1">
    <div className="text-[10px] font-black tracking-widest uppercase text-[#6B85C7]">{label}</div>
    {badge != null && badge > 0 && (
      <span className="bg-[#6B85C7] text-white text-[9px] font-black px-1.5 py-0.5 leading-none rounded-full">{badge}</span>
    )}
  </div>
);

// ── Main drawer ────────────────────────────────────────────────────────────────

const NOTIF_CATEGORIES = ['Politics', 'Economy', 'Health', 'Technology', 'Environment', 'Defence and Security', 'Sports'];

interface SettingsDrawerProps {
  // Language
  language: LanguageCode;
  onLanguageChange: (l: LanguageCode) => void;
  // Saved filters
  savedFilters: SavedFilter[];
  onToggleFilter: (id: string) => void;
  onDeleteFilter: (id: string) => void;
  onOpenFilterBuilder: (filter?: SavedFilter) => void;
  // Notifications
  notifPrefs: NotifPrefs;
  regions: string[];
  onToggleCategory: (cat: string) => void;
  onToggleRegion: (region: string) => void;
  onUnpinArticle: (id: string) => void;
  // Auth
  isLoggedIn: boolean;
  onSignInPrompt: () => void;
  // Close
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  language, onLanguageChange,
  savedFilters, onToggleFilter, onDeleteFilter, onOpenFilterBuilder,
  notifPrefs, regions, onToggleCategory, onToggleRegion, onUnpinArticle,
  isLoggedIn, onSignInPrompt,
  onClose,
}) => {
  const { t } = useTranslation();
  const filteredRegions = regions.filter(r => r !== 'All Regions');
  const notifCount = notifPrefs.categories.length + notifPrefs.regions.length + notifPrefs.pinnedArticles.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-80 z-50 bg-[#FFFFFF] border-l border-[#E8E2D6] flex flex-col"
        role="dialog"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E2D6] shrink-0">
          <div className="text-[11px] font-semibold text-[#1F1B16]">Settings</div>
          <button
            onClick={onClose}
            className="text-[#8A826F] hover:text-[#1F1B16] transition-colors w-8 h-8 flex items-center justify-center"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

          {/* ── Language ── */}
          <section>
            <SectionHeader label={t('header.language_label', 'Language')} />
            <LanguageDrum value={language} onChange={onLanguageChange} />
          </section>

          {/* ── Filters ── */}
          <section>
            <SectionHeader label="Filters" badge={savedFilters.filter(f => f.enabled).length} />

            {savedFilters.length > 0 ? (
              <div>
                {savedFilters.map(filter => (
                  <div
                    key={filter.id}
                    className="flex items-center gap-2 py-3 border-b border-[#E8E2D6]/60 last:border-0"
                  >
                    {/* Name + meta — click to edit */}
                    <button
                      onClick={() => { onOpenFilterBuilder(filter); onClose(); }}
                      className="flex-1 text-left min-w-0 focus:outline-none"
                    >
                      <div className="text-[11px] font-bold text-[#5C5648] truncate">{filter.name}</div>
                      <div className="text-[9px] text-[#8A826F] mt-0.5">
                        {[
                          filter.categories.length > 0
                            ? `${filter.categories.length} categor${filter.categories.length === 1 ? 'y' : 'ies'}`
                            : 'All categories',
                          filter.regions.length > 0
                            ? `${filter.regions.length} region${filter.regions.length === 1 ? '' : 's'}`
                            : 'All regions',
                        ].join(' · ')}
                      </div>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteFilter(filter.id)}
                      className="text-[#8A826F] hover:text-[#5C5648] transition-colors shrink-0 p-1 focus:outline-none"
                      aria-label={`Delete filter: ${filter.name}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>

                    {/* Toggle */}
                    <button
                      onClick={() => onToggleFilter(filter.id)}
                      aria-pressed={filter.enabled}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-[#6B85C7] ${filter.enabled ? 'bg-[#6B85C7]' : 'bg-[#E8E2D6]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${filter.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-5 text-center border border-dashed border-[#E8E2D6] rounded-lg">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#8A826F]">No filters yet</p>
              </div>
            )}

            <button
              onClick={() => { onOpenFilterBuilder(); onClose(); }}
              className="w-full mt-3 py-2.5 border border-[#6B85C7] text-[10px] font-black tracking-widest uppercase text-[#6B85C7] hover:bg-[#6B85C7] hover:text-white transition-colors focus:outline-none rounded-lg"
            >
              + New Filter
            </button>
          </section>

          {/* ── Notifications ── */}
          <section>
            <SectionHeader label="Notifications" badge={notifCount} />

            {/* By Category */}
            <div className="mb-5">
              <div className="text-[9px] font-bold tracking-widest uppercase text-[#8A826F] mb-2">By Category</div>
              {NOTIF_CATEGORIES.map(cat => (
                <ToggleRow
                  key={cat}
                  label={t(`categories.${cat}`, cat)}
                  active={notifPrefs.categories.includes(cat)}
                  onChange={() => onToggleCategory(cat)}
                />
              ))}
            </div>

            {/* By Region */}
            {filteredRegions.length > 0 && (
              <div className="mb-5">
                <div className="text-[9px] font-bold tracking-widest uppercase text-[#8A826F] mb-2">By Region</div>
                {filteredRegions.map(region => (
                  <ToggleRow
                    key={region}
                    label={region}
                    active={notifPrefs.regions.includes(region)}
                    onChange={() => onToggleRegion(region)}
                  />
                ))}
              </div>
            )}

            {/* Pinned Articles */}
            {notifPrefs.pinnedArticles.length > 0 && (
              <div>
                <div className="text-[9px] font-bold tracking-widest uppercase text-[#8A826F] mb-2">
                  Pinned Articles ({notifPrefs.pinnedArticles.length})
                </div>
                {notifPrefs.pinnedArticles.map(article => (
                  <div
                    key={article.id}
                    className="flex items-start justify-between py-2.5 border-b border-[#E8E2D6]/60 gap-3 last:border-0"
                  >
                    <span className="text-[11px] text-[#5C5648] leading-relaxed line-clamp-2 flex-1">
                      {article.title}
                    </span>
                    <button
                      onClick={() => onUnpinArticle(article.id)}
                      className="text-[#8A826F] hover:text-[#5C5648] transition-colors shrink-0 mt-0.5"
                      aria-label={`Unpin: ${article.title}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {notifCount === 0 && (
              <div className="text-center py-6 text-[#8A826F]">
                <div className="text-2xl mb-2">🔔</div>
                <p className="text-[10px] font-bold tracking-widest uppercase">No subscriptions yet</p>
              </div>
            )}
          </section>
        </div>

        {/* Footer — sign-in nudge */}
        {!isLoggedIn && (
          <div className="px-6 py-4 border-t border-[#E8E2D6] bg-[#FAF7F2] shrink-0">
            <p className="text-[10px] text-[#8A826F] font-bold tracking-wide leading-relaxed mb-2">
              ⚠ Preferences saved locally. Sign in to sync across devices.
            </p>
            <button
              onClick={onSignInPrompt}
              className="text-[10px] text-[#6B85C7] font-black tracking-widest uppercase hover:underline"
            >
              Sign In →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SettingsDrawer;


import React from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES = ['Politics', 'Economy', 'Health', 'Technology', 'Environment', 'Defence and Security', 'Sports'];

export interface PinnedArticle {
  id: string;
  title: string;
}

export interface NotifPrefs {
  categories: string[];
  regions: string[];
  pinnedArticles: PinnedArticle[];
}

interface ToggleRowProps {
  label: string;
  active: boolean;
  onChange: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, active, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-[#EDEAE3]/60 last:border-0">
    <span className="text-[11px] font-bold tracking-widest uppercase text-[#1E1A14]/70">{label}</span>
    <button
      onClick={onChange}
      aria-pressed={active}
      className={`relative w-9 h-5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A843] focus:ring-offset-1 ${active ? 'bg-[#D4A843]' : 'bg-[#EDEAE3]'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-[#FAF7F0] shadow-sm transition-transform ${active ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
      />
    </button>
  </div>
);

interface NotificationDrawerProps {
  prefs: NotifPrefs;
  regions: string[];
  onToggleCategory: (cat: string) => void;
  onToggleRegion: (region: string) => void;
  onUnpinArticle: (id: string) => void;
  onClose: () => void;
  isLoggedIn: boolean;
  onSignInPrompt: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  prefs, regions, onToggleCategory, onToggleRegion, onUnpinArticle, onClose, isLoggedIn, onSignInPrompt,
}) => {
  const { t } = useTranslation();
  const activeCount = prefs.categories.length + prefs.regions.length + prefs.pinnedArticles.length;
  const filteredRegions = regions.filter(r => r !== 'All Regions');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#1E1A14]/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-80 z-50 bg-[#FAF7F0] border-l border-[#EDEAE3] flex flex-col"
        role="dialog"
        aria-label="Notification preferences"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDEAE3] shrink-0">
          <div>
            <div className="text-[11px] font-black tracking-widest uppercase text-[#1E1A14]">Notifications</div>
            {activeCount > 0 && (
              <div className="text-[10px] text-[#D4A843] font-bold tracking-widest mt-0.5">
                {activeCount} active subscription{activeCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#1E1A14]/40 hover:text-[#1E1A14] transition-colors text-lg leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* By Category */}
          <section>
            <div className="text-[10px] font-black tracking-widest uppercase text-[#D4A843] mb-3 flex items-center gap-2">
              <span>By Category</span>
              {prefs.categories.length > 0 && (
                <span className="bg-[#D4A843] text-[#1E1A14] text-[9px] font-black px-1.5 py-0.5 leading-none">
                  {prefs.categories.length}
                </span>
              )}
            </div>
            {CATEGORIES.map(cat => (
              <ToggleRow
                key={cat}
                label={t(`categories.${cat}`, cat)}
                active={prefs.categories.includes(cat)}
                onChange={() => onToggleCategory(cat)}
              />
            ))}
          </section>

          {/* By Region */}
          {filteredRegions.length > 0 && (
            <section>
              <div className="text-[10px] font-black tracking-widest uppercase text-[#D4A843] mb-3 flex items-center gap-2">
                <span>By Region</span>
                {prefs.regions.length > 0 && (
                  <span className="bg-[#D4A843] text-[#1E1A14] text-[9px] font-black px-1.5 py-0.5 leading-none">
                    {prefs.regions.length}
                  </span>
                )}
              </div>
              {filteredRegions.map(region => (
                <ToggleRow
                  key={region}
                  label={region}
                  active={prefs.regions.includes(region)}
                  onChange={() => onToggleRegion(region)}
                />
              ))}
            </section>
          )}

          {/* Pinned Articles */}
          {prefs.pinnedArticles.length > 0 && (
            <section>
              <div className="text-[10px] font-black tracking-widest uppercase text-[#D4A843] mb-3">
                Pinned Articles ({prefs.pinnedArticles.length})
              </div>
              <div className="space-y-0">
                {prefs.pinnedArticles.map(article => (
                  <div
                    key={article.id}
                    className="flex items-start justify-between py-2.5 border-b border-[#EDEAE3]/60 gap-3 last:border-0"
                  >
                    <span className="text-[11px] text-[#1E1A14]/70 leading-relaxed line-clamp-2 flex-1">
                      {article.title}
                    </span>
                    <button
                      onClick={() => onUnpinArticle(article.id)}
                      className="text-[#1E1A14]/30 hover:text-[#1E1A14]/60 transition-colors shrink-0 mt-0.5"
                      aria-label={`Unpin: ${article.title}`}
                      title="Unpin article"
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
            </section>
          )}

          {activeCount === 0 && (
            <div className="text-center py-8 text-[#1E1A14]/30">
              <div className="text-3xl mb-3">🔔</div>
              <p className="text-[11px] font-bold tracking-widest uppercase">No subscriptions yet</p>
              <p className="text-[10px] mt-1 tracking-wide">Toggle categories or regions above, or pin articles from the feed.</p>
            </div>
          )}
        </div>

        {/* Footer — sign-in nudge for guests */}
        {!isLoggedIn && (
          <div className="px-6 py-4 border-t border-[#EDEAE3] bg-[#EDEAE3]/40 shrink-0">
            <p className="text-[10px] text-[#1E1A14]/50 font-bold tracking-wide leading-relaxed mb-2">
              ⚠ Preferences saved locally. Sign in to sync across devices.
            </p>
            <button
              onClick={onSignInPrompt}
              className="text-[10px] text-[#D4A843] font-black tracking-widest uppercase hover:underline"
            >
              Sign In →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDrawer;

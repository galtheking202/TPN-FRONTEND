
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Article, SavedFilter } from './types';
import { newsService } from './services/newsService';
import ArticleCard from './components/ArticleCard';
import FullArticleView from './components/FullArticleView';
import LoginModal, { User } from './components/LoginModal';
import SettingsDrawer from './components/SettingsDrawer';
import { NotifPrefs } from './components/NotificationDrawer';
import FilterBuilderScreen from './components/FilterBuilderScreen';
import JournalistSearchScreen from './components/JournalistSearchScreen';
import JournalistDataPage from './components/JournalistDataPage';
import i18n from './i18n';

const _jm = String(import.meta.env.VITE_JOURNALIST_MODE ?? '').toLowerCase();
const JOURNALIST_MODE = _jm !== '' && _jm !== 'false' && _jm !== '0';

const CATEGORIES = ['ALL', 'Politics', 'Economy', 'Health', 'Technology', 'Environment', 'Defence and Security', 'Sports'] as const;
type LanguageCode = 'en' | 'he' | 'fr' | 'ru' | 'ar';

const CATEGORY_COLORS: Record<string, string> = {
  ALL: '#0057FF',
  Politics: '#FF6B35',
  Economy: '#00C896',
  Health: '#FF4D6D',
  Technology: '#0057FF',
  Environment: '#3DBF6E',
  'Defence and Security': '#9747FF',
  Sports: '#FFB800',
};

const EMPTY_NOTIF_PREFS: NotifPrefs = { categories: [], regions: [], pinnedArticles: [] };

const loadNotifPrefs = (): NotifPrefs => {
  try {
    const raw = localStorage.getItem('tpn_notif_prefs');
    return raw ? JSON.parse(raw) : EMPTY_NOTIF_PREFS;
  } catch { return EMPTY_NOTIF_PREFS; }
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [scrollState, setScrollState] = useState<'top' | 'up' | 'down'>('top');
  const prevScrollY = useRef(0);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);

  // Journalist search
  const [showJournalistSearch, setShowJournalistSearch] = useState(false);

  // View: 'feed' | 'journalist_data'
  const [activeView, setActiveView] = useState<'feed' | 'journalist_data'>('feed');

  // Saved filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const raw = localStorage.getItem('tpn_saved_filters');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [filterBuilderOpen, setFilterBuilderOpen] = useState(false);
  const [filterToEdit, setFilterToEdit] = useState<SavedFilter | undefined>(undefined);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Always dark ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // ── Load user from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tpn_user');
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // ── Persist notif prefs ───────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('tpn_notif_prefs', JSON.stringify(notifPrefs));
  }, [notifPrefs]);

  // ── Persist saved filters ─────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('tpn_saved_filters', JSON.stringify(savedFilters));
  }, [savedFilters]);

  // ── Close user menu on outside click ─────────────────────────────────────────
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
  }, []);

  const handleLogin = useCallback((u: User) => {
    setUser(u);
    setShowLogin(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('tpn_user');
    setUser(null);
    setShowUserMenu(false);
  }, []);

  const handleToggleCategory = useCallback((cat: string) => {
    setNotifPrefs(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  }, []);

  const handleToggleRegion = useCallback((region: string) => {
    setNotifPrefs(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }));
  }, []);

  const handleUnpinArticle = useCallback((id: string) => {
    setNotifPrefs(prev => ({
      ...prev,
      pinnedArticles: prev.pinnedArticles.filter(a => a.id !== id),
    }));
  }, []);

  const handleSaveFilter = useCallback((filter: SavedFilter) => {
    setSavedFilters(prev => {
      const idx = prev.findIndex(f => f.id === filter.id);
      return idx >= 0
        ? prev.map(f => f.id === filter.id ? filter : f)
        : [...prev, filter];
    });
  }, []);

  const handleToggleFilter = useCallback((id: string) => {
    setSavedFilters(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }, []);

  const handleDeleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleOpenFilterBuilder = useCallback((filter?: SavedFilter) => {
    setFilterToEdit(filter);
    setFilterBuilderOpen(true);
  }, []);

  const handlePinToggle = useCallback((id: string, title: string) => {
    setNotifPrefs(prev => {
      const already = prev.pinnedArticles.some(a => a.id === id);
      if (already) return { ...prev, pinnedArticles: prev.pinnedArticles.filter(a => a.id !== id) };
      if (!user) showToast('Saved locally. Sign in to sync across devices →');
      return { ...prev, pinnedArticles: [...prev.pinnedArticles, { id, title }] };
    });
  }, [user, showToast]);

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const [serverNews, aiNews] = await Promise.all([
        newsService.fetchArticles(),
        newsService.generateAIDispatches()
      ]);
      const allNews = [...serverNews, ...aiNews].sort(
        (a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
      );
      setArticles(allNews);
      setError(null);
    } catch {
      setError('feed.error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      if (current < 10) setScrollState('top');
      else if (current < prevScrollY.current) setScrollState('up');
      else setScrollState('down');
      prevScrollY.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!selectedArticle) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseArticle(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedArticle]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const results = await newsService.searchArticles(query);
        setArticles(results);
      } finally { setIsSearching(false); }
    } else {
      await loadNews();
    }
  }, [loadNews]);

  const regions = useMemo(() => {
    const set = new Set(articles.map(a => a.region).filter(Boolean) as string[]);
    return set.size > 0 ? ['All Regions', ...Array.from(set).sort()] : [];
  }, [articles]);

  const activeFilters = useMemo(() => savedFilters.filter(f => f.enabled), [savedFilters]);

  const filteredArticles = useMemo(() => {
    if (activeFilters.length > 0) {
      return articles.filter(article =>
        activeFilters.some(filter => {
          const catOk = filter.categories.length === 0 || filter.categories.includes(article.category ?? '');
          const regionOk = filter.regions.length === 0 || filter.regions.includes(article.region ?? '');
          return catOk && regionOk;
        })
      );
    }
    let result = selectedCategory === 'ALL' ? articles : articles.filter(a => a.category === selectedCategory);
    if (selectedRegion !== 'All Regions') result = result.filter(a => a.region === selectedRegion);
    return result;
  }, [articles, selectedCategory, selectedRegion, activeFilters]);

  const handleReadMore = useCallback((id: string) => {
    const article = articles.find(a => a.id === id);
    if (article) { setSelectedArticle(article); document.body.style.overflow = 'hidden'; }
  }, [articles]);

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    document.body.style.overflow = 'auto';
  };

  const notifBadge = notifPrefs.categories.length + notifPrefs.regions.length + notifPrefs.pinnedArticles.length;
  const pinnedIds = useMemo(() => new Set(notifPrefs.pinnedArticles.map(a => a.id)), [notifPrefs.pinnedArticles]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header
        className="border-b border-[#1E1E2A] bg-[#111118]/95 backdrop-blur-sm sticky top-0 z-40 transition-transform duration-300"
        style={{ transform: scrollState === 'down' ? 'translateY(-100%)' : 'translateY(0)' }}
      >
        {/* Top row */}
        <div
          className="max-w-6xl mx-auto px-6 flex flex-row justify-between items-center transition-all duration-300"
          style={{
            paddingTop: scrollState === 'top' ? '1.25rem' : '0.5rem',
            paddingBottom: scrollState === 'top' ? '1.25rem' : '0.5rem',
            gap: '1rem',
          }}
        >
          {/* Stacked branding */}
          <div className="flex flex-col items-start shrink-0 leading-none">
            <span
              className="block font-black tracking-[0.12em] text-white transition-all duration-300"
              style={{ fontSize: scrollState === 'top' ? '1.4rem' : '1rem' }}
            >
              nowvx
            </span>
          </div>

          {/* Search */}
          <div
            className="overflow-hidden transition-all duration-300 flex-1"
            style={{ maxWidth: scrollState !== 'down' ? '300px' : '0px', opacity: scrollState !== 'down' ? 1 : 0 }}
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  const y = window.scrollY;
                  requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
                }}
                placeholder={t('search.placeholder')}
                aria-label={t('search.aria')}
                className="w-full px-4 py-2 bg-[#1E1E2A] border border-[#1E1E2A] text-white placeholder-[#505070] focus:outline-none focus:ring-2 focus:ring-[#0057FF] text-sm rounded-lg"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                  <div className="w-4 h-4 border-2 border-[#0057FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 shrink-0" dir="ltr">

            {/* Live indicator */}
            <div
              className="text-[11px] mono font-bold tracking-widest text-[#0057FF] overflow-hidden transition-all duration-300 hidden sm:flex items-center gap-2 shrink-0"
              style={{ maxWidth: scrollState === 'top' ? '80px' : '0px', opacity: scrollState === 'top' ? 1 : 0 }}
              aria-hidden="true"
            >
              <span className="w-2 h-2 rounded-full bg-[#0057FF] animate-pulse shrink-0"></span>
              {t('header.live')}
            </div>

            {/* Journalist search button */}
            <button
              onClick={() => setShowJournalistSearch(true)}
              className="relative text-white/40 hover:text-white transition-colors focus:outline-none"
              aria-label="Journalist ingest search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </button>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="relative text-white/40 hover:text-white transition-colors focus:outline-none"
              aria-label={`Settings${notifBadge > 0 ? `, ${notifBadge} active notifications` : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              {notifBadge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#0057FF] text-white text-[9px] font-black flex items-center justify-center px-0.5 rounded-full">
                  {notifBadge > 9 ? '9+' : notifBadge}
                </span>
              )}
            </button>

            {/* User */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="w-7 h-7 bg-[#0057FF] text-white font-black text-[10px] flex items-center justify-center hover:bg-[#0046cc] transition-colors focus:outline-none rounded-full"
                  aria-label={`User menu for ${user.name}`}
                  aria-expanded={showUserMenu}
                >
                  {user.initials}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#111118] border border-[#1E1E2A] shadow-lg z-50 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1E1E2A]">
                      <div className="text-[11px] font-black text-white truncate">{user.name}</div>
                      <div className="text-[10px] text-[#505070] truncate">{user.email}</div>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-[#1E1E2A] transition-colors text-[#A8A8C0]"
                      onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                    >
                      Settings
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-[#1E1E2A] transition-colors border-t border-[#1E1E2A] text-[#505070]"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* View tab nav — only visible in journalist mode */}
        {JOURNALIST_MODE && (
          <div className="max-w-6xl mx-auto px-6 border-t border-[#1E1E2A]">
            <div className="flex gap-0" dir="ltr">
              {(['feed', 'journalist_data'] as const).map(view => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`py-2.5 px-4 text-[11px] font-bold tracking-widest uppercase border-b-2 transition-colors focus:outline-none ${
                    activeView === view
                      ? 'border-[#0057FF] text-white'
                      : 'border-transparent text-[#505070] hover:text-[#A8A8C0]'
                  }`}
                >
                  {view === 'feed' ? t('nav.feed') : t('nav.journalist_data')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filters — colored pill buttons */}
        <div
          className="max-w-6xl mx-auto px-6 overflow-hidden transition-all duration-300"
          style={{ maxHeight: scrollState === 'top' && activeView === 'feed' ? '80px' : '0px', opacity: scrollState === 'top' && activeView === 'feed' ? 1 : 0 }}
        >
          <div className="relative">
            <div className="flex gap-2 py-3 whitespace-nowrap overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(cat => {
                const color = CATEGORY_COLORS[cat] ?? '#0057FF';
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    aria-current={isActive ? 'true' : undefined}
                    className="text-[11px] font-bold tracking-wide uppercase transition-all px-3 py-1 rounded-full border shrink-0"
                    style={isActive
                      ? { backgroundColor: color, borderColor: color, color: '#FFFFFF' }
                      : { backgroundColor: 'transparent', borderColor: '#1E1E2A', color: '#A8A8C0' }
                    }
                  >
                    {t(`categories.${cat}`)}
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[#111118] to-transparent" aria-hidden="true" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#111118] to-transparent" aria-hidden="true" />
          </div>
        </div>

        {/* Region Filter */}
        {regions.length > 0 && scrollState === 'top' && activeView === 'feed' && (
          <div className="max-w-6xl mx-auto px-6 pb-3">
            <div className="flex gap-2 whitespace-nowrap overflow-x-auto scrollbar-hide items-center">
              <span className="text-[10px] text-[#0057FF] font-bold tracking-widest uppercase shrink-0">
                📍 {t('header.region_label')}
              </span>
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  aria-current={selectedRegion === region ? 'true' : undefined}
                  className={`text-[10px] font-bold tracking-wide uppercase px-3 py-1 border rounded-full transition-all ${
                    selectedRegion === region
                      ? 'border-[#0057FF] text-white bg-[#0057FF]'
                      : 'border-[#1E1E2A] text-[#A8A8C0] hover:border-[#0057FF]/60'
                  }`}
                >
                  {region === 'All Regions' ? t('header.all_regions') : region}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filter banner */}
        {activeFilters.length > 0 && scrollState === 'top' && activeView === 'feed' && (
          <div className="max-w-6xl mx-auto px-6 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-[#0057FF] font-bold tracking-widest uppercase shrink-0">
                Active filters:
              </span>
              {activeFilters.map(f => (
                <span key={f.id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 bg-[#0057FF]/20 border border-[#0057FF]/40 text-white rounded-full">
                  {f.name}
                  <button
                    onClick={() => handleToggleFilter(f.id)}
                    className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                    aria-label={`Disable filter: ${f.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pt-4 pb-16">
        {activeView === 'journalist_data' ? (
          <JournalistDataPage />
        ) : loading && articles.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4" aria-label={t('feed.loading_aria')} aria-busy="true">
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
            <p className="text-[#505070] text-sm font-bold tracking-widest uppercase mono">Loading feed…</p>
          </div>
        ) : error ? (
          <div className="py-24 text-center border-2 border-dashed border-[#0057FF]/30 rounded-xl">
            <p className="text-[#A8A8C0] mono text-sm mb-6 font-bold uppercase tracking-widest">{t(error)}</p>
            <button
              onClick={loadNews}
              className="text-[#0057FF] font-black underline underline-offset-8 hover:text-white transition-colors uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
            >
              {t('feed.try_again')}
            </button>
          </div>
        ) : (
          <div className="pb-32">
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onReadMore={handleReadMore}
                  language={language}
                  isPinned={pinnedIds.has(article.id)}
                  onPinToggle={handlePinToggle}
                />
              ))}
            </div>
            {filteredArticles.length === 0 && (
              <div className="py-32 text-center border border-[#1E1E2A] rounded-xl">
                <p className="text-[#A8A8C0] text-lg mb-2">{t('feed.no_articles')}</p>
                <p className="text-[#505070] text-sm">
                  {selectedCategory !== 'ALL' ? t('feed.no_articles_category') : ''}
                  {selectedRegion !== 'All Regions' ? t('feed.no_articles_region') : ''}
                  {t('feed.no_articles_broaden')}
                </p>
              </div>
            )}
          </div>
        )}
      </main>


      {/* Article Overlay */}
      {selectedArticle && (
        <FullArticleView article={selectedArticle} language={language} onClose={handleCloseArticle} />
      )}

      {/* Journalist Search */}
      {showJournalistSearch && (
        <JournalistSearchScreen onClose={() => setShowJournalistSearch(false)} />
      )}

      {/* Login Modal */}
      {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}

      {/* Settings Drawer */}
      {showSettings && (
        <SettingsDrawer
          language={language}
          onLanguageChange={handleLanguageChange}
          savedFilters={savedFilters}
          onToggleFilter={handleToggleFilter}
          onDeleteFilter={handleDeleteFilter}
          onOpenFilterBuilder={handleOpenFilterBuilder}
          notifPrefs={notifPrefs}
          regions={regions}
          onToggleCategory={handleToggleCategory}
          onToggleRegion={handleToggleRegion}
          onUnpinArticle={handleUnpinArticle}
          isLoggedIn={!!user}
          onSignInPrompt={() => { setShowSettings(false); setShowLogin(true); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Filter Builder */}
      {filterBuilderOpen && (
        <FilterBuilderScreen
          articles={articles}
          initial={filterToEdit}
          onSave={handleSaveFilter}
          onClose={() => { setFilterBuilderOpen(false); setFilterToEdit(undefined); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#111118] border border-[#1E1E2A] text-white text-[11px] font-bold tracking-widest uppercase px-5 py-3 flex items-center gap-4 shadow-lg rounded-xl">
          <span>{toast}</span>
          <button
            onClick={() => { setShowLogin(true); setToast(null); }}
            className="text-[#0057FF] hover:underline shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;

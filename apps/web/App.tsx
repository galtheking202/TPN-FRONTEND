
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
import i18n from './i18n';

const CATEGORIES = ['ALL', 'Politics', 'Economy', 'Health', 'Technology', 'Environment', 'Defence and Security', 'Sports'] as const;
type LanguageCode = 'en' | 'he' | 'fr' | 'ru' | 'ar';

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
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('tpn_dark') === 'true'; } catch { return false; }
  });

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

  // ── Dark mode: sync class on <html> ──────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('tpn_dark', String(isDark));
  }, [isDark]);

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
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
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
    <div className="min-h-screen bg-[#FAF7F0] text-[#1E1A14]">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header
        className="border-b border-[#EDEAE3] bg-[#FAF7F0]/95 backdrop-blur-sm sticky top-0 z-40 transition-transform duration-300"
        style={{ transform: scrollState === 'down' ? 'translateY(-100%)' : 'translateY(0)' }}
      >
        {/* Top row */}
        <div
          className="max-w-6xl mx-auto px-6 flex flex-row justify-between items-center transition-all duration-300"
          style={{
            paddingTop: scrollState === 'top' ? '2rem' : '0.5rem',
            paddingBottom: scrollState === 'top' ? '2rem' : '0.5rem',
            gap: '1rem',
          }}
        >
          {/* Title */}
          <div className="flex flex-col items-start shrink-0">
            <h1
              className="font-black tracking-tighter text-[#1E1A14] italic leading-none"
              style={{ fontSize: scrollState === 'top' ? '3rem' : '1.25rem' }}
            >
              {t('app.title')}
            </h1>
            <span
              className="not-italic font-bold tracking-[0.3em] text-[#D4A843] overflow-hidden whitespace-nowrap"
              style={{
                fontSize: '0.6rem',
                maxHeight: scrollState === 'top' ? '2rem' : '0px',
                opacity: scrollState === 'top' ? 1 : 0,
                marginTop: scrollState === 'top' ? '0.25rem' : '0',
              }}
            >
              {t('app.subtitle')}
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
                className="w-full px-4 py-2 bg-[#EDEAE3] border border-[#D4A843]/40 text-[#1E1A14] placeholder-[#1E1A14]/40 focus:outline-none focus:ring-2 focus:ring-[#D4A843] text-sm"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                  <div className="w-4 h-4 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 shrink-0" dir="ltr">

            {/* Live indicator */}
            <div
              className="text-[11px] mono font-bold tracking-widest text-[#D4A843] overflow-hidden transition-all duration-300 hidden sm:flex items-center gap-2 shrink-0"
              style={{ maxWidth: scrollState === 'top' ? '80px' : '0px', opacity: scrollState === 'top' ? 1 : 0 }}
              aria-hidden="true"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4A843] animate-pulse shrink-0"></span>
              {t('header.live')}
            </div>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="relative text-[#1E1A14]/50 hover:text-[#1E1A14] transition-colors focus:outline-none"
              aria-label={`Settings${notifBadge > 0 ? `, ${notifBadge} active notifications` : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              {notifBadge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#D4A843] text-[#1E1A14] text-[9px] font-black flex items-center justify-center px-0.5">
                  {notifBadge > 9 ? '9+' : notifBadge}
                </span>
              )}
            </button>

            {/* User */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="w-7 h-7 bg-[#D4A843] text-[#1E1A14] font-black text-[10px] flex items-center justify-center hover:bg-[#c4983a] transition-colors focus:outline-none"
                  aria-label={`User menu for ${user.name}`}
                  aria-expanded={showUserMenu}
                >
                  {user.initials}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#FAF7F0] border border-[#EDEAE3] shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-[#EDEAE3]">
                      <div className="text-[11px] font-black text-[#1E1A14] truncate">{user.name}</div>
                      <div className="text-[10px] text-[#1E1A14]/40 truncate">{user.email}</div>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-[#EDEAE3] transition-colors"
                      onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                    >
                      Settings
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-[#EDEAE3] transition-colors border-t border-[#EDEAE3] text-[#1E1A14]/50"
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
                className="text-[10px] font-black tracking-widest uppercase text-[#1E1A14]/50 hover:text-[#1E1A14] transition-colors flex items-center gap-1.5 shrink-0"
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

        {/* Category Filters */}
        <div
          className="max-w-6xl mx-auto px-6 overflow-hidden transition-all duration-300"
          style={{ maxHeight: scrollState === 'top' ? '80px' : '0px', opacity: scrollState === 'top' ? 1 : 0 }}
        >
          <div className="relative">
            <div className="flex gap-6 py-4 whitespace-nowrap overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-current={selectedCategory === cat ? 'true' : undefined}
                  className={`text-xs mono font-black tracking-widest uppercase transition-all pb-1 border-b-2 ${
                    selectedCategory === cat
                      ? 'text-[#D4A843] border-[#D4A843]'
                      : 'text-[#1E1A14]/50 border-transparent hover:text-[#1E1A14]/70'
                  }`}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[#FAF7F0] to-transparent" aria-hidden="true" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#FAF7F0] to-transparent" aria-hidden="true" />
          </div>
        </div>

        {/* Region Filter */}
        {regions.length > 0 && scrollState === 'top' && (
          <div className="max-w-6xl mx-auto px-6 pb-4">
            <div className="flex gap-3 whitespace-nowrap overflow-x-auto scrollbar-hide items-center">
              <span className="text-[10px] text-[#D4A843] font-bold tracking-widest uppercase shrink-0">
                📍 {t('header.region_label')}
              </span>
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  aria-current={selectedRegion === region ? 'true' : undefined}
                  className={`text-[10px] font-bold tracking-wide uppercase px-3 py-1 border transition-all ${
                    selectedRegion === region
                      ? 'border-[#D4A843] text-[#1E1A14] bg-[#D4A843]'
                      : 'border-[#EDEAE3] text-[#1E1A14]/60 hover:border-[#D4A843]/60 hover:text-[#1E1A14]/80'
                  }`}
                >
                  {region === 'All Regions' ? t('header.all_regions') : region}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filter banner */}
        {activeFilters.length > 0 && scrollState === 'top' && (
          <div className="max-w-6xl mx-auto px-6 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-[#D4A843] font-bold tracking-widest uppercase shrink-0">
                Active filters:
              </span>
              {activeFilters.map(f => (
                <span key={f.id} className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 bg-[#D4A843] text-[#1E1A14]">
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

      {/* ── Main Feed ─────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pt-4 pb-16">
        {loading && articles.length === 0 ? (
          <div className="flex flex-col py-20 space-y-16" aria-label={t('feed.loading_aria')} aria-busy="true">
            <div className="h-1 bg-[#EDEAE3] w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-[#D4A843] w-1/4 animate-[loading_2s_infinite]"></div>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col md:flex-row gap-8 opacity-40" aria-hidden="true">
                <div className="md:w-1/3 aspect-[4/3] bg-[#EDEAE3]"></div>
                <div className="md:w-2/3 space-y-6">
                  <div className="h-10 w-3/4 bg-[#EDEAE3]"></div>
                  <div className="h-6 w-full bg-[#EDEAE3]"></div>
                  <div className="h-6 w-1/2 bg-[#EDEAE3]"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-24 text-center border-2 border-dashed border-[#D4A843]/30">
            <p className="text-[#1E1A14]/60 mono text-sm mb-6 font-bold uppercase tracking-widest">{t(error)}</p>
            <button
              onClick={loadNews}
              className="text-[#D4A843] font-black underline underline-offset-8 hover:text-[#1E1A14] transition-colors uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
            >
              {t('feed.try_again')}
            </button>
          </div>
        ) : (
          <div className="pb-32">
            <div className="space-y-4">
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
              <div className="py-32 text-center border border-[#EDEAE3]">
                <p className="text-[#1E1A14]/60 text-lg mb-2">{t('feed.no_articles')}</p>
                <p className="text-[#1E1A14]/40 text-sm">
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

      {/* Login Modal */}
      {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}

      {/* Settings Drawer */}
      {showSettings && (
        <SettingsDrawer
          isDark={isDark}
          onToggleDark={() => setIsDark(v => !v)}
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1E1A14] text-[#FAF7F0] text-[11px] font-bold tracking-widest uppercase px-5 py-3 flex items-center gap-4 shadow-lg">
          <span>{toast}</span>
          <button
            onClick={() => { setShowLogin(true); setToast(null); }}
            className="text-[#D4A843] hover:underline shrink-0"
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;

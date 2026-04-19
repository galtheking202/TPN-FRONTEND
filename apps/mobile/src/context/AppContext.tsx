import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { SavedFilter } from '@tpn/shared';
import i18n from '@tpn/shared/i18n';

const RTL_LANGS = ['he', 'ar'];

const STORAGE_KEYS = {
  savedFilters: 'tpn_saved_filters',
  pinnedArticles: 'tpn_pinned_articles',
  notifPrefs: 'tpn_notif_prefs',
  hasSeenWelcome: 'tpn_has_seen_welcome',
};

export interface PinnedArticle {
  id: string;
  title: string;
  category: string;
  source?: string;
  timestamp?: string;
  imageUrl?: string;
  summary?: string;
}

export interface NotifPrefs {
  categories: string[];
  regions: string[];
}

interface AppContextType {
  language: string;
  isRTL: boolean;
  setLanguage: (lang: string) => void;
  hasSeenWelcome: boolean | null;
  markWelcomeSeen: () => void;
  savedFilters: SavedFilter[];
  addFilter: (filter: SavedFilter) => void;
  updateFilter: (filter: SavedFilter) => void;
  removeFilter: (id: string) => void;
  toggleFilter: (id: string) => void;
  pinnedArticles: PinnedArticle[];
  isPinned: (id: string) => boolean;
  togglePin: (article: PinnedArticle) => void;
  notifPrefs: NotifPrefs;
  updateNotifPrefs: (prefs: NotifPrefs) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState('en');
  const isRTL = RTL_LANGS.includes(language);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [pinnedArticles, setPinnedArticles] = useState<PinnedArticle[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({ categories: [], regions: [] });
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  // Load all persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        const [filters, pins, prefs, seen] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.savedFilters),
          AsyncStorage.getItem(STORAGE_KEYS.pinnedArticles),
          AsyncStorage.getItem(STORAGE_KEYS.notifPrefs),
          AsyncStorage.getItem(STORAGE_KEYS.hasSeenWelcome),
        ]);
        if (filters) setSavedFilters(JSON.parse(filters));
        if (pins) setPinnedArticles(JSON.parse(pins));
        if (prefs) setNotifPrefs(JSON.parse(prefs));
        setHasSeenWelcome(seen === 'true');
      } catch {}
    })();
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    I18nManager.forceRTL(RTL_LANGS.includes(lang));
  }, []);

  const addFilter = useCallback((filter: SavedFilter) => {
    setSavedFilters(prev => {
      const next = [...prev, filter];
      AsyncStorage.setItem(STORAGE_KEYS.savedFilters, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateFilter = useCallback((filter: SavedFilter) => {
    setSavedFilters(prev => {
      const next = prev.map(f => f.id === filter.id ? filter : f);
      AsyncStorage.setItem(STORAGE_KEYS.savedFilters, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const next = prev.filter(f => f.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.savedFilters, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const next = prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
      AsyncStorage.setItem(STORAGE_KEYS.savedFilters, JSON.stringify(next));
      return next;
    });
  }, []);

  const isPinned = useCallback((id: string) => pinnedArticles.some(a => a.id === id), [pinnedArticles]);

  const togglePin = useCallback((article: PinnedArticle) => {
    setPinnedArticles(prev => {
      const next = prev.some(a => a.id === article.id)
        ? prev.filter(a => a.id !== article.id)
        : [article, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.pinnedArticles, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateNotifPrefs = useCallback((prefs: NotifPrefs) => {
    setNotifPrefs(prefs);
    AsyncStorage.setItem(STORAGE_KEYS.notifPrefs, JSON.stringify(prefs));
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setHasSeenWelcome(true);
    AsyncStorage.setItem(STORAGE_KEYS.hasSeenWelcome, 'true');
  }, []);

  return (
    <AppContext.Provider value={{
      language, isRTL, setLanguage,
      hasSeenWelcome, markWelcomeSeen,
      savedFilters, addFilter, updateFilter, removeFilter, toggleFilter,
      pinnedArticles, isPinned, togglePin,
      notifPrefs, updateNotifPrefs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppContextProvider');
  return ctx;
}

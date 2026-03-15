
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Article } from '../types';

type LangCode = 'en' | 'he' | 'fr' | 'ru' | 'ar';

interface NewsTickerProps {
  articles: Article[];
  language?: LangCode;
  onArticleClick?: (id: string) => void;
}

const NewsTicker: React.FC<NewsTickerProps> = ({ articles, language, onArticleClick }) => {
  const { t, i18n } = useTranslation();
  const [paused, setPaused] = useState(false);
  const selectedLanguage: LangCode = (language ?? i18n.language ?? 'en') as LangCode;

  const resolveLangKey = (langs: Article['languages'] | undefined, lang: string) => {
    if (!langs) return undefined;
    const direct = langs[lang];
    if (direct) return direct;
    const altKeys: Record<string, string> = { en: 'english', he: 'hebrew' };
    const altKey = altKeys[lang];
    if (altKey && langs[altKey]) return langs[altKey];
    return langs['en'] || langs['english'] || undefined;
  };

  const tickerItems = articles.map(a => {
    const headline = resolveLangKey(a.languages, selectedLanguage)?.title || a.title || t('article.untitled');
    return (
      <span
        key={a.id}
        className="mx-12 flex items-center gap-3 cursor-pointer hover:text-[#D4A843] transition-colors focus:outline-none focus:text-[#D4A843]"
        onClick={() => onArticleClick?.(a.id)}
        onKeyDown={(e) => e.key === 'Enter' && onArticleClick?.(a.id)}
        role="button"
        tabIndex={paused ? 0 : -1}
        aria-label={t('article.read_aria', { title: headline })}
      >
        <span className="w-1.5 h-1.5 bg-[#D4A843] rounded-full shrink-0" aria-hidden="true"></span>
        <span className="font-bold tracking-tight">{headline}</span>
        <span className="text-[#1E1A14]/50 mono text-[10px]" aria-hidden="true">
          {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </span>
    );
  });

  return (
    <div
      className="fixed bottom-0 left-0 w-full bg-[#FAF7F0] border-t-2 border-[#D4A843]/30 h-12 flex items-center overflow-hidden z-50"
      role="marquee"
      aria-label={t('ticker.aria')}
      aria-live="off"
    >
      <div className="bg-[#1E1A14] text-[#FAF7F0] text-[10px] font-black px-6 h-full flex items-center z-10 whitespace-nowrap tracking-widest uppercase shrink-0">
        {t('ticker.live')}
      </div>
      <div
        className="animate-ticker text-sm flex items-center text-[#1E1A14] select-none"
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-hidden={!paused}
      >
        {tickerItems}
        {tickerItems}
      </div>
    </div>
  );
};

export default NewsTicker;

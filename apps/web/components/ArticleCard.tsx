
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Article } from '../types';

type LangCode = 'en' | 'he' | 'fr' | 'ru' | 'ar';

const LOCALE_MAP: Record<LangCode, string> = {
  en: 'en-US', he: 'he-IL', fr: 'fr-FR', ru: 'ru-RU', ar: 'ar-SA',
};

interface ArticleCardProps {
  article: Article;
  onReadMore: (id: string) => void;
  language?: LangCode;
  isPinned?: boolean;
  onPinToggle?: (id: string, title: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore, language, isPinned = false, onPinToggle }) => {
  const { t, i18n } = useTranslation();
  const [showCredibilityTooltip, setShowCredibilityTooltip] = useState(false);
  const [hovered, setHovered] = useState(false);
  const selectedLanguage: LangCode = (language ?? i18n.language ?? 'en') as LangCode;

  const locale = LOCALE_MAP[selectedLanguage] ?? 'en-US';

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return t('article.date_unknown');
    const date = new Date(dateString);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const resolveLangKey = (langs: Article['languages'] | undefined, lang: string) => {
    if (!langs) return undefined;
    const direct = langs[lang];
    if (direct) return direct;
    const altKeys: Record<string, string> = { en: 'english', he: 'hebrew' };
    const altKey = altKeys[lang];
    if (altKey && langs[altKey]) return langs[altKey];
    // Fallback to English for languages without article content
    return langs['en'] || langs['english'] || undefined;
  };

  const credScore = article.credibility_score ?? 0;
  const credTier = credScore >= 7
    ? { key: 'article.credibility_high', color: '#15803d' }
    : credScore >= 4
    ? { key: 'article.credibility_moderate', color: '#D4A843' }
    : { key: 'article.credibility_low', color: '#b91c1c' };

  const langContent = resolveLangKey(article.languages, selectedLanguage);
  const title = langContent?.title || article.title || article.header || t('article.untitled');
  const summary = langContent?.summary || article.summary || article.content || t('article.no_summary');

  return (
    <article
      className="flex flex-col md:flex-row gap-8 py-10 border-b border-[#EDEAE3] group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col justify-center" dir={(selectedLanguage === 'he' || selectedLanguage === 'ar') ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-4 mb-3 text-[11px] mono font-bold tracking-widest uppercase flex-wrap">
          {article.isUrgent ? (
            <span className="text-[#1E1A14] bg-[#D4A843] px-2 py-0.5 font-black">
              {t('article.breaking')}
            </span>
          ) : (
            <span className="text-[#D4A843]">{t(`categories.${article.category}`, { defaultValue: article.category })}</span>
          )}
          {article.region && (
            <span className="text-[#D4A843]/70 flex items-center gap-1">
              <span aria-hidden="true">📍</span> {article.region}
            </span>
          )}
          <span className="text-[#1E1A14]/50">
            {formatDate(article.timestamp || article.date)}
          </span>
        </div>

        <h3
          className="text-2xl md:text-3xl font-extrabold text-[#1E1A14] mb-4 leading-[1.1] cursor-pointer hover:text-[#D4A843] transition-colors focus:outline-none focus:underline"
          onClick={() => onReadMore(article.id)}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onReadMore(article.id)}
          role="button"
          aria-label={t('article.read_full_aria', { title })}
        >
          {title}
        </h3>

        <p className="text-[#1E1A14]/70 text-base leading-relaxed mb-6 max-w-2xl font-light">
          {summary}
        </p>

        <div className="flex items-center text-[11px] text-[#D4A843] gap-3 mb-4 flex-wrap">
          <span className="font-bold tracking-widest uppercase">{article.source || t('article.default_source')}</span>
          <span className="text-[#EDEAE3]" aria-hidden="true">/</span>
          <div className="relative">
            <button
              onClick={() => setShowCredibilityTooltip(!showCredibilityTooltip)}
              onMouseEnter={() => setShowCredibilityTooltip(true)}
              onMouseLeave={() => setShowCredibilityTooltip(false)}
              onFocus={() => setShowCredibilityTooltip(true)}
              onBlur={() => setShowCredibilityTooltip(false)}
              className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#D4A843] rounded-sm"
              aria-label={t('article.credibility_info_aria')}
              aria-expanded={showCredibilityTooltip}
            >
              {[0, 1, 2, 3, 4].map(i => {
                const fill = Math.min(1, Math.max(0, (credScore - i * 2) / 2));
                const pct = `${(fill * 100).toFixed(1)}%`;
                return (
                  <span
                    key={i}
                    className="block w-3 h-2"
                    style={{
                      background: `linear-gradient(to right, ${credTier.color} ${pct}, ${credTier.color}30 ${pct})`,
                    }}
                    aria-hidden="true"
                  />
                );
              })}
            </button>

            {showCredibilityTooltip && (
              <div
                role="tooltip"
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-[#1E1A14] border-2 rounded-md p-4 z-50 shadow-lg"
                style={{ borderColor: credTier.color }}
              >
                <p className="text-[#FAF7F0] text-xs leading-relaxed font-light">
                  {t('article.credibility_tooltip', { score: credScore.toFixed(1) })}
                </p>
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent" style={{ borderTopColor: credTier.color }} aria-hidden="true"></div>
              </div>
            )}
          </div>
        </div>

        {/* External Sources */}
        {article.external_sources && (
          <div className="mt-4 pt-4 border-t border-[#EDEAE3]">
            <p className="text-[10px] font-bold text-[#D4A843] tracking-widest uppercase mb-2">{t('article.sources')}</p>
            <div className="flex flex-wrap gap-2">
              {article.external_sources.length > 0 ? (
                article.external_sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E1A14]/60 hover:text-[#D4A843] text-[10px] underline underline-offset-2 transition-colors break-all focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                    aria-label={t('article.external_source_aria', { index: idx + 1 })}
                  >
                    {source.length > 40 ? source.substring(0, 40) + '…' : source}
                  </a>
                ))
              ) : (
                <span className="text-[#1E1A14]/40 text-[10px]">{t('article.no_sources')}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pin / notification bell — shown on hover or when already pinned */}
      {onPinToggle && (hovered || isPinned) && (
        <button
          onClick={() => onPinToggle(article.id, title)}
          className={`absolute top-10 right-0 p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A843] ${
            isPinned
              ? 'text-[#D4A843]'
              : 'text-[#1E1A14]/30 hover:text-[#D4A843]'
          }`}
          aria-label={isPinned ? `Unpin article: ${title}` : `Pin article: ${title}`}
          aria-pressed={isPinned}
          title={isPinned ? 'Remove notification' : 'Notify me about this'}
        >
          {isPinned ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          )}
        </button>
      )}
    </article>
  );
};

export default ArticleCard;

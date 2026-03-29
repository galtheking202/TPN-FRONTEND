
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Article } from '../types';

type LangCode = 'en' | 'he' | 'fr' | 'ru' | 'ar';

const LOCALE_MAP: Record<LangCode, string> = {
  en: 'en-US', he: 'he-IL', fr: 'fr-FR', ru: 'ru-RU', ar: 'ar-SA',
};

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#FF6B35',
  Economy: '#00C896',
  Health: '#FF4D6D',
  Technology: '#0057FF',
  Environment: '#3DBF6E',
  'Defence and Security': '#9747FF',
  Sports: '#FFB800',
};

function formatLocalTime(dateString: string | undefined): string {
  if (!dateString) return '';
  // Ensure the string is treated as UTC by appending Z if no timezone offset is present
  const normalized = /[Z+\-]\d*$/.test(dateString) ? dateString : dateString + 'Z';
  return new Date(normalized).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ArticleCardProps {
  article: Article;
  onReadMore: (id: string) => void;
  language?: LangCode;
  isPinned?: boolean;
  onPinToggle?: (id: string, title: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore, language, isPinned = false, onPinToggle }) => {
  const { t, i18n } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const [showCredibilityTooltip, setShowCredibilityTooltip] = useState(false);
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

  const credScore = article.credibility_score ?? 0;
  const credTier = credScore >= 7
    ? { color: '#15803d' }
    : credScore >= 4
    ? { color: '#0057FF' }
    : { color: '#FF3333' };

  const langContent = resolveLangKey(article.languages, selectedLanguage);
  const title = langContent?.title || article.title || article.header || t('article.untitled');
  const summary = langContent?.summary || article.summary || article.content || t('article.no_summary');

  const categoryColor = CATEGORY_COLORS[article.category] ?? '#0057FF';
  const isRTL = selectedLanguage === 'he' || selectedLanguage === 'ar';

  return (
    <article
      className="flex gap-3 p-3 rounded-xl border border-[#1E1E2A] bg-[#111118] cursor-pointer hover:border-[#2A2A3A] transition-colors relative overflow-hidden"
      style={article.isUrgent ? { borderLeft: '3px solid #FF3333' } : undefined}
      onClick={() => onReadMore(article.id)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Left content */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Top row: category badge + region */}
        <div className="flex items-center gap-2 flex-wrap">
          {article.isUrgent ? (
            <span
              className="category-badge text-white"
              style={{ backgroundColor: '#FF3333' }}
            >
              {t('article.breaking')}
            </span>
          ) : (
            <span
              className="category-badge"
              style={{ backgroundColor: `${categoryColor}22`, color: categoryColor }}
            >
              {t(`categories.${article.category}`, { defaultValue: article.category })}
            </span>
          )}
          {article.region && (
            <span className="text-[10px] text-[#505070] flex items-center gap-0.5">
              <span aria-hidden="true">📍</span> {article.region}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-bold text-white leading-snug line-clamp-2"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onReadMore(article.id)}
          role="button"
          aria-label={t('article.read_full_aria', { title })}
          onClick={(e) => { e.stopPropagation(); onReadMore(article.id); }}
        >
          {title}
        </h3>

        {/* Summary */}
        <p className="text-[12px] text-[#A8A8C0] leading-relaxed line-clamp-2">
          {summary}
        </p>

        {/* Last updated — always visible, outside the meta row */}
        {(article.last_updated || article.timestamp || article.date) && (
          <p className="text-[11px] text-[#505070]">
            Last updated:{' '}
            <span className="text-[#A8A8C0]">
              {formatLocalTime(article.last_updated || article.timestamp || article.date)}
            </span>
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-[11px] text-[#505070] font-medium truncate">
            {article.source || t('article.default_source')}
          </span>
          <span className="text-[#1E1E2A]" aria-hidden="true">·</span>
          {/* Credibility dots */}
          <div className="relative flex items-center shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCredibilityTooltip(!showCredibilityTooltip); }}
              onMouseEnter={() => setShowCredibilityTooltip(true)}
              onMouseLeave={() => setShowCredibilityTooltip(false)}
              className="flex items-center gap-0.5 focus:outline-none"
              aria-label={t('article.credibility_info_aria')}
            >
              {[0, 1, 2, 3, 4].map(i => {
                const fill = Math.min(1, Math.max(0, (credScore - i * 2) / 2));
                const pct = `${(fill * 100).toFixed(1)}%`;
                return (
                  <span
                    key={i}
                    className="block w-2.5 h-1.5 rounded-sm"
                    style={{ background: `linear-gradient(to right, ${credTier.color} ${pct}, ${credTier.color}30 ${pct})` }}
                    aria-hidden="true"
                  />
                );
              })}
            </button>
            {showCredibilityTooltip && (
              <div
                role="tooltip"
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-[#16161F] border border-[#1E1E2A] rounded-lg p-3 z-50 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white text-[11px] leading-relaxed">
                  {t('article.credibility_tooltip', { score: credScore.toFixed(1) })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: thumbnail + pin */}
      <div className="flex flex-col items-center gap-2 shrink-0" style={{ width: 90 }}>
        {/* Thumbnail */}
        <div className="w-full rounded-lg overflow-hidden" style={{ height: 72 }}>
          {article.imageUrl && !imgError ? (
            <img
              src={article.imageUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}22` }}
            >
              <span style={{ color: categoryColor, fontSize: 22 }} aria-hidden="true">
                {article.category === 'Politics' ? '🏛' :
                 article.category === 'Economy' ? '📈' :
                 article.category === 'Health' ? '🏥' :
                 article.category === 'Technology' ? '💻' :
                 article.category === 'Environment' ? '🌿' :
                 article.category === 'Defence and Security' ? '🛡' :
                 article.category === 'Sports' ? '⚽' : '📰'}
              </span>
            </div>
          )}
        </div>

        {/* Pin button */}
        {onPinToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onPinToggle(article.id, title); }}
            className={`p-1 transition-colors focus:outline-none rounded ${
              isPinned ? 'text-[#0057FF]' : 'text-[#505070] hover:text-[#A8A8C0]'
            }`}
            aria-label={isPinned ? `Unpin article: ${title}` : `Pin article: ${title}`}
            aria-pressed={isPinned}
          >
            {isPinned ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </article>
  );
};

export default ArticleCard;

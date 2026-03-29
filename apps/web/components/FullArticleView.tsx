
import React, { useEffect, useRef, useState } from 'react';
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

interface FullArticleViewProps {
  article: Article;
  onClose: () => void;
  language?: LangCode;
}

const FullArticleView: React.FC<FullArticleViewProps> = ({ article, onClose, language }) => {
  const { t, i18n } = useTranslation();
  const selectedLanguage: LangCode = (language ?? i18n.language ?? 'en') as LangCode;

  const locale = LOCALE_MAP[selectedLanguage] ?? 'en-US';
  const isRTL = selectedLanguage === 'he' || selectedLanguage === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return t('article.date_unknown');
    // Append Z if no timezone offset present so the string is treated as UTC
    const normalized = /[Z+\-]\d*$/.test(dateString) ? dateString : dateString + 'Z';
    return new Date(normalized).toLocaleString(undefined, {
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
    return langs['en'] || langs['english'] || undefined;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const max = scrollHeight - clientHeight;
      setReadProgress(max > 0 ? (scrollTop / max) * 100 : 100);
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const credScore = article.credibility_score ?? 0;
  const credTier = credScore >= 7
    ? { color: '#15803d' }
    : credScore >= 4
    ? { color: '#0057FF' }
    : { color: '#FF3333' };

  const langContent = resolveLangKey(article.languages, selectedLanguage);
  const title = langContent?.title || article.title || article.header || t('article.untitled');
  const summary = langContent?.summary || article.summary || article.content || t('article.no_summary');
  const body = langContent?.body || article.content || '';

  const categoryColor = CATEGORY_COLORS[article.category] ?? '#0057FF';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col overflow-y-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-[#0057FF] z-50 transition-[width] duration-75 pointer-events-none"
        style={{ width: `${readProgress}%` }}
        aria-hidden="true"
      />

      {/* Navigation bar */}
      <nav className="sticky top-0 bg-[#111118]/95 backdrop-blur-md border-b border-[#1E1E2A] px-6 py-4 flex justify-between items-center z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[#A8A8C0] font-bold text-xs uppercase tracking-widest hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0057FF] px-1"
          aria-label={t('article.back_aria')}
        >
          <span className="text-xl" aria-hidden="true">←</span> {t('article.back')}
        </button>
        <div className="text-[10px] mono font-bold uppercase tracking-widest">
          {article.isUrgent ? (
            <span className="category-badge text-white" style={{ backgroundColor: '#FF3333' }}>
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
        </div>
      </nav>

      {/* Hero image */}
      {article.imageUrl && (
        <div className="relative w-full overflow-hidden" style={{ height: 240 }}>
          <img
            src={article.imageUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, #0A0A0F 100%)' }}
          />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-6 py-10 w-full">
        <div className="flex flex-col gap-8">
          {/* Metadata */}
          <div>
            {article.region && (
              <div className="text-[#0057FF] text-xs font-bold tracking-widest mb-3 flex items-center gap-1">
                <span aria-hidden="true">📍</span> {article.region}
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              {title}
            </h1>
            <div className="border-t border-b border-[#1E1E2A] py-4 flex items-center gap-4 flex-wrap">
              <span className="text-sm font-bold text-[#A8A8C0]">
                {t('article.by')} {article.author || article.source || t('article.default_source')}
              </span>
              <span className="text-[#1E1E2A]" aria-hidden="true">|</span>
              <span className="mono text-xs text-[#505070] font-bold uppercase tracking-widest">
                Last updated: {formatDate(article.last_updated || article.timestamp || article.date)}
              </span>
              {article.credibility_score !== undefined && (
                <>
                  <span className="text-[#1E1E2A]" aria-hidden="true">|</span>
                  <span
                    className="flex items-center gap-0.5"
                    title={t('article.credibility_tooltip', { score: credScore.toFixed(1) })}
                    aria-label={`${t('article.credibility_info_aria')} ${credScore.toFixed(1)}/10`}
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
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-6">
            <p
              className="text-lg md:text-xl text-[#A8A8C0] leading-relaxed italic border-l-4 pl-6 py-1"
              style={{ borderColor: '#0057FF' }}
            >
              {summary}
            </p>

            <div className="article-body space-y-5" style={{ color: '#D0D0E8', fontSize: 15, lineHeight: '26px' }}>
              {body ? (() => {
                const paragraphs = body.split('\n').filter(p => p.trim());
                return paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ));
              })() : (
                <p className="italic" style={{ color: '#505070' }}>{t('article.no_content')}</p>
              )}
            </div>
          </div>

          {/* Sources */}
          {article.external_sources && article.external_sources.length > 0 && (
            <div className="pt-6 border-t border-[#1E1E2A]">
              <div className="bg-[#111118] rounded-xl p-4 border border-[#1E1E2A]">
                <p className="text-[10px] font-bold text-[#0057FF] tracking-widest uppercase mb-3">{t('article.sources')}</p>
                <div className="flex flex-wrap gap-2">
                  {article.external_sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A8A8C0] hover:text-white text-[10px] underline underline-offset-2 transition-colors break-all focus:outline-none focus:ring-1 focus:ring-[#0057FF]"
                      aria-label={t('article.external_source_aria', { index: idx + 1 })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {source.length > 50 ? source.substring(0, 50) + '…' : source}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export default FullArticleView;

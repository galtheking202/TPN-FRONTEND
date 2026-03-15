
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Article } from '../types';

type LangCode = 'en' | 'he' | 'fr' | 'ru' | 'ar';

const LOCALE_MAP: Record<LangCode, string> = {
  en: 'en-US', he: 'he-IL', fr: 'fr-FR', ru: 'ru-RU', ar: 'ar-SA',
};

interface FullArticleViewProps {
  article: Article;
  onClose: () => void;
  language?: LangCode;
}

const HEADING_FONT: Record<LangCode, string> = {
  en: "'Playfair Display', serif",
  fr: "'Playfair Display', serif",
  ru: "'Playfair Display', serif",
  he: "'Frank Ruhl Libre', serif",
  ar: "'Amiri', serif",
};

const BODY_FONT: Record<LangCode, string> = {
  en: "'Lora', serif",
  fr: "'Lora', serif",
  ru: "'Lora', serif",
  he: "'Frank Ruhl Libre', serif",
  ar: "'Amiri', serif",
};

const FullArticleView: React.FC<FullArticleViewProps> = ({ article, onClose, language }) => {
  const { t, i18n } = useTranslation();
  const selectedLanguage: LangCode = (language ?? i18n.language ?? 'en') as LangCode;

  const locale = LOCALE_MAP[selectedLanguage] ?? 'en-US';
  const isRTL = selectedLanguage === 'he' || selectedLanguage === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);

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
    ? { key: 'article.credibility_high', color: '#15803d' }
    : credScore >= 4
    ? { key: 'article.credibility_moderate', color: '#D4A843' }
    : { key: 'article.credibility_low', color: '#b91c1c' };

  const langContent = resolveLangKey(article.languages, selectedLanguage);
  const title = langContent?.title || article.title || article.header || t('article.untitled');
  const summary = langContent?.summary || article.summary || article.content || t('article.no_summary');
  const body = langContent?.body || article.content || '';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#FAF7F0] flex flex-col overflow-y-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-[#D4A843] z-50 transition-[width] duration-75 pointer-events-none"
        style={{ width: `${readProgress}%` }}
        aria-hidden="true"
      />
      {/* Navigation bar */}
      <nav className="sticky top-0 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#EDEAE3] px-6 py-4 flex justify-between items-center z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[#D4A843] font-bold text-xs uppercase tracking-widest hover:text-[#1E1A14] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A843] px-1"
          aria-label={t('article.back_aria')}
        >
          <span className="text-xl" aria-hidden="true">←</span> {t('article.back')}
        </button>
        <div className="text-[10px] mono text-[#1E1A14]/50 font-bold uppercase tracking-widest">
          {article.isUrgent ? (
            <span className="text-[#1E1A14] bg-[#D4A843] px-2 py-0.5 font-black">{t('article.breaking')}</span>
          ) : (
            <span>{t(`categories.${article.category}`, { defaultValue: article.category })}</span>
          )}
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-12 md:py-20 w-full">
        <div className="flex flex-col gap-10">
          {/* Metadata */}
          <div>
            {article.region && (
              <div className="text-[#D4A843] text-xs font-bold tracking-widest mb-2 flex items-center gap-1">
                <span aria-hidden="true">📍</span> {article.region}
              </div>
            )}
            <h1 className={`text-4xl md:text-6xl font-black text-[#1E1A14] leading-[1.1] mb-6 tracking-tight${selectedLanguage !== 'he' ? ' italic' : ''}`} style={{ fontFamily: HEADING_FONT[selectedLanguage] }}>
              {title}
            </h1>
            <div className="border-t border-b border-[#1E1A14]/15 py-4 flex items-center gap-4 flex-wrap">
              <span className="text-sm font-bold text-[#1E1A14]" style={{ fontFamily: BODY_FONT[selectedLanguage] }}>
                {t('article.by')} {article.author || article.source || t('article.default_source')}
              </span>
              <span className="text-[#EDEAE3]" aria-hidden="true">|</span>
              <span className="mono text-xs text-[#1E1A14]/50 font-bold uppercase tracking-widest">
                {formatDate(article.timestamp || article.date)}
              </span>
              {article.credibility_score !== undefined && (
                <>
                  <span className="text-[#EDEAE3]" aria-hidden="true">|</span>
                  <span
                    className="flex items-center gap-1"
                    title={t('article.credibility_tooltip', { score: credScore.toFixed(1) })}
                    aria-label={`${t('article.credibility_info_aria')} ${credScore.toFixed(1)}/10`}
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
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-8">
            <p className="text-2xl md:text-3xl text-[#1E1A14] leading-relaxed font-light italic border-l-4 border-[#D4A843] pl-8 py-2">
              {summary}
            </p>

            <div className="article-body text-[#1E1A14]/80 text-lg leading-[1.85] space-y-6 max-w-[68ch]" style={{ fontFamily: BODY_FONT[selectedLanguage] }}>
              {body ? (() => {
                const paragraphs = body.split('\n').filter(p => p.trim());
                return paragraphs.map((paragraph, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && index % 5 === 0 && (
                      <div className="article-section-break" aria-hidden="true">• • •</div>
                    )}
                    <p>{paragraph}</p>
                  </React.Fragment>
                ));
              })() : (
                <p className="text-[#1E1A14]/40 italic">{t('article.no_content')}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-12 border-t border-[#EDEAE3] flex justify-center">
            <button
              onClick={onClose}
              className="px-12 py-4 bg-[#D4A843] text-[#1E1A14] font-black uppercase tracking-widest hover:bg-[#1E1A14] hover:text-[#FAF7F0] transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1E1A14]"
            >
              {t('article.back')}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default FullArticleView;

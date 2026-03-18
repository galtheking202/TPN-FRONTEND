import { Article } from '../types';

const MOCK_ARTICLES: Article[] = [
  {
    id: 'mock-1',
    title: 'Market volatility increases following regional trade shifts',
    summary: 'Analysts observe a 10-year high in volatility indices as central banks prepare for a coordinate statement regarding supply chain logistics.',
    category: 'Economy',
    timestamp: new Date().toISOString(),
    isUrgent: true,
    source: 'Financial Times'
  },
  {
    id: 'mock-2',
    title: 'Security protocols updated following infrastructure audit',
    summary: 'A comprehensive review of national energy grids has led to a series of mandatory security updates across the northern territory.',
    category: 'Defence and Security',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isUrgent: false,
    source: 'Tech Reports'
  }
];

function mapArticle(article: any, index: number): Article {
  return {
    id: `server-${article.id || Date.now()}-${index}`,
    title: article.header || article.title || '',
    header: article.header || article.title || '',
    summary: article.summary || '',
    content: article.content || '',
    category: (article.category || 'Technology') as Article['category'],
    timestamp: article.date || article.timestamp || new Date().toISOString(),
    date: article.date || article.timestamp || new Date().toISOString(),
    isUrgent: article.isUrgent || false,
    source: article.author || 'tpn Internal',
    author: article.author || 'Unknown',
    languages: article.languages || undefined,
    credibility_score: article.credibility_score || undefined,
    external_sources: article.external_sources || undefined,
    region: article.region || undefined,
    area_exterior: article.area_exterior || undefined,
  };
}

export function createNewsService(apiUrl: string) {
  return {
    async fetchArticles(): Promise<Article[]> {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${apiUrl}/articles`, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.ok) {
          const articles = await response.json();
          return articles.map(mapArticle);
        }
        return MOCK_ARTICLES;
      } catch {
        return MOCK_ARTICLES;
      }
    },

    async searchArticles(query: string): Promise<Article[]> {
      try {
        if (!query.trim()) return this.fetchArticles();
        const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const articles = await response.json();
          return articles.map(mapArticle);
        }
        return [];
      } catch {
        return [];
      }
    }
  };
}

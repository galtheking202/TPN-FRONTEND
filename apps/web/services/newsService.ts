import { GoogleGenAI, Type } from "@google/genai";
import { Article, createNewsService } from "@tpn/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const _base = createNewsService(API_URL);

export const newsService = {
  fetchArticles: () => _base.fetchArticles(),
  searchArticles: (query: string) => _base.searchArticles(query),

  async generateAIDispatches(): Promise<Article[]> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Generate 3 high-priority news articles about current global events. Keep the tone professional, objective, and authoritative. Return JSON.',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                category: { type: Type.STRING },
                isUrgent: { type: Type.BOOLEAN },
                imageUrl: { type: Type.STRING },
                source: { type: Type.STRING }
              },
              required: ['id', 'title', 'summary', 'category', 'isUrgent']
            }
          }
        }
      });

      const text = response.text;
      const articles = JSON.parse(text || '[]');
      return articles.map((a: any, index: number) => ({
        ...a,
        id: `ai-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        imageUrl: `https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800`
      }));
    } catch {
      return [];
    }
  }
};

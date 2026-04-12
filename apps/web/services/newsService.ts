import { GoogleGenAI, Type } from "@google/genai";
import { Article, createNewsService } from "@tpn/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// ── Ingest types ─────────────────────────────────────────────────────────────

export interface IngestReport {
  id: string;
  channel_name: string;
  platform?: 'telegram' | 'twitter' | 'x' | 'unknown';
  category: string;
  location_name?: string;
  created_at: string;
  updated_at?: string;
  report_txt: string;
  key_points?: string[];
}

export interface ChannelGroup {
  channel_id: string;
  channel_name: string;
  platform: string;
  reports: IngestReport[];
}

export interface IngestByChannelResponse {
  channels: ChannelGroup[];
  total_reports: number;
}

const _base = createNewsService(API_URL);

export const newsService = {
  fetchArticles: () => _base.fetchArticles(),
  searchArticles: (query: string) => _base.searchArticles(query),

  async fetchIngestByChannel(): Promise<IngestByChannelResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_URL}/ingest`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // The server already returns { channels: [...], total_reports: N }
      const raw = await response.json();
      return raw as IngestByChannelResponse;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  },

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

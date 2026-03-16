
export interface LanguageContent {
  title: string;
  summary: string;
  body: string;
  external_sources?: string[];
}

export interface Article {
  id: string;
  title?: string;
  header?: string;
  summary?: string;
  content?: string;
  category: 'Politics' | 'Economy' | 'Health' | 'Technology' | 'Environment' | 'Defence and Security' | 'Sports';
  timestamp?: string;
  date?: string;
  created_at?: string;
  last_updated?: string;
  isUrgent?: boolean;
  imageUrl?: string;
  source?: string;
  author?: string;
  languages?: Record<string, LanguageContent>;
  credibility_score?: number;  // Score from 0-10
  external_sources?: string[];  // URLs from sources
  region?: string;             // e.g. "Tel Aviv", "Springfield County"
  area_exterior?: { type: string; coordinates: any[] };
}

export enum ReportLevel {
  STABLE = 'STABLE',
  ELEVATED = 'ELEVATED',
  CRITICAL = 'CRITICAL'
}

export type FilterType = 'notification' | 'viewing' | 'both';

export interface SavedFilter {
  id: string;
  name: string;
  categories: string[];  // empty = match all categories
  regions: string[];     // empty = match all regions
  enabled: boolean;
  filterType: FilterType; // 'notification' | 'viewing' | 'both'
}

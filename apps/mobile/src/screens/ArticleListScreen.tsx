import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Article, createNewsService } from '@tpn/shared';
import { useAppContext } from '../context/AppContext';
import ArticleImage from '../components/ArticleImage';
import { RootStackParamList } from '../App';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const newsService = createNewsService(API_URL);

const COLORS = {
  bg: '#0A0A0F', surface: '#111118', surfaceRaised: '#16161F',
  border: '#1E1E2A', primary: '#0057FF', breaking: '#FF3333',
  text: '#FFFFFF', textSub: '#A8A8C0', textMuted: '#505070',
};

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#FF6B35', Economy: '#00C896', Health: '#FF4D6D',
  Technology: '#0057FF', Environment: '#3DBF6E',
  'Defence and Security': '#9747FF', Sports: '#FFB800',
};


function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleList'>;

export default function ArticleListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { savedFilters, toggleFilter, isPinned, togglePin, language, isRTL } = useAppContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchAnim = useRef(new Animated.Value(0)).current;

  const hasScrolledDown = useRef(false);

  const initialLoad = useRef(true);

  const loadArticles = useCallback(async () => {
    const data = await newsService.fetchArticles();
    setArticles(data);
    setLoading(false);
    if (initialLoad.current) {
      initialLoad.current = false;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles();
    setRefreshing(false);
  }, [loadArticles]);

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y > 60) hasScrolledDown.current = true;
    if (y <= 0 && hasScrolledDown.current) {
      hasScrolledDown.current = false;
      loadArticles();
    }
  }, [loadArticles]);

  const toggleSearch = () => {
    const toValue = searchVisible ? 0 : 1;
    setSearchVisible(!searchVisible);
    if (searchVisible) setSearchQuery('');
    Animated.timing(searchAnim, { toValue, duration: 200, useNativeDriver: false }).start();
  };

  // All enabled filters (shown in banner)
  const activeFilters = savedFilters.filter(f => f.enabled);
  // Only filters that affect article viewing
  const articleFilters = activeFilters.filter(f => f.filterType === 'viewing' || f.filterType === 'both');

  // Filter logic — notification-only filters don't affect the list
  const filtered = articles.filter(a => {
    if (articleFilters.length > 0) {
      return articleFilters.some(f => {
        const catOk = f.categories.length === 0 || f.categories.includes(a.category);
        const regionOk = f.regions.length === 0 || f.regions.includes(a.region ?? '');
        return catOk && regionOk;
      });
    }
    const catOk = true;
    const q = searchQuery.toLowerCase();
    const searchOk = !q || (a.title ?? '').toLowerCase().includes(q) || (a.summary ?? '').toLowerCase().includes(q);
    return catOk && searchOk;
  });

  const searchHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });

  const getTitle = (a: Article) => {
    const lang = a.languages?.[language] ?? a.languages?.['en'];
    return lang?.title ?? a.title ?? t('article.untitled');
  };
  const getSummary = (a: Article) => {
    const lang = a.languages?.[language] ?? a.languages?.['en'];
    return lang?.summary ?? a.summary ?? '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={styles.loadingDot} />
        <Text style={styles.loadingText}>Loading news...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerLogo}>THE PEOPLE</Text>
          <Text style={styles.headerLogoAccent}>NEWS</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={toggleSearch}>
            <Ionicons name={searchVisible ? 'close' : 'search'} size={18} color={COLORS.textSub} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('JournalistSearch')}>
            <Ionicons name="newspaper-outline" size={18} color={COLORS.textSub} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={18} color={COLORS.textSub} />
            {savedFilters.some(f => f.enabled) && <View style={styles.filterDot} />}
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchWrap, { height: searchHeight, overflow: 'hidden' }]}>
        <View style={styles.searchInner}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={searchVisible}
          />
        </View>
      </Animated.View>

      {/* Active filters banner */}
      {activeFilters.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBanner} contentContainerStyle={styles.filterBannerContent}>
          <Ionicons name="funnel" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
          {activeFilters.map(f => {
            const isNotifOnly = f.filterType === 'notification';
            const isBoth = f.filterType === 'both';
            const tagColor = isNotifOnly ? '#FFB800' : COLORS.primary;
            return (
              <Pressable key={f.id} style={[styles.filterTag, { backgroundColor: tagColor + '22', borderColor: tagColor + '88' }]} onPress={() => toggleFilter(f.id)}>
                <Ionicons
                  name={isNotifOnly ? 'notifications-outline' : isBoth ? 'layers-outline' : 'eye-outline'}
                  size={10}
                  color={tagColor}
                />
                <Text style={[styles.filterTagText, { color: tagColor }]}>{f.name}</Text>
                <Ionicons name="close" size={10} color={tagColor} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

{/* Article List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>{t('feed.no_articles')}</Text>
          </View>
        }
        renderItem={({ item, index }) =>
          index === 0 && !searchQuery && articleFilters.length === 0 ? (
            <FeaturedCard
              article={item}
              title={getTitle(item)}
              pinned={isPinned(item.id)}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
              onPin={() => togglePin({ id: item.id, title: getTitle(item), category: item.category, source: item.source, timestamp: item.timestamp, imageUrl: item.imageUrl, summary: getSummary(item) })}
            />
          ) : (
            <ArticleCard
              article={item}
              title={getTitle(item)}
              summary={getSummary(item)}
              pinned={isPinned(item.id)}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
              onPin={() => togglePin({ id: item.id, title: getTitle(item), category: item.category, source: item.source, timestamp: item.timestamp, imageUrl: item.imageUrl, summary: getSummary(item) })}
            />
          )
        }
      />

    </View>
  );
}

function FeaturedCard({ article, title, pinned, onPress, onPin }: { article: Article; title: string; pinned: boolean; onPress: () => void; onPin: () => void }) {
  const { isRTL } = useAppContext();
  const catColor = CATEGORY_COLORS[article.category] ?? COLORS.primary;
  return (
    <Pressable style={styles.featured} onPress={onPress}>
      <ArticleImage uri={article.imageUrl} category={article.category} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <Pressable style={[styles.pinBtn, isRTL ? { left: 12, right: undefined } : { right: 12, left: undefined }]} onPress={onPin}>
        <Ionicons name={pinned ? 'bookmark' : 'bookmark-outline'} size={18} color={pinned ? COLORS.primary : '#fff'} />
      </Pressable>
      <View style={[styles.featuredContent, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <View style={[styles.featuredBadges, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {article.isUrgent && <View style={styles.breakingBadge}><Text style={styles.breakingText}>● BREAKING</Text></View>}
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '22', borderColor: catColor }]}>
            <Text style={[styles.categoryBadgeText, { color: catColor }]}>{article.category.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[styles.featuredTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={3}>{title}</Text>
        <View style={[styles.featuredMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.metaSource}>{article.source}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaTime}>{timeAgo(article.timestamp ?? article.date)}</Text>
          {article.region && <><Text style={styles.metaDot}>·</Text><Text style={styles.metaTime}>📍 {article.region}</Text></>}
        </View>
      </View>
    </Pressable>
  );
}

function ArticleCard({ article, title, summary, pinned, onPress, onPin }: { article: Article; title: string; summary: string; pinned: boolean; onPress: () => void; onPin: () => void }) {
  const { isRTL } = useAppContext();
  const catColor = CATEGORY_COLORS[article.category] ?? COLORS.primary;
  return (
    <Pressable style={[styles.card, article.isUrgent && styles.cardUrgent]} onPress={onPress}>
      {article.isUrgent && <View style={styles.urgentStrip} />}
      <View style={[styles.cardBody, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <View style={[styles.cardTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '22', borderColor: catColor }]}>
            <Text style={[styles.categoryBadgeText, { color: catColor }]}>{article.category.toUpperCase()}</Text>
          </View>
          {article.region && <Text style={styles.regionTag}>📍 {article.region}</Text>}
        </View>
        <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{title}</Text>
        <Text style={[styles.cardSummary, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{summary}</Text>
        <View style={[styles.cardMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.metaSource}>{article.source}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaTime}>{timeAgo(article.timestamp ?? article.date)}</Text>
          {article.credibility_score !== undefined && <CredibilityDots score={article.credibility_score} />}
        </View>
      </View>
      <View style={styles.cardRight}>
        <ArticleImage uri={article.imageUrl} category={article.category} style={styles.cardThumb} square />
        <Pressable style={styles.cardPinBtn} onPress={onPin}>
          <Ionicons name={pinned ? 'bookmark' : 'bookmark-outline'} size={16} color={pinned ? COLORS.primary : COLORS.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function CredibilityDots({ score }: { score: number }) {
  const level = score >= 7 ? COLORS.primary : score >= 4 ? '#FFB800' : COLORS.breaking;
  const filled = Math.round((score / 10) * 5);
  return (
    <View style={styles.dotsWrap}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[styles.dot, { backgroundColor: i <= filled ? level : COLORS.border }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  loadingText: { color: COLORS.textMuted, fontSize: 13 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  headerLogo: { color: COLORS.text, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  headerLogoAccent: { color: COLORS.primary, fontSize: 13, fontWeight: '700', letterSpacing: 4, marginTop: -4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.bg },

  searchWrap: { paddingHorizontal: 16 },
  searchInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 40, marginBottom: 8 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },

  filterBanner: { flexShrink: 0 },
  filterBannerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  filterTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: COLORS.primary + '22', borderWidth: 1, borderColor: COLORS.primary + '55' },
  filterTagText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

listContent: { paddingBottom: 8 },
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },

  featured: { marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 16, overflow: 'hidden', height: 240, backgroundColor: COLORS.surface },
  featuredImage: { position: 'absolute', width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: COLORS.surfaceRaised },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', backgroundColor: 'rgba(10,10,15,0.82)' },
  pinBtn: { position: 'absolute', top: 12, backgroundColor: 'rgba(10,10,15,0.5)', padding: 8, borderRadius: 20 },
  featuredContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  featuredBadges: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  featuredTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', lineHeight: 24, marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },

  breakingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.breaking + '22', borderWidth: 1, borderColor: COLORS.breaking, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  breakingText: { color: COLORS.breaking, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  categoryBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  categoryBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },

  card: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  cardUrgent: { borderColor: COLORS.breaking + '55' },
  urgentStrip: { width: 3, backgroundColor: COLORS.breaking },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  cardSummary: { color: COLORS.textSub, fontSize: 12, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  cardRight: { justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10 },
  cardThumb: { width: 76, height: 76, borderRadius: 10, opacity: 0.92 },
  cardPinBtn: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(10,10,15,0.6)', padding: 4, borderRadius: 12 },
  regionTag: { color: COLORS.textMuted, fontSize: 10 },

  metaSource: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500' },
  metaDot: { color: COLORS.textMuted, fontSize: 11 },
  metaTime: { color: COLORS.textMuted, fontSize: 11 },
  dotsWrap: { flexDirection: 'row', gap: 3, marginLeft: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});

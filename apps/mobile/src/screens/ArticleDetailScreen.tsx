import React, { useRef, useState } from 'react';
import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import ArticleImage from '../components/ArticleImage';
import { RootStackParamList } from '../App';

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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function credibilityLabel(score: number): { label: string; color: string } {
  if (score >= 7) return { label: 'HIGH', color: COLORS.primary };
  if (score >= 4) return { label: 'MODERATE', color: '#FFB800' };
  return { label: 'LOW', color: COLORS.breaking };
}

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, isRTL, isPinned, togglePin } = useAppContext();
  const { article } = route.params;

  const [progress, setProgress] = useState(0);
  const contentHeight = useRef(0);

  const langContent = article.languages?.[language] ?? article.languages?.['en'] ?? article.languages?.['english'];
  const title = langContent?.title ?? article.title ?? t('article.untitled');
  const body = langContent?.body ?? article.content ?? t('article.no_content');
  const summary = langContent?.summary ?? article.summary;
  const sources = article.external_sources ?? langContent?.external_sources ?? [];
  const catColor = CATEGORY_COLORS[article.category] ?? COLORS.primary;
  const pinned = isPinned(article.id);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentHeight.current - layoutMeasurement.height;
    if (scrollable > 0) setProgress(Math.min(1, contentOffset.y / scrollable));
  };

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Reading progress bar */}
      <View style={[styles.progressTrack, { top: 0 }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Hero Image */}
      <View style={styles.hero}>
        <ArticleImage uri={article.imageUrl} category={article.category} style={styles.heroImage} />
        <View style={styles.heroOverlay} />

        {/* Back button */}
        <Pressable style={[styles.backBtn, { top: insets.top + 10, [isRTL ? 'right' : 'left']: 16 }]} onPress={() => navigation.goBack()}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={COLORS.text} />
          <Text style={styles.backText}>{t('article.back')}</Text>
        </Pressable>

        {/* Pin button */}
        <Pressable style={[styles.heroAction, { top: insets.top + 10, [isRTL ? 'left' : 'right']: 16 }]} onPress={() =>
          togglePin({ id: article.id, title, category: article.category, source: article.source, timestamp: article.timestamp, imageUrl: article.imageUrl, summary: summary ?? '' })
        }>
          <Ionicons name={pinned ? 'bookmark' : 'bookmark-outline'} size={18} color={pinned ? COLORS.primary : COLORS.text} />
        </Pressable>

        {article.isUrgent && (
          <View style={[styles.breakingBadge, isRTL ? { right: 16, left: undefined } : null]}>
            <Text style={styles.breakingText}>● BREAKING NEWS</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(_, h) => { contentHeight.current = h; }}
      >
        {/* Category + Credibility + Region */}
        <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.categoryChip, { backgroundColor: catColor + '22', borderColor: catColor }]}>
            <Text style={[styles.categoryChipText, { color: catColor }]}>{article.category.toUpperCase()}</Text>
          </View>
          {article.credibility_score !== undefined && <CredibilityBadge score={article.credibility_score} />}
          {article.region && (
            <View style={styles.regionChip}>
              <Ionicons name="location-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.regionText}>{article.region}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>

        {/* Meta */}
        <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {article.author && <Text style={styles.metaText}><Text style={styles.metaLabel}>{t('article.by')} </Text>{article.author}</Text>}
          {article.source && <><Text style={styles.metaSep}>·</Text><Text style={styles.metaText}>{article.source}</Text></>}
          {(article.date ?? article.timestamp) && <><Text style={styles.metaSep}>·</Text><Text style={styles.metaText}>{formatDate(article.date ?? article.timestamp)}</Text></>}
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        {summary && <><Text style={[styles.summary, { textAlign: isRTL ? 'right' : 'left' }]}>{summary}</Text><View style={styles.divider} /></>}

        {/* Body */}
        <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]}>{body}</Text>

        {/* Sources */}
        {sources.length > 0 && (
          <View style={styles.sourcesSection}>
            <Text style={styles.sourcesTitle}>{t('article.sources').toUpperCase()}</Text>
            {sources.map((url, i) => (
              <Pressable key={i} onPress={() => Linking.openURL(url)} style={styles.sourceRow}>
                <View style={styles.sourceDot} />
                <Text style={styles.sourceUrl} numberOfLines={1}>{url}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 32 + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

function CredibilityBadge({ score }: { score: number }) {
  const { label, color } = credibilityLabel(score);
  const filled = Math.round((score / 10) * 5);
  return (
    <View style={[styles.credBadge, { borderColor: color + '55', backgroundColor: color + '15' }]}>
      <View style={styles.credDots}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.credDot, { backgroundColor: i <= filled ? color : COLORS.border }]} />
        ))}
      </View>
      <Text style={[styles.credLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  progressTrack: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: COLORS.border, zIndex: 10 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },

  hero: { height: 240, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderIcon: { fontSize: 48 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(10,10,15,0.7)' },

  backBtn: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,10,15,0.6)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  backText: { color: COLORS.text, fontSize: 13, fontWeight: '500' },
  heroAction: { position: 'absolute', backgroundColor: 'rgba(10,10,15,0.6)', padding: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  breakingBadge: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.breaking, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  breakingText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  topRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  categoryChip: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  categoryChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  regionChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.surfaceRaised, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  regionText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '500' },

  credBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, gap: 6 },
  credDots: { flexDirection: 'row', gap: 3 },
  credDot: { width: 5, height: 5, borderRadius: 3 },
  credLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  title: { color: COLORS.text, fontSize: 22, fontWeight: '700', lineHeight: 30, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText: { color: COLORS.textMuted, fontSize: 12 },
  metaLabel: { color: COLORS.textMuted, fontSize: 12 },
  metaSep: { color: COLORS.border, fontSize: 12 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  summary: { color: COLORS.textSub, fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginBottom: 16 },
  body: { color: '#D0D0E8', fontSize: 15, lineHeight: 26 },

  sourcesSection: { marginTop: 28, padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  sourcesTitle: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sourceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  sourceUrl: { flex: 1, color: COLORS.primary, fontSize: 12, textDecorationLine: 'underline' },
});

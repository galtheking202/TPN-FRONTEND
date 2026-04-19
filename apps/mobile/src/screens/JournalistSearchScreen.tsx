import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { COLORS } from '../theme';

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#C06B4A',
  Economy: '#5A9A8A',
  Health: '#C4798A',
  Technology: '#6B85C7',
  Environment: '#7BA381',
  'Defence and Security': '#8A7AB0',
  Sports: '#C99A4C',
  Intelligence: '#C46A5E',
  Cyber: '#6B85C7',
  Finance: '#5A9A8A',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface IngestReport {
  id: string;
  channel: string;
  channelType: 'Telegram' | 'Twitter' | 'Forum' | 'Dark Web' | 'News Wire';
  category: string;
  report: string;
  timestamp: string;
  keywords: string[];
  credibility: number;
  isUrgent: boolean;
  region: string;
}

const MOCK_REPORTS: IngestReport[] = [
  {
    id: '1',
    channel: '@geopolitics_now',
    channelType: 'Telegram',
    category: 'Politics',
    report:
      'Senior officials from three NATO member states convened an unscheduled emergency session in Brussels on Tuesday evening. Sources indicate the session lasted over six hours and centered on military posture adjustments in the eastern flank. No official statement has been released.',
    timestamp: '2026-03-29T07:14:00Z',
    keywords: ['NATO', 'Brussels', 'military', 'eastern flank'],
    credibility: 8,
    isUrgent: true,
    region: 'Europe',
  },
  {
    id: '2',
    channel: 'FinanceLeaks_Wire',
    channelType: 'Telegram',
    category: 'Finance',
    report:
      'Internal memo from a major European investment bank suggests exposure to sovereign debt in three emerging markets exceeds regulatory thresholds. The memo, dated March 25, references stress-test scenarios not yet disclosed to regulators.',
    timestamp: '2026-03-29T05:48:00Z',
    keywords: ['bank', 'sovereign debt', 'regulatory', 'exposure'],
    credibility: 6,
    isUrgent: false,
    region: 'Europe',
  },
  {
    id: '3',
    channel: 'CyberWatch_Intel',
    channelType: 'Forum',
    category: 'Cyber',
    report:
      'A previously undocumented threat actor designated TA-2291 has been observed deploying a new loader variant targeting critical infrastructure operators in the Gulf region. The loader uses certificate pinning to evade common sandbox detection.',
    timestamp: '2026-03-28T22:31:00Z',
    keywords: ['threat actor', 'loader', 'critical infrastructure', 'Gulf', 'sandbox'],
    credibility: 9,
    isUrgent: true,
    region: 'Middle East',
  },
  {
    id: '4',
    channel: '@defence_pulse',
    channelType: 'Telegram',
    category: 'Defence and Security',
    report:
      'Satellite imagery analysis from a third-party firm indicates increased logistics activity at a military depot 80 km north of the border. The activity pattern is consistent with pre-positioning of armored units. Assessment confidence: moderate.',
    timestamp: '2026-03-28T18:05:00Z',
    keywords: ['satellite', 'military depot', 'armored', 'logistics', 'border'],
    credibility: 7,
    isUrgent: false,
    region: 'Eastern Europe',
  },
  {
    id: '5',
    channel: 'AP Diplomatic Feed',
    channelType: 'News Wire',
    category: 'Politics',
    report:
      'The foreign ministry of Country X denied reports of back-channel negotiations with a regional rival, calling the claims "categorically false." Three diplomatic sources speaking anonymously confirmed talks are ongoing through a third-party mediator.',
    timestamp: '2026-03-28T14:22:00Z',
    keywords: ['diplomacy', 'negotiations', 'foreign ministry', 'back-channel'],
    credibility: 8,
    isUrgent: false,
    region: 'Asia',
  },
  {
    id: '6',
    channel: 'darknet_chatter_bot',
    channelType: 'Dark Web',
    category: 'Intelligence',
    report:
      'Chatter on a monitored dark web forum references a planned coordinated operation targeting financial messaging infrastructure. Specifics remain vague but multiple independent handles have corroborated the timeline as "within 30 days."',
    timestamp: '2026-03-28T09:50:00Z',
    keywords: ['dark web', 'financial', 'messaging infrastructure', 'coordinated'],
    credibility: 4,
    isUrgent: true,
    region: 'Global',
  },
  {
    id: '7',
    channel: '@health_signals_mena',
    channelType: 'Telegram',
    category: 'Health',
    report:
      'Local health authorities in two provinces have imposed movement restrictions following a cluster of unspecified respiratory illness. Regional WHO office has dispatched a rapid response team. Case count is unconfirmed but estimated at over 400.',
    timestamp: '2026-03-27T21:10:00Z',
    keywords: ['WHO', 'respiratory', 'restrictions', 'cluster', 'outbreak'],
    credibility: 7,
    isUrgent: true,
    region: 'MENA',
  },
  {
    id: '8',
    channel: 'EconWatch_Global',
    channelType: 'Twitter',
    category: 'Economy',
    report:
      'Preliminary Q1 trade data from a G20 member shows a 14% contraction in exports, significantly below consensus estimates. The data has not yet been officially published; figures cited from an early government briefing document.',
    timestamp: '2026-03-27T16:45:00Z',
    keywords: ['trade', 'G20', 'exports', 'contraction', 'Q1'],
    credibility: 6,
    isUrgent: false,
    region: 'Global',
  },
  {
    id: '9',
    channel: 'TechInsider_Wire',
    channelType: 'News Wire',
    category: 'Technology',
    report:
      'A major cloud provider experienced a partial outage affecting government-tier contracts in two regions for approximately 90 minutes. Internal post-mortem cites a misconfigured routing table update pushed during a routine maintenance window.',
    timestamp: '2026-03-27T11:30:00Z',
    keywords: ['cloud', 'outage', 'government', 'routing', 'maintenance'],
    credibility: 9,
    isUrgent: false,
    region: 'North America',
  },
  {
    id: '10',
    channel: '@environ_watch',
    channelType: 'Telegram',
    category: 'Environment',
    report:
      'An NGO monitoring industrial discharge reports elevated toxin levels in a river basin shared by two nations. The readings, taken over three consecutive days, exceed safe limits by a factor of 6. Neither government has responded to press inquiries.',
    timestamp: '2026-03-26T08:00:00Z',
    keywords: ['environment', 'toxin', 'river', 'discharge', 'NGO'],
    credibility: 7,
    isUrgent: false,
    region: 'Central Asia',
  },
];

const ALL_KEYWORDS = Array.from(
  new Set(MOCK_REPORTS.flatMap((r) => r.keywords)),
).sort();

const CHANNEL_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Telegram: 'paper-plane-outline',
  Twitter: 'logo-twitter',
  Forum: 'chatbubbles-outline',
  'Dark Web': 'eye-off-outline',
  'News Wire': 'radio-outline',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function credibilityColor(score: number): string {
  if (score >= 7) return COLORS.success;
  if (score >= 4) return COLORS.warning;
  return COLORS.breaking;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CredibilityDots({ score }: { score: number }) {
  const color = credibilityColor(score);
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: i < score ? color : 'transparent',
            borderWidth: 1,
            borderColor: i < score ? color : COLORS.border,
          }}
        />
      ))}
      <Text style={{ color: color, fontSize: 10, fontWeight: '700', marginLeft: 4 }}>
        {score}/10
      </Text>
    </View>
  );
}

function ReportCard({ item }: { item: IngestReport }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[item.category] ?? COLORS.primary;
  const channelIcon = CHANNEL_TYPE_ICONS[item.channelType] ?? 'radio-outline';

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={[styles.card, item.isUrgent && styles.cardUrgent]}
    >
      {/* Top row: channel + time */}
      <View style={styles.cardHeader}>
        <View style={styles.channelRow}>
          <View style={styles.channelIconWrap}>
            <Ionicons name={channelIcon} size={12} color={COLORS.textSub} />
          </View>
          <Text style={styles.channelName} numberOfLines={1}>
            {item.channel}
          </Text>
          <Text style={styles.channelType}>{item.channelType}</Text>
        </View>
        <Text style={styles.timeText}>{timeAgo(item.timestamp)}</Text>
      </View>

      {/* Badges row: category + urgent + region */}
      <View style={styles.badgesRow}>
        {item.isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>● URGENT</Text>
          </View>
        )}
        <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor }]}>
          <Text style={[styles.catBadgeText, { color: catColor }]}>{item.category}</Text>
        </View>
        <View style={styles.regionBadge}>
          <Ionicons name="location-outline" size={9} color={COLORS.textMuted} />
          <Text style={styles.regionText}>{item.region}</Text>
        </View>
      </View>

      {/* Report body */}
      <Text
        style={styles.reportText}
        numberOfLines={expanded ? undefined : 3}
      >
        {item.report}
      </Text>

      {/* Expand hint */}
      {!expanded && (
        <Text style={styles.expandHint}>Tap to expand  ↓</Text>
      )}

      {/* Keywords (shown when expanded) */}
      {expanded && (
        <View style={styles.keywordsWrap}>
          {item.keywords.map((kw) => (
            <View key={kw} style={styles.kwTag}>
              <Text style={styles.kwTagText}># {kw}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Credibility */}
      <View style={styles.credRow}>
        <Ionicons name="shield-checkmark-outline" size={11} color={COLORS.textMuted} />
        <Text style={styles.credLabel}>Credibility</Text>
        <CredibilityDots score={item.credibility} />
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'JournalistSearch'>;

export default function JournalistSearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const categories = useMemo(
    () => Array.from(new Set(MOCK_REPORTS.map((r) => r.category))).sort(),
    [],
  );

  const toggleKeyword = (kw: string) => {
    setActiveKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw],
    );
  };

  const clearAll = () => {
    setQuery('');
    setActiveKeywords([]);
    setActiveCategory(null);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_REPORTS.filter((r) => {
      const matchesQuery =
        !q ||
        r.report.toLowerCase().includes(q) ||
        r.channel.toLowerCase().includes(q) ||
        r.keywords.some((k) => k.toLowerCase().includes(q));

      const matchesKeywords =
        activeKeywords.length === 0 ||
        activeKeywords.every((kw) =>
          r.keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase()),
        );

      const matchesCategory =
        !activeCategory || r.category === activeCategory;

      return matchesQuery && matchesKeywords && matchesCategory;
    });
  }, [query, activeKeywords, activeCategory]);

  // Shake animation when no results
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const hasFilters = query.trim() || activeKeywords.length > 0 || activeCategory;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textSub} />
          </Pressable>
          <View style={styles.headerIconWrap}>
            <Ionicons name="search" size={16} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>INGEST SEARCH</Text>
            <Text style={styles.headerSub}>Journalist Intelligence Tool</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>MOCK</Text>
          </View>
        </View>
      </View>

      {/* ── Search bar ── */}
      <Animated.View style={[styles.searchWrap, { transform: [{ translateX: shakeAnim }] }]}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search reports, channels, keywords…"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
          </Pressable>
        )}
      </Animated.View>

      {/* ── Category filter strip ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryStrip}
        style={styles.categoryStripOuter}
      >
        {categories.map((cat) => {
          const color = CATEGORY_COLORS[cat] ?? COLORS.primary;
          const active = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(active ? null : cat)}
              style={[
                styles.catChip,
                {
                  backgroundColor: active ? color + '33' : color + '12',
                  borderColor: active ? color : color + '44',
                },
              ]}
            >
              <Text style={[styles.catChipText, { color: active ? color : color + 'AA' }]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Keyword filter strip ── */}
      <View style={styles.kwSection}>
        <Text style={styles.kwSectionLabel}>KEYWORDS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kwStrip}
        >
          {ALL_KEYWORDS.map((kw) => {
            const active = activeKeywords.includes(kw);
            return (
              <Pressable
                key={kw}
                onPress={() => toggleKeyword(kw)}
                style={[
                  styles.kwChip,
                  active && styles.kwChipActive,
                ]}
              >
                <Text style={[styles.kwChipText, active && styles.kwChipTextActive]}>
                  # {kw}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Results header ── */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {results.length} {results.length === 1 ? 'report' : 'reports'} found
        </Text>
        {hasFilters && (
          <Pressable onPress={clearAll} style={styles.clearAllBtn}>
            <Ionicons name="close-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.clearAllText}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {/* ── Results list ── */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReportCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No reports found</Text>
            <Text style={styles.emptyBody}>
              Try a different query or adjust your keyword filters.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: { alignItems: 'flex-end' },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  liveText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  clearBtn: { padding: 4 },

  // Category strip
  categoryStripOuter: { maxHeight: 40 },
  categoryStrip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
    flexDirection: 'row',
  },
  catChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  catChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  // Keyword strip
  kwSection: { marginTop: 8 },
  kwSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 16,
    marginBottom: 5,
  },
  kwStrip: {
    paddingHorizontal: 16,
    gap: 6,
    flexDirection: 'row',
  },
  kwChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  kwChipActive: {
    borderColor: COLORS.accent + '88',
    backgroundColor: COLORS.accent + '22',
  },
  kwChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  kwChipTextActive: { color: COLORS.accent },

  // Results header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  resultsCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },

  // List
  listContent: { paddingBottom: 32 },

  // Card
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 8,
  },
  cardUrgent: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.breaking,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  channelIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  channelType: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  urgentBadge: {
    backgroundColor: COLORS.breaking + '22',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.breaking,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentBadgeText: {
    color: COLORS.breaking,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  catBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  regionText: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600' },

  // Report body
  reportText: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  expandHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: 0.3,
  },

  // Keywords (expanded)
  keywordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  kwTag: {
    backgroundColor: COLORS.accent + '18',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.accent + '44',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  kwTagText: { color: COLORS.accent, fontSize: 10, fontWeight: '600' },

  // Credibility row
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 2,
  },
  credLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginRight: 4 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { color: COLORS.textSub, fontSize: 16, fontWeight: '700' },
  emptyBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

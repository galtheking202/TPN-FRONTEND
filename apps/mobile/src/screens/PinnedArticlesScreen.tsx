import React from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import ArticleImage from '../components/ArticleImage';
import { RootStackParamList } from '../App';
import { COLORS } from '../theme';

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#FF6B35', Economy: '#00C896', Health: '#FF4D6D',
  Technology: '#0057FF', Environment: '#3DBF6E',
  'Defence and Security': '#9747FF', Sports: '#FFB800',
};

type Props = NativeStackScreenProps<RootStackParamList, 'PinnedArticles'>;

export default function PinnedArticlesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isRTL, pinnedArticles, togglePin } = useAppContext();

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Pinned Articles</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={pinnedArticles}
        keyExtractor={item => item.id}
        contentContainerStyle={pinnedArticles.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No pinned articles</Text>
            <Text style={styles.emptyText}>Tap the bookmark icon on any article to save it here</Text>
          </View>
        }
        renderItem={({ item }) => {
          const catColor = CATEGORY_COLORS[item.category] ?? COLORS.primary;
          return (
            <View style={styles.card}>
              <View style={styles.cardBody}>
                <View style={[styles.catBadge, { borderColor: catColor, backgroundColor: catColor + '22' }]}>
                  <Text style={[styles.catText, { color: catColor }]}>{item.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {item.summary && <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text>}
                <View style={styles.meta}>
                  {item.source && <Text style={styles.metaText}>{item.source}</Text>}
                </View>
              </View>
              <ArticleImage uri={item.imageUrl} category={item.category} style={styles.thumb} square />
              <Pressable style={styles.unpinBtn} onPress={() => togglePin(item)}>
                <Ionicons name="bookmark" size={18} color={COLORS.primary} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { color: COLORS.textSub, fontSize: 16, fontWeight: '600' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  card: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  catBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  catText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  title: { color: COLORS.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  summary: { color: COLORS.textSub, fontSize: 12, lineHeight: 17 },
  meta: { flexDirection: 'row', gap: 6 },
  metaText: { color: COLORS.textMuted, fontSize: 11 },
  thumb: { width: 80, aspectRatio: 1, margin: 10 },
  unpinBtn: { position: 'absolute', top: 10, padding: 6 },
});

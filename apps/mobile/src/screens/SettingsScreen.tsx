import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from '../App';

const COLORS = {
  bg: '#0A0A0F',
  surface: '#111118',
  surfaceRaised: '#16161F',
  border: '#1E1E2A',
  primary: '#0057FF',
  breaking: '#FF3333',
  text: '#FFFFFF',
  textSub: '#A8A8C0',
  textMuted: '#505070',
};

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'he', label: 'Hebrew', native: 'עברית' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
];


type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { language, isRTL, setLanguage, savedFilters, removeFilter, toggleFilter, pinnedArticles } = useAppContext();
  const [langDrumIndex, setLangDrumIndex] = useState(LANGUAGES.findIndex(l => l.code === language) || 0);

  const changeLang = (dir: 1 | -1) => {
    const next = (langDrumIndex + dir + LANGUAGES.length) % LANGUAGES.length;
    setLangDrumIndex(next);
    setLanguage(LANGUAGES[next].code);
  };

  const confirmRemoveFilter = (id: string, name: string) => {
    Alert.alert('Delete Filter', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeFilter(id) },
    ]);
  };

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Language ─────────────────────────── */}
        <Text style={styles.sectionLabel}>LANGUAGE</Text>
        <View style={styles.section}>
          <View style={styles.drum}>
            <Pressable style={styles.drumBtn} onPress={() => changeLang(-1)}>
              <Ionicons name="chevron-up" size={18} color={COLORS.textSub} />
            </Pressable>

            <View style={styles.drumWindow}>
              {[-1, 0, 1].map(offset => {
                const idx = (langDrumIndex + offset + LANGUAGES.length) % LANGUAGES.length;
                const lang = LANGUAGES[idx];
                const isCurrent = offset === 0;
                return (
                  <View key={lang.code} style={[styles.drumItem, isCurrent && styles.drumItemActive]}>
                    <Text style={[styles.drumNative, isCurrent && styles.drumNativeActive]}>{lang.native}</Text>
                    <Text style={[styles.drumLabel, isCurrent && styles.drumLabelActive]}>{lang.label}</Text>
                  </View>
                );
              })}
            </View>

            <Pressable style={styles.drumBtn} onPress={() => changeLang(1)}>
              <Ionicons name="chevron-down" size={18} color={COLORS.textSub} />
            </Pressable>
          </View>
        </View>

        {/* ── Saved Filters ────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SAVED FILTERS</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('FilterBuilder', { articles: [] })}
          >
            <Ionicons name="add" size={14} color={COLORS.primary} />
            <Text style={styles.addBtnText}>New Filter</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          {savedFilters.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="funnel-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.emptyRowText}>No saved filters yet</Text>
            </View>
          ) : (
            savedFilters.map((filter, i) => (
              <View key={filter.id}>
                {i > 0 && <View style={styles.sep} />}
                <Pressable style={styles.filterRow} onPress={() => navigation.navigate('FilterBuilder', { filter, articles: [] })}>
                  <View style={styles.filterInfo}>
                    <View style={styles.filterNameRow}>
                      <Text style={styles.filterName}>{filter.name}</Text>
                      <View style={[styles.filterTypeBadge, filter.filterType === 'notification' ? styles.filterTypeBadgeNotif : filter.filterType === 'both' ? styles.filterTypeBadgeBoth : styles.filterTypeBadgeView]}>
                        <Ionicons
                          name={filter.filterType === 'notification' ? 'notifications-outline' : filter.filterType === 'both' ? 'layers-outline' : 'eye-outline'}
                          size={11}
                          color={filter.filterType === 'notification' ? '#FFB800' : filter.filterType === 'both' ? '#9747FF' : COLORS.primary}
                        />
                      </View>
                    </View>
                    <Text style={styles.filterDesc}>
                      {filter.categories.length ? filter.categories.join(', ') : 'All categories'}
                      {filter.regions.length ? ` · ${filter.regions.join(', ')}` : ''}
                    </Text>
                  </View>
                  <View style={styles.filterActions}>
                    <Pressable style={styles.filterActionBtn} onPress={() => confirmRemoveFilter(filter.id, filter.name)}>
                      <Ionicons name="trash-outline" size={15} color={COLORS.breaking} />
                    </Pressable>
                    <Switch
                      value={filter.enabled}
                      onValueChange={() => toggleFilter(filter.id)}
                      trackColor={{ false: COLORS.border, true: COLORS.primary + '66' }}
                      thumbColor={filter.enabled ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* ── Pinned Articles ──────────────────── */}
        <Text style={styles.sectionLabel}>PINNED ARTICLES</Text>
        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => navigation.navigate('PinnedArticles')}>
            <View style={styles.rowIcon}>
              <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>Saved Articles</Text>
            <View style={styles.rowRight}>
              {pinnedArticles.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pinnedArticles.length}</Text>
                </View>
              )}
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={COLORS.textMuted} />
            </View>
          </Pressable>
        </View>

{/* ── About ───────────────────────────── */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} /></View>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name="globe-outline" size={18} color={COLORS.textMuted} /></View>
            <Text style={styles.rowLabel}>Data Source</Text>
            <Text style={styles.rowValue}>TPN Server</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  section: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  sep: { height: 1, backgroundColor: COLORS.border },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary + '55', backgroundColor: COLORS.primary + '11' },
  addBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

  // Language drum
  drum: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  drumBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  drumWindow: { flex: 1 },
  drumItem: { paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.35 },
  drumItemActive: { opacity: 1, backgroundColor: COLORS.primary + '15', borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary + '33' },
  drumNative: { color: COLORS.text, fontSize: 16, fontWeight: '600', minWidth: 60 },
  drumNativeActive: { color: COLORS.primary },
  drumLabel: { color: COLORS.textMuted, fontSize: 12 },
  drumLabelActive: { color: COLORS.textSub },

  // Filter rows
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  emptyRowText: { color: COLORS.textMuted, fontSize: 13 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  filterInfo: { flex: 1 },
  filterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  filterName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  filterTypeBadge: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, borderWidth: 1 },
  filterTypeBadgeView: { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '55' },
  filterTypeBadgeNotif: { backgroundColor: '#FFB80018', borderColor: '#FFB80055' },
  filterTypeBadgeBoth: { backgroundColor: '#9747FF18', borderColor: '#9747FF55' },
  filterDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  filterActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterActionBtn: { padding: 4 },

  // Generic rows
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  rowIcon: { width: 30, alignItems: 'center', marginRight: 10 },
  rowLabel: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  rowValue: { color: COLORS.textMuted, fontSize: 13 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

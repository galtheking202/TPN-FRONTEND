import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SavedFilter, FilterType } from '@tpn/shared';
import { useAppContext } from '../context/AppContext';
import MapFilter from '../components/MapFilter';
import { RootStackParamList } from '../App';
import { COLORS, CATEGORY_COLORS as CAT_COLORS } from '../theme';

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CAT_COLORS).map(([k, v]) => [k, v.solid])
);
const ALL_CATEGORIES = ['Politics', 'Economy', 'Health', 'Technology', 'Environment', 'Defence and Security', 'Sports'];

type Props = NativeStackScreenProps<RootStackParamList, 'FilterBuilder'>;

export default function FilterBuilderScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { addFilter, updateFilter, savedFilters, isRTL } = useAppContext();
  const existing = route.params?.filter;

  const [name, setName] = useState(existing?.name ?? '');
  const [categories, setCategories] = useState<string[]>(existing?.categories ?? []);
  const [regions, setRegions] = useState<string[]>(existing?.regions ?? []);
  const [filterType, setFilterType] = useState<FilterType>(existing?.filterType ?? 'both');
  const [nameError, setNameError] = useState('');
  const [articles] = useState(route.params?.articles ?? []);

  const toggleCategory = (cat: string) =>
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const toggleRegion = (region: string) =>
    setRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);

  const matchCount = articles.filter((a: any) => {
    const catMatch = categories.length === 0 || categories.includes(a.category);
    const regionMatch = regions.length === 0 || regions.includes(a.region ?? '');
    return catMatch && regionMatch;
  }).length;

  const save = () => {
    if (!name.trim()) { setNameError('Filter name is required'); return; }
    const duplicate = savedFilters.find(f => f.name.toLowerCase() === name.trim().toLowerCase() && f.id !== existing?.id);
    if (duplicate) { setNameError('A filter with this name already exists'); return; }

    const filter: SavedFilter = {
      id: existing?.id ?? Date.now().toString(),
      name: name.trim(),
      categories,
      regions,
      enabled: existing?.enabled ?? true,
      filterType,
    };
    existing ? updateFilter(filter) : addFilter(filter);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={20} color={COLORS.textSub} />
        </Pressable>
        <Text style={styles.headerTitle}>{existing ? 'Edit Filter' : 'New Filter'}</Text>
        <Pressable style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Filter name */}
        <Text style={styles.label}>FILTER NAME</Text>
        <TextInput
          style={[styles.nameInput, nameError ? styles.nameInputError : null]}
          placeholder="e.g. Middle East Tech"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={t => { setName(t); setNameError(''); }}
        />
        {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

        {/* Filter Type */}
        <Text style={styles.label}>FILTER TYPE</Text>
        <View style={styles.filterTypeRow}>
          {([
            { value: 'viewing', icon: 'eye-outline', label: 'Viewing' },
            { value: 'notification', icon: 'notifications-outline', label: 'Notification' },
            { value: 'both', icon: 'layers-outline', label: 'Both' },
          ] as { value: FilterType; icon: any; label: string }[]).map(opt => {
            const active = filterType === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.filterTypeBtn, active && styles.filterTypeBtnActive]}
                onPress={() => setFilterType(opt.value)}
              >
                <Ionicons name={opt.icon} size={16} color={active ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.filterTypeBtnText, active && styles.filterTypeBtnTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.filterTypeHint}>
          {filterType === 'viewing' && 'This filter controls what articles you see in the app.'}
          {filterType === 'notification' && 'This filter triggers push notifications for matching news.'}
          {filterType === 'both' && 'This filter applies to both what you see and your notifications.'}
        </Text>

        {/* Categories */}
        <Text style={styles.label}>CATEGORIES <Text style={styles.labelSub}>(empty = all)</Text></Text>
        <View style={styles.categoryGrid}>
          {ALL_CATEGORIES.map(cat => {
            const active = categories.includes(cat);
            const color = CATEGORY_COLORS[cat] ?? COLORS.primary;
            return (
              <Pressable
                key={cat}
                style={[styles.catChip, { borderColor: active ? color : COLORS.border, backgroundColor: active ? color + '22' : 'transparent' }]}
                onPress={() => toggleCategory(cat)}
              >
                {active && <Ionicons name="checkmark" size={11} color={color} />}
                <Text style={[styles.catChipText, { color: active ? color : COLORS.textMuted }]}>{cat}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Regions / Map */}
        <Text style={styles.label}>REGIONS <Text style={styles.labelSub}>(empty = all)</Text></Text>
        {articles.length > 0 ? (
          <MapFilter articles={articles} selected={regions} onToggle={toggleRegion} multiSelect />
        ) : (
          <View style={styles.noMapMsg}>
            <Ionicons name="map-outline" size={24} color={COLORS.textMuted} />
            <Text style={styles.noMapText}>Load articles first to see regions on the map</Text>
          </View>
        )}

        {/* Preview */}
        <View style={styles.preview}>
          <Ionicons name="newspaper-outline" size={16} color={COLORS.primary} />
          <Text style={styles.previewText}>
            Matches <Text style={styles.previewCount}>{matchCount}</Text> of {articles.length} current articles
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  label: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 20 },
  labelSub: { color: COLORS.textMuted, fontSize: 9, fontWeight: '400', letterSpacing: 0 },
  nameInput: { backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 15 },
  nameInputError: { borderColor: COLORS.breaking },
  errorText: { color: COLORS.breaking, fontSize: 12, marginTop: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 12, fontWeight: '500' },
  noMapMsg: { alignItems: 'center', gap: 8, paddingVertical: 24, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  noMapText: { color: COLORS.textMuted, fontSize: 13 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, padding: 14, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary + '33' },
  previewText: { color: COLORS.textSub, fontSize: 13 },
  previewCount: { color: COLORS.primary, fontWeight: '700' },
  filterTypeRow: { flexDirection: 'row', gap: 8 },
  filterTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  filterTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  filterTypeBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
  filterTypeBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  filterTypeHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 8, lineHeight: 16 },
});

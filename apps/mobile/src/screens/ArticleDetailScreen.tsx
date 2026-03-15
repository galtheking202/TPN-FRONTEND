import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { article } = route.params;

  const langContent = article.languages?.['en'] ?? article.languages?.['english'];
  const body = langContent?.body ?? article.content ?? t('article.no_content');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← {t('article.back')}</Text>
      </TouchableOpacity>

      {article.isUrgent && (
        <Text style={styles.breaking}>{t('article.breaking')}</Text>
      )}
      <Text style={styles.category}>{article.category}</Text>
      <Text style={styles.title}>{article.title ?? t('article.untitled')}</Text>

      <View style={styles.meta}>
        <Text style={styles.source}>{article.source}</Text>
        {article.date && (
          <Text style={styles.date}>
            {new Date(article.date).toLocaleDateString('en-US')}
          </Text>
        )}
      </View>

      <Text style={styles.summary}>{article.summary}</Text>
      <View style={styles.divider} />
      <Text style={styles.body}>{body}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 16 },
  back: { marginBottom: 16 },
  backText: { color: '#3b82f6', fontSize: 14 },
  breaking: { color: '#ef4444', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  category: { color: '#3b82f6', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  title: { color: '#f9fafb', fontSize: 20, fontWeight: '700', marginBottom: 12, lineHeight: 28 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  source: { color: '#6b7280', fontSize: 12 },
  date: { color: '#6b7280', fontSize: 12 },
  summary: { color: '#d1d5db', fontSize: 15, lineHeight: 22, marginBottom: 16, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#1f2937', marginBottom: 16 },
  body: { color: '#e5e7eb', fontSize: 15, lineHeight: 24 },
});

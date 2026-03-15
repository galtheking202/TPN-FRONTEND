import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Article, createNewsService } from '@tpn/shared';
import { RootStackParamList } from '../App';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const newsService = createNewsService(API_URL);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleList'>;

export default function ArticleListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService.fetchArticles().then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('app.title')}</Text>
        <Text style={styles.headerSub}>{t('app.subtitle')}</Text>
      </View>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.isUrgent && styles.cardUrgent]}
            onPress={() => navigation.navigate('ArticleDetail', { article: item })}
          >
            {item.isUrgent && (
              <Text style={styles.breaking}>{t('article.breaking')}</Text>
            )}
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.title}>{item.title ?? t('article.untitled')}</Text>
            <Text style={styles.summary} numberOfLines={2}>
              {item.summary ?? t('article.no_summary')}
            </Text>
            <Text style={styles.source}>{item.source}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  headerTitle: { color: '#3b82f6', fontSize: 22, fontWeight: '700' },
  headerSub: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  list: { padding: 12, gap: 12 },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardUrgent: { borderColor: '#ef4444' },
  breaking: { color: '#ef4444', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  category: { color: '#3b82f6', fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  title: { color: '#f9fafb', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  summary: { color: '#9ca3af', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  source: { color: '#6b7280', fontSize: 11 },
});

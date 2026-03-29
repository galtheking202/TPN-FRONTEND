import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Article } from '@tpn/shared';
import { useAppContext } from '../context/AppContext';

const COLORS = {
  bg: '#0D0D14',
  border: '#1E1E2A',
  primary: '#0057FF',
  breaking: '#FF3333',
  text: '#A8A8C0',
  textBright: '#FFFFFF',
  live: '#FF3333',
};

const TICKER_SPEED = 60; // pixels per second
const ITEM_GAP = 60;     // px gap between items

interface Props {
  articles: Article[];
  onPress: (article: Article) => void;
}

export default function NewsTicker({ articles, onPress }: Props) {
  const { language } = useAppContext();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const paused = useRef(false);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const currentX = useRef(0);

  const tickerArticles = articles.filter(a => a.isUrgent || a.category === 'Politics' || a.category === 'Defence and Security').slice(0, 10);

  useEffect(() => {
    scrollX.addListener(({ value }) => { currentX.current = value; });
    return () => scrollX.removeAllListeners();
  }, [scrollX]);

  useEffect(() => {
    if (!contentWidth || !containerWidth) return;
    const totalWidth = contentWidth;
    const start = () => {
      if (paused.current) return;
      const remaining = totalWidth - currentX.current;
      const duration = (remaining / TICKER_SPEED) * 1000;
      animRef.current = Animated.timing(scrollX, {
        toValue: totalWidth,
        duration,
        useNativeDriver: true,
      });
      animRef.current.start(({ finished }) => {
        if (finished) {
          scrollX.setValue(0);
          start();
        }
      });
    };
    start();
    return () => animRef.current?.stop();
  }, [contentWidth, containerWidth, scrollX]);

  if (tickerArticles.length === 0) return null;

  const getTitle = (a: Article) => {
    const lang = a.languages?.[language] ?? a.languages?.['en'];
    return lang?.title ?? a.title ?? '';
  };

  return (
    <View style={styles.container} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {/* LIVE badge */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Scrolling content */}
      <View style={styles.tickerWrap}>
        <Animated.View
          style={[styles.ticker, { transform: [{ translateX: Animated.multiply(scrollX, -1) }] }]}
          onLayout={e => setContentWidth(e.nativeEvent.layout.width)}
        >
          {[...tickerArticles, ...tickerArticles].map((article, i) => (
            <Pressable
              key={`${article.id}-${i}`}
              style={styles.item}
              onPressIn={() => { paused.current = true; animRef.current?.stop(); }}
              onPressOut={() => { paused.current = false; }}
              onPress={() => onPress(article)}
            >
              {article.isUrgent && <Text style={styles.breakingTag}>BREAKING</Text>}
              <Text style={styles.headline} numberOfLines={1}>{getTitle(article)}</Text>
              <Text style={styles.sep}>◆</Text>
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    height: '100%',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.live,
  },
  liveText: {
    color: COLORS.live,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tickerWrap: { flex: 1, overflow: 'hidden' },
  ticker: { flexDirection: 'row', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: ITEM_GAP,
  },
  breakingTag: {
    color: COLORS.breaking,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: COLORS.breaking,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  headline: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 260,
  },
  sep: { color: COLORS.primary, fontSize: 8, opacity: 0.5 },
});

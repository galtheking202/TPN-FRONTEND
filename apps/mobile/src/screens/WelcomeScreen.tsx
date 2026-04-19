import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from '../App';
import { COLORS } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

interface Slide {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  bullets: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
}

const SLIDES: Slide[] = [
  {
    key: 'news',
    icon: 'globe-outline',
    iconColor: COLORS.primary,
    iconBg: COLORS.primarySoft,
    title: 'The world's news,\ncurated for you',
    subtitle: 'Real-time articles from verified sources — across politics, tech, health and more.',
    bullets: [
      { icon: 'flash-outline', text: 'Breaking stories in real time' },
      { icon: 'shield-checkmark-outline', text: 'Credibility scores on every article' },
      { icon: 'language-outline', text: 'Read in English, Hebrew, French, Russian or Arabic' },
    ],
  },
  {
    key: 'filter',
    icon: 'funnel-outline',
    iconColor: '#8A7AB0',
    iconBg: '#E4DEEC',
    title: 'Your feed,\nyour rules',
    subtitle: 'Build smart filters to see exactly what matters to you — and get notified instantly.',
    bullets: [
      { icon: 'options-outline', text: 'Filter by category, region or keyword' },
      { icon: 'notifications-outline', text: 'Push alerts for breaking topics you care about' },
      { icon: 'bookmark-outline', text: 'Pin articles to read later, anytime' },
    ],
  },
  {
    key: 'intel',
    icon: 'newspaper-outline',
    iconColor: '#5A9A8A',
    iconBg: '#DCEDE8',
    title: 'Journalist\nintelligence tools',
    subtitle: 'Raw ingest data from Telegram, Twitter and open sources — searchable and categorised.',
    bullets: [
      { icon: 'search-outline', text: 'Full-text search across all raw reports' },
      { icon: 'layers-outline', text: 'Grouped by channel with timestamps' },
      { icon: 'trending-up-outline', text: 'Spot emerging stories before they break' },
    ],
  },
];

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { markWelcomeSeen } = useAppContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index ?? 0);
  });
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    markWelcomeSeen();
    navigation.replace('ArticleList');
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Skip */}
      <Pressable
        style={[styles.skip, { top: insets.top + 12 }]}
        onPress={handleGetStarted}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfig.current}
        renderItem={({ item }) => <SlideItem slide={item} insetTop={insets.top} />}
      />

      {/* Bottom controls */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <Pressable style={styles.btn} onPress={handleNext}>
          <Text style={styles.btnText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Ionicons
            name={isLast ? 'arrow-forward-circle' : 'chevron-forward'}
            size={isLast ? 20 : 18}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );
}

function SlideItem({ slide, insetTop }: { slide: Slide; insetTop: number }) {
  return (
    <View style={[styles.slide, { width: SCREEN_W, paddingTop: insetTop + 60 }]}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: slide.iconBg }]}>
        <Ionicons name={slide.icon} size={40} color={slide.iconColor} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{slide.title}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>{slide.subtitle}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bullets */}
      <View style={styles.bullets}>
        {slide.bullets.map((b, i) => (
          <View key={i} style={styles.bullet}>
            <View style={[styles.bulletIcon, { backgroundColor: slide.iconBg }]}>
              <Ionicons name={b.icon} size={15} color={slide.iconColor} />
            </View>
            <Text style={styles.bulletText}>{b.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  skip: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },

  slide: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
    marginBottom: 28,
  },
  bullets: {
    width: '100%',
    gap: 14,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bulletIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    color: COLORS.textSub,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: COLORS.border,
  },
  btn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

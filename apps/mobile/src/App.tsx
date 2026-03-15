import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@tpn/shared/i18n';
import { Article, SavedFilter } from '@tpn/shared';
import { AppContextProvider, useAppContext } from './context/AppContext';
import ArticleListScreen from './screens/ArticleListScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import FilterBuilderScreen from './screens/FilterBuilderScreen';
import PinnedArticlesScreen from './screens/PinnedArticlesScreen';

export type RootStackParamList = {
  ArticleList: undefined;
  ArticleDetail: { article: Article };
  Settings: undefined;
  FilterBuilder: { filter?: SavedFilter; articles: Article[] };
  PinnedArticles: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { isRTL } = useAppContext();

  return (
    <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="ArticleList"
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
          >
            <Stack.Screen name="ArticleList" component={ArticleListScreen} />
            <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="FilterBuilder" component={FilterBuilderScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="PinnedArticles" component={PinnedArticlesScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
}

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@tpn/shared/i18n';
import { Article } from '@tpn/shared';
import ArticleListScreen from './screens/ArticleListScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';

export type RootStackParamList = {
  ArticleList: undefined;
  ArticleDetail: { article: Article };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="ArticleList"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="ArticleList" component={ArticleListScreen} />
          <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

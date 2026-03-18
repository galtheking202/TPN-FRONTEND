import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import App from './src/App';

// Keep the splash visible while we bootstrap RTL
SplashScreen.preventAutoHideAsync().catch(() => {});

const RTL_LANGS = ['he', 'ar'];

AsyncStorage.getItem('tpn_language')
  .then(lang => {
    if (lang) I18nManager.forceRTL(RTL_LANGS.includes(lang));
  })
  .catch(() => {})
  .finally(() => {
    registerRootComponent(App);
  });

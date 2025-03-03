import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { BookingProvider } from '../src/contexts/BookingContext';
import LottieView from 'lottie-react-native';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../src/constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ModeProvider } from '../src/contexts/ModeContext';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    surface: COLORS.surface,
    background: COLORS.background,
    text: COLORS.text,
  },
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give enough time for the animation to complete
    setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds for the full animation
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LottieView
          source={require('../assets/animations/splash.json')}
          autoPlay
          loop={false}
          onAnimationFinish={() => setIsLoading(false)}
          style={styles.animation}
          speed={1.2}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ModeProvider>
            <AuthProvider>
              <BookingProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </BookingProvider>
            </AuthProvider>
          </ModeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: width * 0.8, // 80% of screen width
    height: width * 0.8,
  },
}); 
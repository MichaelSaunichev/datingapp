import React from 'react';

import { View, Text, Button, TouchableOpacity, StyleSheet, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/components/useColorScheme';

interface AuthScreenProps {
  onAuthenticate: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticate }) => (
  <View style={styles.container}>
    <Text style={styles.heartIcon}>❤️</Text>
    <Text style={styles.appName}>FreakFinder</Text>
    <TouchableOpacity style={styles.button} onPress={onAuthenticate}>
      <Text style={styles.buttonText}>Sign up with phone number</Text>
    </TouchableOpacity>
    {/* Add additional legal text and links as necessary */}
  </View>
);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || error) {
    return <View><Text>Loading or error...</Text></View>;
  }

  return isAuthenticated ? (
    <RootLayoutNav />
  ) : (
    <AuthScreen onAuthenticate={() => setIsAuthenticated(true)} />
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFC107', // This is a yellow color, similar to the bumble theme
  },
  heartIcon: {
    fontSize: 100, // Size of the heart icon
    marginBottom: 20,
  },
  logo: {
    width: 100, // Adjust as necessary
    height: 100, // Adjust as necessary
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 40, // Adjust the space between logo and button as necessary
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
    marginVertical: 10,
    elevation: 2, // This adds a slight shadow on Android
    shadowColor: 'rgba(0,0,0, .25)', // iOS shadow
    shadowOffset: { height: 3, width: 3 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

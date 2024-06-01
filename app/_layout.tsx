import { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/components/useColorScheme';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import { ProfileProvider } from './ProfileContext'
import Login from './Login';
import Welcome from './Welcome';
import Signup from './Signup';
import EnterName from './EnterName'
import EnterBio from './EnterBio'
import EnterDOB from './EnterDOB'
import SelectGender from './SelectGender'
import UploadPictures from './UploadPictures'
import VerifyEmailPrompt from './VerifyEmailPrompt';
import { Stack } from 'expo-router';
import { User } from '@firebase/auth'
import { FIREBASE_AUTH } from 'FirebaseConfig'
import 'FirebaseConfig'
import { onAuthStateChanged } from '@firebase/auth';

const StackGuy = createNativeStackNavigator();

import 'react-native-reanimated'

function InnerLayout({ user }: { user: User | null }) {
  const colorScheme = useColorScheme();
  

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} initialParams={{ userEmail: user?.email }}/>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayoutNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      setLoading(true);
      if (user) {
        await user.reload();
        setUser(user);
        setEmailVerified(user.emailVerified);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  
    const intervalId = setInterval(async () => {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        await currentUser.reload();
        setEmailVerified(currentUser.emailVerified);
      }
    }, 2000);
  
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <ProfileProvider>
      <NavigationContainer independent={true} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StackGuy.Navigator>
          {user ? (
            emailVerified ? (
              // User is signed in and email is verified
              <StackGuy.Screen name="Tabs" options={{ headerShown: false }}>
                {() => <InnerLayout user={user} />}
              </StackGuy.Screen>
            ) : (
              // User is signed in but email is not verified
              <StackGuy.Screen name="VerifyEmailPrompt" component={VerifyEmailPrompt} options={{ headerShown: false }} />
            )
          ) : (
            <>
              <StackGuy.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
              <StackGuy.Screen name="Login" component={Login} options={{ headerShown: false }} />
              <StackGuy.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
              <StackGuy.Screen name="EnterName" component={EnterName} options={{ headerShown: false }} />
              <StackGuy.Screen name="EnterBio" component={EnterBio} options={{ headerShown: false }} />
              <StackGuy.Screen name="EnterDOB" component={EnterDOB} options={{ headerShown: false }} />
              <StackGuy.Screen name="SelectGender" component={SelectGender} options={{ headerShown: false }} />
              <StackGuy.Screen name="UploadPictures" component={UploadPictures} options={{ headerShown: false }} />
            </>
          )}
        </StackGuy.Navigator>
      </NavigationContainer>
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E4D2B',
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
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
import CreateProfile from './CreateProfile';
import UploadPictures from './UploadPictures'
import { Stack } from 'expo-router';
import { Auth, User } from '@firebase/auth'
import { FIREBASE_AUTH } from 'FirebaseConfig'
import 'FirebaseConfig'
import { onAuthStateChanged } from '@firebase/auth';

const StackGuy = createNativeStackNavigator();

import { Slot } from 'expo-router';
import 'react-native-reanimated'
/*
export default function HomeLayout() {
  return <Slot />;
}*/


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
  const colorScheme = useColorScheme();

  useEffect(() => {
    onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
    });
  }, []);

  return (
    <ProfileProvider>
    <NavigationContainer independent={true} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StackGuy.Navigator>
        {user ? (
          // User is signed in
          <StackGuy.Screen name="Tabs" options={{ headerShown: false }}>
            {() => <InnerLayout user={user} />}
          </StackGuy.Screen>
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

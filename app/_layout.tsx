import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/components/useColorScheme'; // Update the path as necessary
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import Login from './Login';
import Welcome from './Welcome';
import Signup from './Signup';
import { Stack } from 'expo-router';
import { Auth, User } from 'firebase/auth'
import { FIREBASE_AUTH } from 'FirebaseConfig'
import 'FirebaseConfig'
import { onAuthStateChanged } from 'firebase/auth';

const StackGuy = createNativeStackNavigator();

function InnerLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

<<<<<<< HEAD
export default function RootLayoutNav() {
  const [user, setUser] = useState<User | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    onAuthStateChanged(FIREBASE_AUTH, (user) => {
      console.log('user', user);
      setUser(user);
    });
  }, []);

  return (
    <NavigationContainer independent={true} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StackGuy.Navigator>
        {user ? (
          // User is signed in
          <StackGuy.Screen name="Tabs" component={InnerLayout} options={{ headerShown: false }} />
        ) : (
          <>
          <StackGuy.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
          <StackGuy.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <StackGuy.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
          </>
        )}
      </StackGuy.Navigator>
    </NavigationContainer>
  );
}
=======
const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000', // Change as needed
    marginBottom: 20,
  },
  input: {
    fontSize: 18,
    borderBottomWidth: 1, // Styling for a bottom border
    borderColor: '#000', // Border color
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 25, // Space between input field and button
    width: '80%', // Set the width as per your design needs
    // Add additional styling that suits your app's theme
  },
  container: {
    // Make sure the container can be moved off the screen
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFC107',
  },
  icon: {
    fontSize: 100, // Size of the eggplant icon
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
>>>>>>> 2b42a768df6aa4358bd8f97a7adf18718c0e6865

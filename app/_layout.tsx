import React from 'react';

import { Modal, Dimensions, Animated, View, Text, TextInput, Button, TouchableOpacity, StyleSheet, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';

import { useColorScheme } from '@/components/useColorScheme';

interface AuthScreenProps {
  onAuthenticate: () => void;
}

interface PhoneScreenProps {
  onSigningUp: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticate }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>🍆</Text>
    <Text style={styles.appName}>FreakFinder</Text>
    <TouchableOpacity style={styles.button} onPress={onAuthenticate}>
      <Text style={styles.buttonText}>Sign up with phone number</Text>
    </TouchableOpacity>
    {/* Add additional legal text and links as necessary */}
  </View>
);

const { width } = Dimensions.get('window'); // Get the full width of the screen

const PhoneNumberInputScreen: React.FC<PhoneScreenProps> = ({ onSigningUp }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  // Start the component off the right side of the screen
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    // Slide the view in from the right
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    // Optionally, return a cleanup function to slide out to the right on unmount
  }, [slideAnim]);

  const handlePhoneNumberSubmit = () => {
    // Assuming you have some API to request the code
    // After the phone number is submitted and the API call is made:
    setModalVisible(true); // Show the modal for verification code input
  };

  const handleVerifyCode = () => {
    // Here you would verify the entered code
    // If the verification is successful:
    setModalVisible(false); // Hide the modal
    onSigningUp(); // Continue with signing up
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your number?</Text>
      <TextInput
        style={styles.input}
        onChangeText={setPhoneNumber}
        value={phoneNumber}
        keyboardType="phone-pad"
        placeholder="Phone number"
      />
      <TouchableOpacity style={styles.button} onPress={handlePhoneNumberSubmit}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Enter your verification code:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setVerificationCode}
              value={verificationCode}
              keyboardType="number-pad"
              placeholder="Verification code"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyCode}
            >
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const NameInputScreen: React.FC<{ onNameSubmitted: (name: string) => void }> = ({ onNameSubmitted }) => {
  const [name, setName] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your name?</Text>
      <TextInput
        style={styles.input}
        onChangeText={setName}
        value={name}
        placeholder="Your name"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => onNameSubmitted(name)}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

interface DOBInputScreenProps {
  onDOBSubmitted: (dob: string) => void;
}

const DOBInputScreen: React.FC<DOBInputScreenProps> = ({ onDOBSubmitted }) => {
  const [dob, setDob] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your date of birth?</Text>
      <TextInput
        style={styles.input}
        onChangeText={setDob}
        value={dob}
        placeholder="YYYY-MM-DD"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => onDOBSubmitted(dob)}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isDOBRequired, setIsDOBRequired] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || error) {
    return <View><Text>Loading or error...</Text></View>;
  }

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
    setIsSigningUp(false);
  };

  const handleSignUp = () => {
    setIsSigningUp(true);
  };

  const handleDOBSubmitted = (dob: string) => {
    console.log("User's DOB:", dob);
  
    // Regular expression to check if the DOB format is YYYY-MM-DD
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dob);
  
    if (!isValidFormat) {
      alert("Please enter your date of birth in YYYY-MM-DD format.");
      return;
    }
  
    // Check if the user is at least 18 years old
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear(); // Changed 'const' to 'let'
    const m = today.getMonth() - birthDate.getMonth();
  
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  
    if (age < 18) {
      alert("You must be at least 18 years old.");
      return;
    }
  
    // If all checks pass, proceed with saving the DOB and authenticating
    console.log("DOB is valid and user is over 18.");
    // Proceed with the necessary actions, like saving the DOB into the database
  
    // Proceed with authentication
    handleAuthenticate();
  };
  

  const handleNameSubmitted = (name: string) => {
    console.log("User's name:", name);
    // After saving the name, if DOB is the next required info:
    setIsDOBRequired(true);
  };

  let content;
  if (isAuthenticated) {
    content = <RootLayoutNav />;
  } else if (isSigningUp) {
    if (isNewUser) {
      if (isDOBRequired) {
        content = <DOBInputScreen onDOBSubmitted={handleDOBSubmitted} />;
      } else {
        content = <NameInputScreen onNameSubmitted={handleNameSubmitted} />;
      }
    } else {
      content = <PhoneNumberInputScreen onSigningUp={() => setIsNewUser(true)} />;
    }
  } else {
    content = <AuthScreen onAuthenticate={handleSignUp} />;
  }
  return content;
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
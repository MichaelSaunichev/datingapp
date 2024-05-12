import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Login from './Login';

const Welcome = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f6f6" />
      <Text style={styles.icon}>🐎</Text>
      <Text style={styles.appName}>PolyDates</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EnterName')}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E4D2B',
  },
  icon: {
    fontSize: 100,
    marginBottom: 20,
  },
  appName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '80%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
    marginVertical: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0, .25)',
    shadowOffset: { height: 3, width: 3 },
    shadowOpacity: 1,
    shadowRadius: 5,
    alignItems: 'center', // Ensure text is centered
},
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

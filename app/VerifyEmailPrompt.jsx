import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { FIREBASE_AUTH } from 'FirebaseConfig';
import { sendEmailVerification } from '@firebase/auth';

const VerifyEmailPrompt = () => {
  const user = FIREBASE_AUTH.currentUser;

  const resendVerificationEmail = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        alert('Verification email sent. Please check your inbox.');
      } catch (error) {
        if (error.code === 'auth/too-many-requests') {
          alert('You have sent too many requests. Please try again later.');
        } else {
          alert('Failed to send verification email: ' + error.message);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Please verify your email to continue.</Text>
      <Button title="Resend Verification Email" onPress={resendVerificationEmail} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    margin: 20,
  },
});

export default VerifyEmailPrompt;

import { Button, View, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from 'FirebaseConfig'
import { signInWithEmailAndPassword } from '@firebase/auth';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { getFirestore, doc, setDoc } from '@firebase/firestore';
import { useRoute } from '@react-navigation/native';


const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    const route = useRoute();
    const { profile } = route.params;

    const auth = FIREBASE_AUTH;
    const navigation = useNavigation();


    const signUp = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            const profileWithId = { ...profile, id: email };
            
            try {
                const response = await fetch('http://192.168.1.17:3000/api/user/create', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileWithId),
                });
                if (!response.ok) {
                    throw new Error('Failed to create user');
                }
                const newUser = await response.json();
                console.log("donee");
                return newUser;
                } catch (error) {
                    console.error(error);
                return null;
                }
        } catch (error) {
            console.error(error);
            alert('Sign up failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
            <KeyboardAvoidingView behavior='padding'>
                <TextInput value={email} 
                    style={styles.input} 
                    placeholder="Email" 
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    onChangeText={setEmail} />
                <TextInput secureTextEntry={true} value={password} 
                    style={styles.input} 
                    placeholder="Password"
                    placeholderTextColor="#888"
                    autoCapitalize="none" 
                    onChangeText={setPassword} />
                <TextInput secureTextEntry={true} value={confirmPassword} style={styles.input}
                    placeholder="Confirm Password" 
                    placeholderTextColor="#888"
                    autoCapitalize="none" 
                    onChangeText={setConfirmPassword} />
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={signUp}>
                            <Text style={styles.buttonText}>Create Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                            <Text style={styles.buttonText}>Back</Text>
                        </TouchableOpacity>
                    </>
                )}
            </KeyboardAvoidingView>
        </View>
        </TouchableWithoutFeedback>
    
    );
}

export default Signup

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
      },
      input: {
        height: 50,
        backgroundColor: 'white',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 25,
        marginBottom: 15,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#333',
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
    }
});
import { View, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from 'FirebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from '@firebase/auth';
import { useProfile } from './ProfileContext';
import { API_URL } from '@env';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const { profile } = useProfile();
    const auth = FIREBASE_AUTH;
    const navigation = useNavigation();

    const signUp = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        if (!agreeToTerms) {
            alert('You must agree to the Terms of Service and Privacy Policy.');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            const profileWithId = { ...profile, id: email };
            try {
                const response = await fetch(`${API_URL}/api/user/create`, {
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
                    <TextInput
                        value={email}
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        autoCapitalize="none"
                        onChangeText={setEmail}
                    />
                    <TextInput
                        secureTextEntry={true}
                        value={password}
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#888"
                        autoCapitalize="none"
                        onChangeText={setPassword}
                    />
                    <TextInput
                        secureTextEntry={true}
                        value={confirmPassword}
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#888"
                        autoCapitalize="none"
                        onChangeText={setConfirmPassword}
                    />
                    <View style={styles.termsContainer}>
                        <TouchableOpacity onPress={() => setAgreeToTerms(!agreeToTerms)}>
                            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                                {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.termsText}>
                            I agree to the{" "}
                            <Text style={styles.link} onPress={() => navigation.navigate('WebView', { uri: 'https://michaelsaunichev.github.io/mustang-match-terms-of-service/' })}>
                                Terms of Service
                            </Text>
                            {"\n"}and{" "}
                            <Text style={styles.link} onPress={() => navigation.navigate('WebView', { uri: 'https://michaelsaunichev.github.io/mustang-match-privacy-policy/' })}>
                                Privacy Policy
                            </Text>.
                        </Text>
                    </View>
                    {loading ? (
                        <ActivityIndicator size="large" color="white" />
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
};

export default Signup;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#1E4D2B',
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',  // Center horizontally
        marginBottom: 15,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#888',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    checkboxChecked: {
        backgroundColor: '#1E4D2B',
    },
    checkmark: {
        color: 'white',
        fontWeight: 'bold',
    },
    termsText: {
        marginLeft: 10,
        color: '#888',
        flexShrink: 1,
    },
    link: {
        color: '#FFD700',  // Change to a brighter color, like gold
        textDecorationLine: 'underline',
        fontWeight: 'bold',  // Make the link text bold
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
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
    },
});

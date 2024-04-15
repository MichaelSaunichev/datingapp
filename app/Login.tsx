import React, { useState } from 'react';
import { Modal, Button, View, Text, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { FIREBASE_AUTH } from '../node_modules/FirebaseConfig';
import { sendPasswordResetEmail } from '@firebase/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;
    const navigation = useNavigation();
    const [resetEmail, setResetEmail] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const signIn = async () => {
        setLoading(true);
        try {
            const response = await signInWithEmailAndPassword(auth, email, password);
            console.log(response);
        } catch (error) {
            console.log(error);
            alert('Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async () => {
        if (!resetEmail) {
            alert('Please enter your email address.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            alert('A link to reset your password has been sent to your email.');
            setModalVisible(false);
            setResetEmail('');
        } catch (error) {
            console.log(error);
            alert('Failed to send password reset email. Please check the email provided and try again.');
        }
    };

    return (
        <View style={styles.container}>
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
                        <Text style={styles.modalText}>Enter your email address to reset your password:</Text>
                        <TextInput
                            autoFocus={true}
                            style={styles.input}
                            onChangeText={setResetEmail}
                            value={resetEmail}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.button} onPress={resetPassword}>
                            <Text style={styles.buttonText}>Send Reset Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <KeyboardAvoidingView behavior='padding'>
                <TextInput 
                    value={email} 
                    style={styles.input} 
                    placeholder="Email" 
                    autoCapitalize="none"
                    onChangeText={setEmail}
                />
                <TextInput 
                    secureTextEntry={true} 
                    value={password} 
                    style={styles.input} 
                    placeholder="Password" 
                    autoCapitalize="none"
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Text style={styles.resetPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={signIn}>
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                            <Text style={styles.buttonText}>Back</Text>
                        </TouchableOpacity>
                    </>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

export default Login;

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        flex: 1,
        justifyContent: 'center'
    },
    input: {
        marginVertical: 4,
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff',
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
        alignItems: 'center'
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    resetPasswordText: {
        color: 'blue',
        textAlign: 'center',
        marginVertical: 20,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        alignSelf: 'center', 
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    },
    cancelButtonText: {
        color: 'red', 
        fontWeight: 'bold',
        textAlign: 'center'
    },
});

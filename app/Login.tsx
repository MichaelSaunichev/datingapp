import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback, Keyboard, TextInput, ActivityIndicator, KeyboardAvoidingView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from '@firebase/auth';
import { FIREBASE_AUTH } from '../node_modules/FirebaseConfig';

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
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
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
            alert('Failed to send password reset email. Please check the email provided and try again.');
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.background}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                    <View style={styles.inner}>
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
                        <TouchableOpacity style={styles.resetPasswordButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.resetPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                        {loading ? (
                            <ActivityIndicator size="large" color="white" />
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
                    </View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default Login;

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#1E4D2B',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        padding: 20,
    },
    inner: {
        paddingVertical: 205,
        flex: 1,
        justifyContent: 'flex-start',
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
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        color: '#000',
    },
    resetPasswordButton: {
        alignSelf: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    resetPasswordText: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        marginTop: -200,
        margin: 10,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
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
        color: 'black', 
        textAlign: 'center'
    },
});

import {React, useState, useEffect} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from './ProfileContext';

const EnterBio = () => {
    const navigation = useNavigation();
    const { profile, setProfile } = useProfile();

    const [isButtonEnabled, setIsButtonEnabled] = useState(profile.bio.trim().length > 0); // State to track button enablement

    const handleBioChange = (text) => {
        const sanitizedText = text.replace(/[\r\n]/g, '');
        setProfile(prevProfile => ({ ...prevProfile, bio: sanitizedText.slice(0, 100) }));
        setIsButtonEnabled(sanitizedText.trim().length > 0);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <KeyboardAvoidingView behavior='padding' style={styles.keyboardView}>
                    <Text style={styles.sectionTitle}>Enter Your Bio (100 characters max)</Text>
                    <TextInput
                        value={profile.bio}
                        onChangeText={handleBioChange}
                        style={styles.input}
                        multiline={true}
                        maxLength={100}
                        placeholder="Write something about yourself..."
                        placeholderTextColor="#888"
                        onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === 'Enter') {
                                Keyboard.dismiss();
                            }
                        }}
                    />
                    <Text style={styles.charCount}>{profile.bio.length}/100</Text>
                    <TouchableOpacity
                        style={[styles.button, !isButtonEnabled && { opacity: 0.5 }]}
                        onPress={() => {
                            if (profile.bio.trim().length > 0) {
                                navigation.navigate('UploadPictures');
                            } else {
                                setIsButtonEnabled(false);
                            }
                        }}
                        disabled={!isButtonEnabled} // Button is disabled if u didn't put bio
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default EnterBio;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    keyboardView: {
        width: '100%',
        justifyContent: 'center',
    },
    sectionTitle: {
        alignSelf: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    input: {
        height: 100,
        backgroundColor: 'white',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#333',
    },
    charCount: {
        alignSelf: 'flex-end',
        marginBottom: 10,
        color: '#666',
        fontSize: 14,
    },
    button: {
        backgroundColor: '#007aff',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    }
});

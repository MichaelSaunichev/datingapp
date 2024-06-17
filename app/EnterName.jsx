import { useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from './ProfileContext'; // Ensure you import useProfile from its correct path

const EnterName = () => {
    const { profile, setProfile } = useProfile();
    const navigation = useNavigation();

    const [isButtonEnabled, setIsButtonEnabled] = useState(profile.name.trim().length > 0); // State to track button enablement

    const handleNameChange = (name) => {
        const trimmedName = name.trim().substring(0, 10); // Trim and limit to 10 characters
        setIsButtonEnabled(trimmedName.length > 0); // Enable/disable button based on input value
        setProfile(prevProfile => ({
            ...prevProfile,
            name: trimmedName // Update the name property of the profile
        }));
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <KeyboardAvoidingView behavior='padding'>
                    <Text style={styles.sectionTitle}>What's your name?</Text>
                    <TextInput
                        value={profile.name}
                        style={styles.input}
                        placeholder="Name"
                        placeholderTextColor="#888"
                        onChangeText={handleNameChange}
                        maxLength={10}
                    />

                    <TouchableOpacity
                        style={[styles.button, !isButtonEnabled && { opacity: 0.5 }]}
                        onPress={() => {
                            if (profile.name.trim().length > 0) {
                                navigation.navigate('EnterDOB');
                            } else {
                                setIsButtonEnabled(false);
                            }
                        }}
                        disabled={!isButtonEnabled}
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button]}
                        onPress={() => {
                            navigation.navigate('Welcome');
                        }}
                    >
                        <Text style={styles.buttonText}>Back</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
};
  
export default EnterName;

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
    button: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
    },
    buttonText: {
        color: 'black',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        paddingVertical: 10,
        marginBottom: 10,
    }
});

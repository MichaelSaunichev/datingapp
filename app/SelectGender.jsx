import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from './ProfileContext'; 

const SelectGender = () => {
    const navigation = useNavigation();
    const { profile, setProfile } = useProfile(); 

    const setGender = (gender) => {
        setProfile(prevProfile => ({ ...prevProfile, gender })); 
    };

    const setPreference = (dating_preferences) => {
        setProfile(prevProfile => ({ ...prevProfile, dating_preferences })); // Update dating preferences in the global profile state
    };

    const getButtonStyle = (selectedOption, option) => {
        return selectedOption === option ? styles.selectedButton : styles.button;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Select Your Gender</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={getButtonStyle(profile.gender, 'Male')} 
                    onPress={() => setGender('Male')}>
                    <Text style={styles.buttonText}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={getButtonStyle(profile.gender, 'Female')} 
                    onPress={() => setGender('Female')}>
                    <Text style={styles.buttonText}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={getButtonStyle(profile.gender, 'Non-binary')} 
                    onPress={() => setGender('Non-binary')}>
                    <Text style={styles.buttonText}>Non-binary</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your Dating Preference</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={getButtonStyle(profile.dating_preferences, 'Men')}
                    onPress={() => setPreference('Men')}>
                    <Text style={styles.buttonText}>Men</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={getButtonStyle(profile.dating_preferences, 'Women')}
                    onPress={() => setPreference('Women')}>
                    <Text style={styles.buttonText}>Women</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={getButtonStyle(profile.dating_preferences, 'Everyone')}
                    onPress={() => setPreference('Everyone')}>
                    <Text style={styles.buttonText}>Everyone</Text>
                </TouchableOpacity>
            </View>

            {/* Navigation Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('EnterBio')}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SelectGender;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    button: {
        backgroundColor: '#007aff',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        marginHorizontal: 5,
    },
    selectedButton: {
        backgroundColor: '#ff4081',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        marginHorizontal: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
    }
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SelectGender = () => {
    const navigation = useNavigation();
    const [profile, setProfile] = useState({
      gender: '',
      datingPreferences: ''
    });

    const setGender = (gender) => {
        setProfile(prevState => ({ ...prevState, gender }));
    };

    const setPreference = (datingPreferences) => {
        setProfile(prevState => ({ ...prevState, datingPreferences }));
    };

    const getButtonStyle = (selectedOption, option) => {
        return selectedOption === option ? styles.selectedButton : styles.button;
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                    style={getButtonStyle(profile.datingPreferences, 'Men')}
                    onPress={() => setPreference('Men')}>
                    <Text style={styles.buttonText}>Men</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={getButtonStyle(profile.datingPreferences, 'Women')}
                    onPress={() => setPreference('Women')}>
                    <Text style={styles.buttonText}>Women</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={getButtonStyle(profile.datingPreferences, 'Everyone')}
                    onPress={() => setPreference('Everyone')}>
                    <Text style={styles.buttonText}>Everyone</Text>
                </TouchableOpacity>
            </View>

            {/* Navigation Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('EnterBio', { profile })}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
        </View>
        </TouchableWithoutFeedback>
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
        flex: 1,
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
        flex: 1,
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

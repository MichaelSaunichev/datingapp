import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfile } from './ProfileContext';

const EnterDOB = () => {
    const { profile, setProfile } = useProfile();
    const navigation = useNavigation();
    const [showDatePicker, setShowDatePicker] = useState(false);
    let calculatedAge = 0;

    const onChangeDate = (event, selectedDate) => {
        if (selectedDate) {
            setShowDatePicker(Platform.OS === 'ios');
            setProfile(prev => ({ ...prev, dob: selectedDate }));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Set Your Date of Birth</Text>
            <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.buttonText}>Select Date</Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={profile.dob}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                />
            )}
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    if (profile.dob) {
                        const today = new Date();
                        const dob = new Date(profile.dob);
                        calculatedAge = today.getFullYear() - dob.getFullYear();
                        const monthDiff = today.getMonth() - dob.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                            calculatedAge--;
                        }
                    }
                    if (calculatedAge < 18) {
                        alert("You must be at least 18 years old to use this app.");
                        return;
                    } else if (calculatedAge > 150) {
                        alert("Please enter a valid date of birth.");
                        return;
                    } else{ 
                        navigation.navigate('SelectGender')}}}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
        </View>
    );
};

export default EnterDOB;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
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
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

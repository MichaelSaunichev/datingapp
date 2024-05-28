import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfile } from './ProfileContext';

const EnterDOB = () => {
    const { profile, setProfile } = useProfile();
    const navigation = useNavigation();
    let calculatedAge = 0;

    const calculateAge = (dob) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const onChangeDate = (event, selectedDate) => {
        if (selectedDate) {
            setProfile(prev => ({ ...prev, dob: selectedDate }));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>What's your birthday?</Text>
            <View style={styles.datePickerContainer}>
                <DateTimePicker
                    value={profile.dob || new Date()}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                />
            </View>
            <TouchableOpacity
                style={[styles.button, { opacity: profile.dob && calculateAge(profile.dob) > 18 && calculateAge(profile.dob) < 100 ? 1 : 0.5 }]}
                onPress={() => {
                    if (profile.dob) {
                        calculatedAge = calculateAge(profile.dob);
                    }
                    if (calculatedAge < 18) {
                        return;
                    } else if (calculatedAge > 100) {
                        return;
                    } else{ 
                        navigation.navigate('SelectGender')}}}
                disabled={!profile.dob || calculateAge(profile.dob) <= 18 || calculateAge(profile.dob) >= 100}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity
                    style={[styles.button]}
                    onPress={() => {
                        navigation.navigate('EnterName');
                    }}
                >
                    <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
        </View>
    );
};

export default EnterDOB;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#1E4D2B',
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
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
    datePickerContainer: {
        alignItems: 'center',
    },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const EnterDOB = () => {
    const navigation = useNavigation();
    const [dob, setDob] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios'); // keep the picker open on iOS after selection
        const currentDate = selectedDate || dob;
        setDob(currentDate);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Set Your Date of Birth</Text>
            <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.buttonText}>Select Date</Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={dob}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                />
            )}
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    navigation.navigate('SelectGender', { dob: dob.toISOString() });
                }}
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
        marginBottom: 20,
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

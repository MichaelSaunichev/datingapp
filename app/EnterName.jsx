import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const EnterName = () => {
    const navigation = useNavigation();
    const [name, setName] = useState('');

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <KeyboardAvoidingView behavior='padding'>
                    <Text style={styles.sectionTitle}>Enter your name</Text>
                    <TextInput
                        value={name}
                        style={styles.input}
                        placeholder="Name"
                        placeholderTextColor="#888"
                        onChangeText={setName}
                    />
                    {/* Navigation Button to go to the next screen */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('EnterDOB', { name })}
                    >
                        <Text style={styles.buttonText}>Next</Text>
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
        backgroundColor: '#f0f0f0',
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        paddingVertical: 10,
        marginBottom: 10,
    }
});

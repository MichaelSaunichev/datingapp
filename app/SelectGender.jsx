import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

    const isNextEnabled = profile.gender && profile.dating_preferences;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Select your gender...</Text>
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

            <Text style={styles.sectionTitle}>...and your dating preference</Text>
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
                style={[styles.button, !isNextEnabled && styles.disabledButton]}
                onPress={() => isNextEnabled && navigation.navigate('EnterBio')}
                disabled={!isNextEnabled}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button]}
                onPress={() => {
                    navigation.navigate('EnterDOB');
                 }}
            >
                <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SelectGender;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: '#1E4D2B',
        padding: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
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
        marginHorizontal: 5,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    selectedButton: {
        backgroundColor: 'gray',
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
        color: 'black',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginVertical: 10,
    }
});

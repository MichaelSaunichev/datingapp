import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@firebase/storage';

const CreateProfile = () => {
    const navigation = useNavigation();
    const [profile, setProfile] = useState({
      name: '',
      dob: new Date(),
      gender: '',
      preference: '',
      pictures: [],
      bio: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [imageUris, setImageUris] = useState([]);
  
    const setPreference = (preference) => setProfile(prevState => ({ ...prevState, preference }));
    // Function to get the style for the gender button based on the current selection
  const getButtonStyle = (gender) => {
    return profile.gender === gender ? styles.selectedButton : styles.button;
  };
  const getPreferenceButtonStyle = (preference) => {
    return profile.preference === preference ? styles.selectedButton : styles.button;
};

  
const uploadPicture = async () => {
    let result;
    try {
      result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
    } catch (error) {
      console.error("Error selecting image:", error);
      return;
    }
  
    if (!result.canceled) {
      try {
        const uri = result.assets[0].uri;
        console.log("Image URI:", uri);
        // Fetch the image blob
        const response = await fetch(uri);
        const blob = await response.blob();
        // Get a reference to the Firebase storage location
        const storage = getStorage();
        const storageRef = ref(storage, `pictures/${Date.now()}`);
        // Upload the image blob to Firebase Storage
        await uploadBytes(storageRef, blob);
        // Get the download URL of the uploaded image
        const imageUrl = await getDownloadURL(storageRef);
        // Update profile state with the image URL
        setImageUris([...imageUris, imageUrl]); // Add new image URL to array
        setProfile(prevProfile => ({
          ...prevProfile,
          pictures: [...prevProfile.pictures, imageUrl]
        }));
  
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image: " + error.message);
      }
    }
  };
  
  
    const onChangeDate = (event, selectedDate) => {
      setShowDatePicker(Platform.OS === 'ios');
      const currentDate = selectedDate || profile.dob;
      setProfile(prevProfile => ({ ...prevProfile, dob: currentDate }));
    };

    const setGender = (gender) => {
        setProfile(prevState => ({ ...prevState, gender }));
      };
    
  
    return (
     <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <KeyboardAvoidingView behavior='padding'>
        <TextInput
            value={profile.name}
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#888"
            onChangeText={(text) => setProfile({ ...profile, name: text })}
        />
          {/* Date of Birth Picker */}
          <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.buttonText}>Set date of birth
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={profile.dob}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
          {/* Gender Selection Buttons */}
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={getButtonStyle('Male')} 
            onPress={() => setGender('Male')}>
            <Text style={styles.buttonText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={getButtonStyle('Female')} 
            onPress={() => setGender('Female')}>
            <Text style={styles.buttonText}>Female</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={getButtonStyle('Non-binary')} 
            onPress={() => setGender('Non-binary')}>
            <Text style={styles.buttonText}>Non-binary</Text>
          </TouchableOpacity>
        </View>
          {/* Bio TextInput */}
          <TextInput
            value={profile.bio}
            style={styles.input}
            placeholder="Your Bio"
            placeholderTextColor="#888"
            multiline={true}
            numberOfLines={4}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
          />
          {/* Preference Buttons */}
          <Text style={styles.sectionTitle}>Dating Preference</Text>
          <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={getPreferenceButtonStyle('Men')}
                onPress={() => setPreference('Men')}>
                <Text style={styles.buttonText}>Men</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={getPreferenceButtonStyle('Women')}
                onPress={() => setPreference('Women')}>
                <Text style={styles.buttonText}>Women</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={getPreferenceButtonStyle('Non-binary')}
                onPress={() => setPreference('Non-binary')}>
                <Text style={styles.buttonText}>Non-binary</Text>
              </TouchableOpacity>
            </View>
          {/* Image Display */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {imageUris.map((uri, index) => (
        <Image
            key={index}
            source={{ uri }}
            style={styles.uploadedImage}
            resizeMode="contain"
        />
        ))}
        </View>
          {/* Image Upload Button */}
          <TouchableOpacity style={styles.button} onPress={uploadPicture}>
            <Text style={styles.buttonText}>Upload Picture</Text>
          </TouchableOpacity>
          {/* Navigation Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Signup', { profile })}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Welcome')}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
      </TouchableWithoutFeedback>
    );
  };
  
  export default CreateProfile;

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
    },
    selectedButton: {
      backgroundColor: '#ff4081', // Selected button color
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
    uploadedImage: {
        width: 100, // Smaller width
        height: 100, // Smaller height
        borderRadius: 0, // Adjust as needed
        margin: 5, // Space between images
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        paddingVertical: 0,
      }
  });
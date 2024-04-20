import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';
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
  const [imageUri, setImageUri] = useState(null);


  const setPreference = (preference) => setProfile(prevState => ({ ...prevState, preference }));
  const setGender = (gender) => setProfile(prevState => ({ ...prevState, gender }));

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
          setImageUri(uri); // Set the image URI
          
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior='padding'>
        <TextInput
          value={profile.name}
          style={styles.input}
          placeholder="Name"
          onChangeText={(text) => setProfile({ ...profile, name: text })}
        />
        {/* Date of Birth Picker */}
        <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.buttonText}>{profile.dob.toDateString()}</Text>
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.preferenceButton} onPress={() => setGender('Male')}>
            <Text style={styles.buttonText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.preferenceButton} onPress={() => setGender('Female')}>
            <Text style={styles.buttonText}>Female</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.preferenceButton} onPress={() => setGender('Non-binary')}>
            <Text style={styles.buttonText}>Non-binary</Text>
          </TouchableOpacity>
        </View>
        {/* Bio TextInput */}
        <TextInput
          value={profile.bio}
          style={styles.input}
          placeholder="Your Bio"
          multiline={true}
          numberOfLines={4}
          onChangeText={(text) => setProfile({ ...profile, bio: text })}
        />
        {/* Existing Preference Buttons */}
         {/* Preference Buttons */}
         <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.preferenceButton} onPress={() => setPreference('Men')}>
            <Text style={styles.buttonText}>Men</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.preferenceButton} onPress={() => setPreference('Women')}>
            <Text style={styles.buttonText}>Women</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.preferenceButton} onPress={() => setPreference('Non-binary')}>
            <Text style={styles.buttonText}>Non-binary</Text>
          </TouchableOpacity>
        </View>
        {/* Image Display */}
        {imageUri && (
  <Image
    source={{ uri: imageUri }}
    style={styles.uploadedImage}
    resizeMode="contain"
  />
)}

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
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateProfile;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  preferenceButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
  }
});

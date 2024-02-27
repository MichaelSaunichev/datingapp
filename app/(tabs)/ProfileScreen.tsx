import React, { useState, useEffect } from 'react';
import { Switch, Modal, View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {NavigationContainer} from '@react-navigation/native';

type ProfileState = {
  name: string;
  age: string;
  gender: string;
  bio: string;
  profileImageUris: string[]; // Array of URIs for profile images
  datingPreferences: 'Men' | 'Women' | 'Non-binary' | 'Everyone';
  accountPaused: boolean;
  notificationsEnabled: boolean
};

const ProfileScreen: React.FC = ({}) => {
  const [profileState, setProfileState] = useState<ProfileState>({
    name: '',
    age: '',
    gender: '',
    bio: '',
    profileImageUris: [],
    datingPreferences: 'Everyone',
    accountPaused: false,
    notificationsEnabled: false
  });
  const [tempProfileState, setTempProfileState] = useState<ProfileState>({ ...profileState })
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const userId = '0'; // Replace with the actual user ID

  useEffect(() => {
    console.log('Fetching user data for userId:', userId);
  
    // Fetch user data when the component mounts
    fetch(`http://192.168.1.10:3000/api/user/${userId}`)
      .then(response => response.json())
      .then(userData => {
        console.log('User Data:', userData);
        setProfileState(userData);
        setTempProfileState(userData);
      })
      .catch(error => console.error('Error fetching user data:', error));
  }, [userId]);
  
  const updateUserData = () => {
    // Send a request to update user data
    fetch(`http://192.168.1.10:3000/api/user/${userId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tempProfileState),
    })
      .then(response => response.json())
      .catch(error => console.error('Error updating user data:', error));
  };

  const toggleSettingsModal = () => {
    setIsSettingsModalVisible(!isSettingsModalVisible)
  }

  const handleLogOut = () => {
    console.log('Log Out ');
    // clear data, depends on our authentication protocol
  };

  const deleteImage = (index: number) => {
    setTempProfileState(prevState => ({
      ...prevState,
      profileImageUris: prevState.profileImageUris.filter((_, i) => i !== index),
    }));
  };

  const isPreference = (value: any): value is ProfileState['datingPreferences'] => {
    return ['Men', 'Women', 'Non-binary', 'Everyone'].includes(value);
  };

  const handleDatingPreferenceChange = (preference: string) => {
    console.log(preference);
    if (isPreference(preference)) {
      setProfileState((prevState) => ({
        ...prevState,
        datingPreferences: preference,
      }));
    } else {
      console.error('Invalid preference value:', preference);
    }
  };

  const handleImageUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (permissionResult.granted === false) {
      alert("Please allow access to your camera roll in Settings.");
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
  
    console.log(result);
    if (!result.canceled) {
      const newUri = result.assets[0].uri;
      setTempProfileState((prevState) => ({
        ...prevState,
        profileImageUris: [...prevState.profileImageUris, newUri],
      }));
    }
  };

  const saveChanges = () => {
    setProfileState({
      ...tempProfileState});
    updateUserData();
    setIsEditModalVisible(false);
  }; 

  return (
    <View style={styles.container}>
      {/* Profile Image */}
      <Image
        source={{ uri: profileState.profileImageUris[0] || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
        style={styles.profileImage}
      />
    <View style={styles.container}>
      {/*name*/}
      <Text style={styles.nameText}>{profileState.name}</Text>
    </View>
      <View style={styles.buttonAndLabelContainer}>
        {/* Settings Button Group */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity onPress={toggleSettingsModal} style={styles.iconButton}>
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.labelText}>Settings</Text>
        </View>
        {/* Edit Profile Button Group */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={styles.iconButton}>
            <MaterialIcons name="edit" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.labelText}>Edit Profile</Text>
        </View>
      </View>

      {/* SETTINGS*/}
      <Modal
        animationType ="slide"
        transparent={true}
        visible={isSettingsModalVisible}
        onRequestClose={toggleSettingsModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Settings</Text>

            {/*pause account*/}
            <View style={styles.settingContainer}>
              <Text>Pause my account</Text>
              <Switch
                value={profileState.accountPaused}
                onValueChange={(value) => setProfileState((prevState) => ({ ...prevState, accountPaused: value }))}
              />
            </View>

            <View style={styles.settingContainer}>
              <Text>Enable notifications</Text>
              <Switch
                value={profileState.notificationsEnabled}
                onValueChange={(value) => setProfileState((prevState) => ({ ...prevState, notificationsEnabled: value }))}
              />
            </View>

            {/* Dating Preferences */}
            <View style={styles.settingContainer}>
            <Text style={{ marginBottom: 10 }}>Dating Preferences</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['Men', 'Women', 'Non-binary', 'Everyone'].map((preference) => (
                  <TouchableOpacity
                    key={preference}
                    style={[styles.preferenceButton, profileState.datingPreferences === preference ? styles.selectedPreference : {}]}
                    onPress={() => handleDatingPreferenceChange(preference)}
                  >
                    <Text>{preference}</Text>
                  </TouchableOpacity>
                ))}
              </View>
          </View>
          <TouchableOpacity onPress={toggleSettingsModal} style={styles.closeSettingsButton}>
            <Text style={styles.buttonText}>Close Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogOut} style={styles.logOutButton}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>


      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setIsEditModalVisible(!isEditModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.input}
              placeholder="Edit Name"
              value={tempProfileState.name}
              onChangeText={(text) => setTempProfileState({ ...tempProfileState, name: text })}
            />
            <TextInput
              style={[styles.input, {height: 100}]} 
              placeholder="Edit Bio"
              multiline
              numberOfLines={4}
              value={tempProfileState.bio}
              onChangeText={(text) => setTempProfileState({ ...tempProfileState, bio: text })}
            />
            <TouchableOpacity onPress={handleImageUpload} style={styles.addImageButton}>
              <Text style={styles.buttonText}>Add Image</Text>
            </TouchableOpacity>

            <View style={styles.imagePreviewContainer}>
              {tempProfileState.profileImageUris.map((uri, index) => (
                <TouchableOpacity key={index} onPress={() => deleteImage(index)}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={saveChanges} style={styles.saveChangesButton}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
                setIsEditModalVisible(false);
                setTempProfileState(profileState);
              }} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f0f0f0',
    marginTop: 0,
  },
  profileImage: {
    marginTop: 40,
    width: 200,
    height: 200,
    borderRadius: 150,
    marginBottom: 1,
  },
  buttonAndLabelContainer: {
    width: '100%', 
    flexDirection: 'row',
    justifyContent: 'space-around', 
    alignItems: 'center',
    marginBottom: 50, 
  },
  buttonGroup: {
    alignItems: 'center',
    marginHorizontal: 25,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  labelText: {
    color: '#333',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 20,
  },
  modalView: {
    margin: 20,
    width: '90%',
    height: '90%',
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    marginTop: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 5,
  },
  thumbnail: {
    width: 50,
    height: 50,
    margin: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    flexWrap: 'wrap',
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  
  preferenceButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  selectedPreference: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    color: '#ffffff',
  },
  logOutButton: {
    marginTop: 20, 
    backgroundColor: 'red', 
    padding: 10,
    borderRadius: 5,
  },
  closeSettingsButton: {
    marginTop: 20, 
    backgroundColor: 'gray', 
    padding: 10,
    borderRadius: 5,
  },
  addImageButton: {
    marginTop: 20, 
    backgroundColor: 'orange', 
    padding: 10,
    borderRadius: 5,
  },

  saveChangesButton: {
    marginTop: 20, 
    backgroundColor: 'green', 
    padding: 10,
    borderRadius: 5,
  },

  cancelButton: {
    marginTop: 20, 
    backgroundColor: 'grey', 
    padding: 10,
    borderRadius: 5,
  },
});


export default ProfileScreen;
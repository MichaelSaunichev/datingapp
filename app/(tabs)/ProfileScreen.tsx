import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

type ProfileState = {
  name: string;
  bio: string;
  profileImageUris: string[]; // Array of URIs for profile images
};

const openSettings = () => {
  console.log('Open Settings');
  // Here, you would navigate to a Settings screen or open a modal
};

const ProfileScreen: React.FC = () => {
  const [profileState, setProfileState] = useState<ProfileState>({
    name: 'Michael, 22',
    bio: 'Hey',
    profileImageUris: []
  });
  const [editMode, setEditMode] = useState<boolean>(false);
  const [tempProfileState, setTempProfileState] = useState<ProfileState>({ ...profileState })
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

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
      setProfileState(prevState => ({
        ...prevState,
        profileImageUris: [...prevState.profileImageUris, newUri],
      }));
    }    
  };

  const saveChanges = () => {
    setProfileState({
      ...tempProfileState,
      profileImageUris: profileState.profileImageUris,
    });
    setIsEditModalVisible(false);
  };  

  return (
    <View style={styles.container}>
      {/* Profile Image */}
      <Image
        source={{ uri: profileState.profileImageUris[profileState.profileImageUris.length - 1] || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
        style={styles.profileImage}
      />
    <View style={styles.container}>
      {/*name*/}
      <Text style={styles.nameText}>{profileState.name}</Text>
    </View>
      <View style={styles.buttonAndLabelContainer}>
        {/* Settings Button Group */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity onPress={openSettings} style={styles.iconButton}>
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
        style={[styles.input, {height: 100}]} // Make the bio input taller
        placeholder="Edit Bio"
        multiline
        numberOfLines={4}
        value={tempProfileState.bio}
        onChangeText={(text) => setTempProfileState({ ...tempProfileState, bio: text })}
      />
      {/* Button for adding images, assuming `handleImageUpload` is adapted for modal use */}
      <Button title="Add Image" onPress={handleImageUpload} disabled={profileState.profileImageUris.length >= 6} />
      {/* Display thumbnails of selected images */}
      <View style={styles.imagePreviewContainer}>
        {profileState.profileImageUris.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.thumbnail} />
        ))}
      </View>
      <Button title="Save Changes" onPress={saveChanges} />
      <Button title="Cancel" onPress={() => setIsEditModalVisible(false)} />
    </View>
  </View>
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  profileImage: {
    marginTop: 20,
    width: 200,
    height: 200,
    borderRadius: 150,
    marginBottom: 1,
  },
  buttonAndLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 5, // Space between button and label
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
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  thumbnail: {
    width: 50,
    height: 50,
    margin: 5,
  },
});


export default ProfileScreen;
import React, { useState, useEffect } from 'react';
import { Switch, Modal, View, Text, TextInput, ActivityIndicator, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@firebase/storage';

type ProfileState = {
  name: string;
  dob: string;
  gender: 'Man' | 'Woman' | 'Non-binary';
  bio: string;
  pictures: string[];
  datingPreferences: 'Men' | 'Women' |'Everyone';
  accountPaused: boolean;
};

const ProfileScreen: React.FC = ({}) => {
  const route = useRoute();
  const routeParams = route.params as { userEmail: string | undefined };
  const userEmail = routeParams ? routeParams.userEmail : undefined;

  const [profileState, setProfileState] = useState<ProfileState>({
    name: '',
    dob: '',
    gender: 'Man',
    bio: '',
    pictures: [],
    datingPreferences: 'Everyone',
    accountPaused: false,
  });
  const [tempProfileState, setTempProfileState] = useState<ProfileState>({ ...profileState });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const userId = userEmail;

  useEffect(() => {
    const fetchUser = () => {
      fetch(`http://192.168.1.17:3000/api/user/${userId}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 404) {
            console.log("retry");
            setTimeout(fetchUser, 500);
          } else {
            throw new Error('Failed to fetch user data');
          }
        })
        .then(userData => {
          if (userData) {
            setProfileState(userData);
            setTempProfileState(userData);
          }
        })
        .catch(error => console.error('Error fetching user data:', error))
        .finally(() => setLoadingProfile(false));
    };
  
    fetchUser();
  }, [userId]);

  useEffect(() => {
    const calculateAge = (dob: string): number | null => {
      if (!dob) return null; // Return null if DOB is not provided
      const dobDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--; // Reduce age if birthday hasn't occurred yet this year
      }
      return age;
    };

    setAge(calculateAge(profileState.dob));
  }, [profileState.dob]);
  
  const updateUserData = () => {
    // Send a request to update user data
    fetch(`http://192.168.1.17:3000/api/user/${userId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tempProfileState),
    })
      .then(response => response.json())
      .catch(error => console.error('Error updating user data:', error));
  };

  const saveChanges = () => {
    setProfileState({
      ...tempProfileState
    });
    setIsDeleting(false)
    updateUserData();
    setIsSettingsModalVisible(false)
    setIsEditModalVisible(false)

  };

  const handleLogOut = () => {
    console.log('Log Out ');
    // clear data, depends on our authentication protocol
  };

  const deleteImage = (index: number) => {
    setTempProfileState(prevState => ({
      ...prevState,
      pictures: prevState.pictures.filter((_, i) => i !== index),
    }));
  };

  const isPreference = (value: any): value is ProfileState['datingPreferences'] => {
    return ['Men', 'Women', 'Everyone'].includes(value);
  };

  const handleDatingPreferenceChange = (preference: string) => {
    if (isPreference(preference)) {
      setTempProfileState((prevState) => ({
        ...prevState,
        datingPreferences: preference,
      }));
    } else {
      console.error('Invalid preference value:', preference);
    }
  };

  const handleImageUpload = async () => {
    setIsImageUploading(true);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (permissionResult.granted === false) {
      alert("Please allow access to your camera roll in Settings.");
      setIsImageUploading(false);
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `pictures/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);
      setTempProfileState((prevState) => ({
        ...prevState,
        pictures: [...prevState.pictures, imageUrl],
      }));
      setIsImageUploading(false);
    }
    else{
      setIsImageUploading(false);
    }
  };
  if(loadingProfile){
    return(
      <View style={{
        backgroundColor:'#FFF8E1',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }
  return (
    <View style={styles.profileContainer}>
      {/* Profile Image */}
      <Image
        source={{ uri: profileState.pictures[0] || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
        style={styles.profileImage}
      />
      <View style={styles.textContainerName}>
        {/*name*/}
        <Text style={styles.nameText}>{profileState.name}, {age}</Text>
      </View>
      <View style={styles.buttonAndLabelContainer}>
        {/* Settings Button Group */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity onPress={() => setIsSettingsModalVisible(!isSettingsModalVisible)} style={styles.iconButton}>
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

      {/* Settings*/}
      <Modal
        animationType ="slide"
        transparent={true}
        visible={isSettingsModalVisible}
        onRequestClose={()=> setIsSettingsModalVisible(!isSettingsModalVisible)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Settings</Text>

            {/*pause account*/}
            <View style={styles.settingContainer}>
              <Text>Pause my account</Text>
              <Switch
                value={tempProfileState.accountPaused}
                onValueChange={(value) => setTempProfileState((prevState) => ({ ...prevState, accountPaused: value }))}
              />
            </View>

            {/* Dating Preferences */}
            <View style={styles.settingContainer}>
            <Text style={{ marginBottom: 10 }}>Dating Preferences</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {['Men', 'Women', 'Everyone'].map((preference) => (
                  <TouchableOpacity
                    key={preference}
                    style={[styles.preferenceButton,
                      tempProfileState.datingPreferences === preference ? styles.selectedPreference : {}]}
                    onPress={() => handleDatingPreferenceChange(preference)}
                  >
                    <Text>{preference}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={saveChanges} style={styles.saveChangesButton}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setIsSettingsModalVisible(!isSettingsModalVisible), setTempProfileState(profileState)}} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogOut} style={styles.logOutButton}>
              <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Edit Profile*/}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setIsEditModalVisible(false);
        }}
      > 
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <ScrollView style = {styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <View style={styles.editProfileContainer}>
                    <Text style={styles.editProfileText}>Bio:</Text>
                </View>
                <TextInput
                  style={[styles.input, { height: 100 }]}
                  placeholder="Edit Bio"
                  placeholderTextColor="grey"
                  multiline
                  value={tempProfileState.bio}
                  onChangeText={(text) => {
                    const maxLines = 1;
                    const maxCharacters = 200;

                    const lines = text.split('\n');
                    if (lines.length <= maxLines && text.length <= maxCharacters) {
                      setTempProfileState({ ...tempProfileState, bio: text });
                    }
                  }}
                />
                <Text style={styles.editProfileText}>Images:</Text>
                <View style={styles.editProfileContainer}>
                  {!isDeleting ? (
                    <>
                      <TouchableOpacity onPress={handleImageUpload} style={styles.addImageButton}>
                        <Text style={styles.buttonText}>Add Image</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {setIsDeleting(true)}} style={styles.deleteImageButton}>
                        <Text style={styles.buttonText}>Delete Image</Text>
                      </TouchableOpacity>
                    </>
                    
                  ) : (
                    <TouchableOpacity onPress={() => {setIsDeleting(false)}} style={styles.stopDeletingButton}>
                      <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.imagePreviewContainer}>
                  {tempProfileState.pictures.length > 0 ? (
                    tempProfileState.pictures.map((uri, index) => (
                      <View key={index}>
                        {isDeleting ? (
                          <TouchableOpacity onPress={() => deleteImage(index)}>
                            <Image source={{ uri }} style={styles.thumbnail} />
                            <TouchableOpacity style={styles.closeButton} onPress={() => deleteImage(index)}>
                              <Text style={styles.closeButtonText}>x</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ) : (
                          <Image source={{ uri }} style={styles.thumbnail} />
                        )}
                      </View>
                    ))
                  ) : (
                    <Text>No images selected</Text>
                  )}
                </View>
              </ScrollView>
              <View style = {styles.buttonContainer}>
                <TouchableOpacity
                    onPress={saveChanges}
                    style={[styles.saveChangesButton, { opacity: isImageUploading ? 0.5 : 1 }]}
                    disabled={isImageUploading}
                  >
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setIsDeleting(false);
                      setIsEditModalVisible(false);
                      setTempProfileState(profileState);
                    }}
                    style={[styles.cancelButton, { opacity: isImageUploading ? 0.5 : 1 }]}
                    disabled={isImageUploading}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
              </View>
            </View>
          </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: '5%',
    paddingHorizontal: 10,
    backgroundColor: '#FFF8E1',
  },
  profileImage: {
    marginTop: 40,
    width: 200,
    height: 200,
    borderRadius: 150,
  },
  textContainerName: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 225, 0)',
    marginTop: '2%',
  },
  buttonAndLabelContainer: {
    width: '100%', 
    flexDirection: 'row',
    justifyContent: 'space-around', 
    alignItems: 'center',
    marginTop: '50%',
  },
  buttonGroup: {
    alignItems: 'center',
    marginHorizontal: 25,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff6090',
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
    marginTop: 20
  },
  
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  bioText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom:100,
  },
  modalView: {
    margin: 20,
    width: '90%',
    height: '90%',
    backgroundColor: '#FFDAB9',
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
  modalScrollView: {
    flex: 1000,
    width: '100%',
    marginTop: 10,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: -15,
  },
  input: {
    width: '100%',
    marginTop:10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#888888',
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
    width: 250,
    height: 250,
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

  editProfileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
  },

  buttonText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
  
  preferenceButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 5,
  },
  selectedPreference: {
    backgroundColor: 'white',
    color: '#ffffff',
  },
  logOutButton: {
    width: '100%',
    marginTop: 10, 
    backgroundColor: '#FF6F61', 
    padding: 10,
    borderRadius: 5,
  },
  editProfileText: {
    marginLeft: 0,
    fontSize: 18,
  },
  addImageButton: {
    marginTop: 10, 
    backgroundColor: '#ff6090', 
    padding: 10,
    borderRadius: 5,
  },
  deleteImageButton: {
    marginTop: 10, 
    backgroundColor: '#ff6090', 
    padding: 10,
    borderRadius: 5,
  },
  stopDeletingButton: {
    marginTop: 10, 
    backgroundColor: '#ff6090', 
    padding: 10,
    borderRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#888888',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 1,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 30,
    lineHeight: 30,
  },

  saveChangesButton: {
    width: '100%',
    marginTop: 10, 
    backgroundColor: '#4CAF50', 
    padding: 10,
    borderRadius: 5,
  },

  cancelButton: {
    width: '100%',
    marginTop: 10, 
    backgroundColor: '#888888', 
    padding: 10,
    borderRadius: 5,
  },
});


export default ProfileScreen;
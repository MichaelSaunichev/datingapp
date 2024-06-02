import React, { useState, useEffect, useRef } from 'react';
import { Switch, Modal, View, Text, TextInput, ActivityIndicator, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from '@firebase/storage';
import { getAuth, signOut, deleteUser, User } from "firebase/auth";
import { useNavigation, useNavigationState } from '@react-navigation/native';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { API_URL } from '@env';

type ProfileState = {
  name: string;
  dob: string;
  gender: 'Man' | 'Woman' | 'Non-binary';
  bio: string;
  pictures: string[];
  dating_preferences: 'Men' | 'Women' |'Everyone';
  account_paused: boolean;
};

const ProfileScreen: React.FC = ({}) => {
  const route = useRoute();
  const navigation = useNavigation();
  const routeParams = route.params as { userEmail: string | undefined };
  const userEmail = routeParams ? routeParams.userEmail : undefined;

  const [profileState, setProfileState] = useState<ProfileState>({
    name: '',
    dob: '',
    gender: 'Man',
    bio: '',
    pictures: [],
    dating_preferences: 'Everyone',
    account_paused: false,
  });


  const [tempProfileState, setTempProfileState] = useState<ProfileState>({ ...profileState });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const [imageBlobs, setImageBlobs] = useState<string[]>([]);
  const [editModalLoading, seteditModalLoading] = useState<boolean>(false);
  const [alreadyLoadingBlobs, setalreadyLoadingBlobs] = useState(false)

  const [profileBlob, setProfileBlob] = useState<string>('');;
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const socketRef = useRef(null as Socket | null);

  const routes = useNavigationState(state => state.routeNames);

  const userId = userEmail;
  

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/${userId}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData) {
            const blobUrl = await fetchImageAndConvertToBlob(userData.pictures[0]);
            setProfileBlob(blobUrl);
            setProfileState(userData);
            setTempProfileState(userData);
            setLoadingProfile(false);
          }
        } else if (response.status === 404) {
          setTimeout(fetchUser, 500);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        setTimeout(fetchUser, 500);
      }
    };
  
    fetchUser();
  }, [userId]);

  useEffect(() => {
    const socket = io(`${API_URL}`);
    socketRef.current = socket;
    
    return () => {
        socket.disconnect();
    };
  }, []);
  

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
    fetch(`${API_URL}/api/user/${userId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tempProfileState),
    })
      .then(response => response.json())
      .catch(error => console.error('Error updating user data:', error));
  };

  const saveChanges = async () => {
    if (tempProfileState.bio.length < 1){
      alert("Please enter a valid bio");
    }
    else if (tempProfileState.pictures.length < 3 || tempProfileState.pictures.length > 5){
      alert("Please use 3 to 5 images");
    }else{
      setProfileState({
        ...tempProfileState
      });
      setIsDeleting(false);
      updateUserData();
      setIsEditModalVisible(false);
      setImagesToDelete([]);

      const blobUrl = await fetchImageAndConvertToBlob(tempProfileState.pictures[0]);
      setProfileBlob(blobUrl);
  
      await Promise.all(imagesToDelete.map(async (imageUrl) => {
        try {
          const storage = getStorage();
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image from Firebase Storage:', error);
        }
      }));
    }
  };

  const saveChangesSettings = async () => {
    updateUserData();
    setProfileState({
      ...tempProfileState
    });
    setIsSettingsModalVisible(false);
  }

  const handleLogOut = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  const deleteAccount = async () => {
    
    try {

      await Promise.all(profileState.pictures.map(async (imageUrl) => {
        try {
          const storage = getStorage();
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
          console.log('Image deleted successfully from Firebase Storage:', imageUrl);
        } catch (error) {
          console.error('Error deleting image from Firebase Storage:', error);
        }
      }));

      const response = await fetch(`${API_URL}/api/user/delete/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        console.log(`User account with userId ${userId} deleted successfully!`);
        if (socketRef.current) {
          socketRef.current.emit('updateChats', { theUserId1: userId, theUserId2: "all", func: "2" });
        }
      } else {
        console.error(`Failed to delete user account with userId ${userId}.`);
      }

      const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
            await deleteUser(currentUser);
            console.log('Firebase user account deleted successfully.');
        } else {
            console.error('Error: No current user found in Firebase authentication.');
            return;
        }
    } catch (error) {
      console.error('Error deleting user account:', error);
    }
  };

  const setTheImageBlobs = async () => {
    if (alreadyLoadingBlobs){
      return
    }
    setalreadyLoadingBlobs(true);
    const imageUrls = tempProfileState.pictures || [];
    try {
      const blobs = await Promise.all(imageUrls.map(fetchImageAndConvertToBlob));
      setImageBlobs(blobs);
    } catch (error) {
      console.error('Error fetching images and converting to blobs:', error);
    } finally {
      setalreadyLoadingBlobs(false);
      setIsEditModalVisible(true);
      seteditModalLoading(false);
    }
  };

  const fetchImageAndConvertToBlob = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching image and converting to blob:', error);
      return '';
    }
  };

  const deleteImage = (index: number) => {
    const imageUrlToDelete = tempProfileState.pictures[index];
    setTempProfileState(prevState => ({
      ...prevState,
      pictures: prevState.pictures.filter((_, i) => i !== index),
    }));
    setImagesToDelete((prevImages) => [...prevImages, imageUrlToDelete]);
    const blobUrlToDelete = imageBlobs[index];
    URL.revokeObjectURL(blobUrlToDelete);
    setImageBlobs((prevBlobs) => prevBlobs.filter((_, i) => i !== index));
  };

  const isPreference = (value: any): value is ProfileState['dating_preferences'] => {
    return ['Men', 'Women', 'Everyone'].includes(value);
  };

  const handleDatingPreferenceChange = (preference: string) => {
    if (isPreference(preference)) {
      setTempProfileState((prevState) => ({
        ...prevState,
        dating_preferences: preference,
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
      const localImageUrl = URL.createObjectURL(blob);
      setImageBlobs((prevBlobs) => [...prevBlobs, localImageUrl]);
      setIsImageUploading(false);
    }
    else{
      setIsImageUploading(false);
    }
  };
  if(loadingProfile){
    return(
      <View style={{
        backgroundColor:'#1E4D2B',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }
  return (
    <View style={styles.profileContainer}>
      {/* Profile Image */}
      <Image
        source={{ uri: profileBlob || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
        style={styles.profileImage}
      />
      <View style={styles.textContainerName}>
        {/*name*/}
        <Text style={styles.nameText}>{profileState.name}, {age}</Text>
      </View>
      <View style={styles.buttonAndLabelContainer}>
        {/* Settings Button Group */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity disabled = {editModalLoading} onPress={() => setIsSettingsModalVisible(!isSettingsModalVisible)} style={[styles.iconButton, {opacity: editModalLoading ? 0.5 : 1}]}>
            <MaterialIcons name="settings" size={24} color="#1E4D2B" />
          </TouchableOpacity>
          <Text style={styles.labelText}>Settings</Text>
        </View>
        {/* Edit Profile Button Group */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity onPress={() => {setTheImageBlobs(); seteditModalLoading(true)}} style={styles.iconButton}>
            <MaterialIcons name="edit" size={24} color="#1E4D2B" />
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
          <Modal
            animationType="slide"
            transparent={true}
            visible={isDeleteConfirmationVisible}
            onRequestClose={() => setIsDeleteConfirmationVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={[styles.modalView, {width: '81%', height: '81%'}]}>
                <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
                <Text style= {styles.deleteConfirmationText}>Are you sure you want to delete your account?</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={deleteAccount} style={[styles.logOutButton, {backgroundColor: "#FF6F61"}]}>
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsDeleteConfirmationVisible(false)} style={styles.cancelButton}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Settings</Text>

            {/*pause account*/}
            <View style={styles.settingContainer}>
              <Text>Pause my account</Text>
              <Switch
                value={tempProfileState.account_paused}
                onValueChange={(value) => setTempProfileState((prevState) => ({ ...prevState, account_paused: value }))}
              />
            </View>

            {/* Dating Preferences */}
            <View style={{ width: '100%', marginBottom: 10 }}>
              <Text style={{ marginBottom: 10, textAlign: 'left', alignSelf: 'flex-start' }}>Dating Preferences</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {['Men', 'Women', 'Everyone'].map((preference) => (
                  <TouchableOpacity
                    key={preference}
                    style={[
                      styles.preferenceButton,
                      tempProfileState.dating_preferences === preference ? styles.selectedPreference : {},
                      { marginHorizontal: 3 }
                    ]}
                    onPress={() => handleDatingPreferenceChange(preference)}
                  >
                    <Text>{preference}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={saveChangesSettings} style={styles.saveChangesButton}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setIsSettingsModalVisible(!isSettingsModalVisible), setTempProfileState(profileState)}} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.deleteAccountButtonContainer}>
              <TouchableOpacity onPress={handleLogOut} style={styles.logOutButton}>
                <Text style={styles.buttonText}>Log Out</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsDeleteConfirmationVisible(true)} style={styles.deleteAccountButton}>
                <Text style={styles.buttonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Profile*/}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setIsDeleting(false);
          setIsEditModalVisible(false);
          setTempProfileState(profileState);
          setImagesToDelete([]);
          setImageBlobs([]);
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
                    const maxCharacters = 100;

                    const lines = text.split('\n');
                    if (lines.length <= maxLines && text.length <= maxCharacters) {
                      setTempProfileState({ ...tempProfileState, bio: text });
                    }
                  }}
                />
                <Text style={styles.charCount}>{tempProfileState.bio.length}/100</Text>
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
                  {imageBlobs.length > 0 ? (
                    imageBlobs.map((uri, index) => (
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
                      setImagesToDelete([]);
                      setImageBlobs([]);
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
    backgroundColor: '#1E4D2B',
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
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  labelText: {
    color: 'white',
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
    color: 'white',
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
    borderRadius: 50,
  },
  selectedPreference: {
    backgroundColor: 'white',
    color: '#ffffff',
  },
  logOutButton: {
    width: '100%',
    marginBottom: 10, 
    backgroundColor: '#97A9A9',
    padding: 10,
    borderRadius: 50,
  },
  editProfileText: {
    marginLeft: 0,
    fontSize: 18,
  },
  addImageButton: {
    marginTop: 10, 
    backgroundColor: '#ff6090', 
    padding: 10,
    borderRadius: 50,
  },
  deleteImageButton: {
    marginTop: 10, 
    backgroundColor: '#ff6090', 
    padding: 10,
    borderRadius: 50,
  },
  stopDeletingButton: {
    marginTop: 10, 
    backgroundColor: '#ff6090', 
    padding: 10,
    borderRadius: 50,
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
    borderRadius: 50,
  },

  cancelButton: {
    width: '100%',
    marginTop: 10, 
    backgroundColor: '#888888', 
    padding: 10,
    borderRadius: 50,
  },
  deleteAccountButtonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  deleteAccountButton: {
    width: '100%',
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  deleteConfirmationText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    color: '#666',
    fontSize: 14,
},
});


export default ProfileScreen;
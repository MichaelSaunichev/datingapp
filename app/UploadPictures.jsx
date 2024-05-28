import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from '@firebase/storage';
import { useProfile } from './ProfileContext';

const UploadPictures = () => {
    const navigation = useNavigation();
    const { profile, setProfile } = useProfile();
    const [uploading, setUploading] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedPictures, setSelectedPictures] = useState([]);

    const uploadPicture = async () => {
        if (profile.pictures.length >= 5) {
            alert("You can only upload up to 5 pictures.");
            return;
        }

        setUploading(true);
        let result;
        try {
            result = await launchImageLibraryAsync({
                mediaTypes: MediaTypeOptions.Images,
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

                // Update the global profile state with the new image URL
                setProfile(prevProfile => ({
                    ...prevProfile,
                    pictures: [...prevProfile.pictures, imageUrl]
                }));
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const toggleSelectPicture = (imageUrl) => {
        if (selectedPictures.includes(imageUrl)) {
            setSelectedPictures(selectedPictures.filter(url => url !== imageUrl));
        } else {
            setSelectedPictures([...selectedPictures, imageUrl]);
        }
    };

    const deleteSelectedPictures = async () => {
        try {
            await Promise.all(selectedPictures.map(async (imageUrl) => {
                const storage = getStorage();
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
            }));
            setProfile((prevProfile) => ({
                ...prevProfile,
                pictures: prevProfile.pictures.filter((url) => !selectedPictures.includes(url)),
            }));
            setSelectedPictures([]);
        } catch (error) {
            console.error('Error deleting image from Firebase Storage:', error);
            alert("Failed to delete image: " + error.message);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.sectionTitle}>
                    {deleteMode ? 'Select images to delete:' : 'Upload some pics! (3 to 5)'}
                </Text>
                <View style={styles.imagesContainer}>
                    {profile.pictures.map((url, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                if (deleteMode) {
                                    toggleSelectPicture(url);
                                }
                            }}
                            style={[
                                selectedPictures.includes(url) && styles.selectedImageContainer
                            ]}
                        >
                            <Image source={{ uri: url }} style={styles.uploadedImage} />
                            {deleteMode && (
                                <TouchableOpacity
                                    onPress={() => toggleSelectPicture(url)}
                                >
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
                {profile.pictures.length < 5 && !deleteMode && (
                    <TouchableOpacity
                        style={[styles.button, uploading && { opacity: 0.5 }]}
                        onPress={uploadPicture}
                        disabled={uploading}
                    >
                        <Text style={styles.buttonText}>Upload Picture</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.button, uploading && { opacity: 0.5 }]}
                    onPress={() => {setDeleteMode(!deleteMode); setSelectedPictures([])}}
                >
                    <Text style={styles.buttonText}>{deleteMode ? "Stop Deleting" : "Delete Picture"}</Text>
                </TouchableOpacity>
                {deleteMode && selectedPictures.length > 0 && (
                    <TouchableOpacity
                    style={[styles.button, uploading && { opacity: 0.5 }]}
                        onPress={deleteSelectedPictures}
                    >
                        <Text style={styles.buttonText}>Delete Selected</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                        style={[styles.button]}
                        onPress={() => {
                            navigation.navigate('EnterBio');
                        }}
                    >
                        <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
                {profile.pictures.length >= 3 && profile.pictures.length <= 5 && (
                    <TouchableOpacity
                        style={[styles.button, uploading && { opacity: 0.5 }]}
                        onPress={() => {
                            if (profile.pictures.length >= 3 && profile.pictures.length <= 5) {
                                navigation.navigate('Signup');
                            }
                        }}
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

export default UploadPictures;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: '#1E4D2B',
        padding: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    sectionTitle: {
        alignSelf: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    imagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
    },
    uploadedImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        margin: 5,
    },
    button: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'black',
        fontSize: 16,
    },
    deleteText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    selectedImageContainer: {
        opacity: 0.5,
    }
});

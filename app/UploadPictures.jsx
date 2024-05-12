import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@firebase/storage';

const UploadPictures = () => {
    const navigation = useNavigation();
    const [pictures, setPictures] = useState([]);
    const [uploading, setUploading] = useState(false);

    const uploadPicture = async () => {
        if (pictures.length >= 5) {
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
                setPictures([...pictures, imageUrl]);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView>
                <Text style={styles.sectionTitle}>Upload 3 to 5 Pictures</Text>
                <View style={styles.imagesContainer}>
                    {pictures.map((url, index) => (
                        <Image key={index} source={{ uri: url }} style={styles.uploadedImage} />
                    ))}
                </View>
                {pictures.length < 5 && (
                    <TouchableOpacity style={styles.button} onPress={uploadPicture} disabled={uploading}>
                        <Text style={styles.buttonText}>Upload Picture</Text>
                    </TouchableOpacity>
                )}
                {pictures.length >= 3 && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('Signup')}
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
        padding: 20,
        backgroundColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
        backgroundColor: '#007aff',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    }
});

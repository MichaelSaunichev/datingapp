import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';

interface CustomMessage extends IMessage {
  user: User;
}

const NetworkScreen = () => {
    const [messages, setMessages] = useState<CustomMessage[]>([]);
    const [profileImageUris, setProfileImageUris] = useState<{ [userId: string]: string }>({});
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const userId = '4';

    useEffect(() => {
        fetchMessages();
    }, []);

    useEffect(() => {
        const userIdsToFetch = messages.map((message) => message.user?._id).filter((id) => id && id !== userId && !profileImageUris[id]);
        fetchProfileImageUris(userIdsToFetch.map(String))
    }, [messages]);

    const fetchProfileImageUris = async (userIds: string[]) => {
        try {
            for (const userId of userIds) {
                const response = await fetch(`http://192.168.1.22:3000/api/uri/${userId}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch profile image for user ${userId}`);
                }
                const profileImageUris = await response.json();
                console.log('Fetched profile image URIs:', profileImageUris);
                setProfileImageUris((prevProfileImageUris) => ({
                    ...prevProfileImageUris,
                    [userId]: profileImageUris[0] || '',
                }));
            }
        } catch (error) {
            console.error('Error fetching profile images:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            // Make a fetch request to your backend server to retrieve messages
            const response = await fetch(`http://192.168.1.22:3000/api/globalchat`);
            if (!response.ok) {
                throw new Error('Failed to fetch global chat');
            }
            const fetchedMessages = await response.json();
            setMessages(fetchedMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const onSend = async (newMessages: CustomMessage[] = []) => {
        const lastNewMessage = newMessages[newMessages.length - 1];
        console.log(lastNewMessage);

        const updatedMessages = [...messages, lastNewMessage];
        setMessages(updatedMessages);

        try {
            // Send the new message to the backend server
            const response = await fetch(`http://192.168.1.22:3000/api/globalchat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lastNewMessage),
            });
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleAvatarPress = async (user: User) => {
        try {
            const response = await fetch(`http://192.168.1.22:3000/api/user/${user._id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch user profile for user ${user._id}`);
            }
            const userProfile = await response.json();
            console.log('Fetched user profile:', userProfile);
            setSelectedUser(userProfile); // Set selected user profile
            setModalVisible(true); // Show the modal
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    return (
    <View style={{ flex: 1 , backgroundColor: '#FFF8E1'}}>
        <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: userId }}
        renderAvatar={(props) => {
            const { currentMessage } = props;
            const user = currentMessage?.user;
            const userAvatarUri = user?._id && profileImageUris[user._id];

            return (
                <TouchableOpacity onPress={() => handleAvatarPress(user)}>
                    <View style={styles.avatarContainer}>
                    <Image
                        style={styles.avatar}
                        source={{ uri: userAvatarUri || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
                    />
                    </View>
                </TouchableOpacity>
            );
        }}
        inverted = {false}
        />
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            {selectedUser && (
                <View style={styles.centeredView}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>{selectedUser.name}, {selectedUser.age}</Text>
                            {/* Render the first profile image */}
                            <View style={{ alignItems: 'center' }}>
                            {selectedUser.profileImageUris.length > 0 && (
                                <Image
                                key={selectedUser.profileImageUris[0]}
                                source={{ uri: selectedUser.profileImageUris[0] }}
                                style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                                />
                            )}
                            </View>
                            {/* Render the bio after the first picture */}
                            <Text style={{ fontSize: 14, marginTop: 10, textAlign: 'center' }}>{selectedUser.bio}</Text>
                            {/* Render additional profile pictures */}
                            <View style={{ alignItems: 'center' }}>
                                {selectedUser.profileImageUris.slice(1).map((uri: string, index: number) => (
                                <Image
                                    key={uri}
                                    source={{ uri }}
                                    style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                                />
                                ))}
                            </View>
                        </ScrollView>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButtonProfile}>
                                <Text style={styles.actionButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </Modal>
    </View>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20
      },
    modalContent: {
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
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: -15,
    },
    cancelButton: {
        backgroundColor: '#888888',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    cancelButtonProfile: {
        backgroundColor: '#888888',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        width:'50%',
        alignSelf: 'center',
    },
    actionButtonText: {
        color: 'black',
        fontSize: 16,
        textAlign: 'center',
    },
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 20,
    },
})

export default NetworkScreen;
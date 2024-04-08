import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';

interface CustomMessage extends IMessage {
  user: User;
  isAnonymous: boolean;
}

const NetworkScreen = () => {
    const [isAnonymousMode, setIsAnonymousMode] = useState<boolean>(true);
    const [messages, setMessages] = useState<CustomMessage[]>([]);
    const [profileImageUris, setProfileImageUris] = useState<{ [userId: string]: string }>({});
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const userId = '1';

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
        const messagesToAppend = newMessages.map(message => ({
            ...message,
            isAnonymous: isAnonymousMode,
        }));
    
        // Update the messages state
        setMessages(previousMessages =>
            GiftedChat.append(previousMessages, messagesToAppend, false)
        );

        const lastNewMessage = newMessages[newMessages.length - 1];

        const messageToSend = {
            ...lastNewMessage,
            isAnonymous: isAnonymousMode,
        };

        try {
            // Send the new message to the backend server
            const response = await fetch(`http://192.168.1.22:3000/api/globalchat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageToSend),
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
            setSelectedUser(userProfile); // Set selected user profile
            setModalVisible(true); // Show the modal
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    return (
    <View style={{ flex: 1 , backgroundColor: isAnonymousMode ? '#000000' : '#FFF8E1'}}>
        <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={styles.toggleButton} onPress={() => setIsAnonymousMode(!isAnonymousMode)}>
                <Text style={styles.toggleButtonText}>{isAnonymousMode ? 'Switch to Non-Anonymous Mode' : 'Switch to Anonymous Mode'}</Text>
            </TouchableOpacity>
            <Text style={[styles.actionButtonText, { marginBottom: 10, color: isAnonymousMode ? 'white' : 'black' }]}>
                {isAnonymousMode ? 'Your identity will be hidden' : 'Your identity will be visible'}
            </Text>
        </View>
        <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages as CustomMessage[])}
            user={{ _id: userId }}
            renderMessage={(props) => {
                const { currentMessage, nextMessage, ...originalProps } = props;
            
                // Perform null check for currentMessage
                if (!currentMessage) {
                    return null; // Return null if currentMessage is undefined
                }
            
                const user = currentMessage.user;
                const userAvatarUri = user?._id && profileImageUris[user._id];
            
                // Check if the current message is anonymous
                const isAnonymous = currentMessage && (currentMessage as CustomMessage).isAnonymous;
            
                // Check if the current user is the sender of the message
                const isCurrentUser = user?._id === userId;
            
                // Get time
                const createdAtDate = new Date(currentMessage.createdAt);
                let hours = createdAtDate.getHours();
                const minutes = createdAtDate.getMinutes();
                const amPM = hours >= 12 ? 'PM' : 'AM';
                hours %= 12;
                hours = hours || 12;
                const messageTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${amPM}`;
            
                const currentDate = createdAtDate.toDateString();
                const previousDate = (props.previousMessage && new Date(props.previousMessage.createdAt).toDateString()) || '';
                const isNewDay = currentDate !== previousDate;
            
                // Check if the next message is from a different user or if it's going to switch from anonymous mode
                const isNextMessageDifferentUser = nextMessage && nextMessage.user?._id !== currentMessage.user?._id;
                const isNextMessageSwitchingToOrFromAnonymous = nextMessage && (nextMessage as CustomMessage).isAnonymous !== (currentMessage as CustomMessage).isAnonymous;
            
                // Render the avatar only if the next message is from a different user or switching from anonymous mode
                if ((isNextMessageDifferentUser && !isCurrentUser) || isNextMessageSwitchingToOrFromAnonymous && !isCurrentUser) {
                    return (
                        <View>
                            {isNewDay && (
                            <Text style={{ textAlign: 'center', fontSize: 12, marginBottom: 10, color: isAnonymousMode ? 'white' : 'black' }}>
                                {createdAtDate.toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                            )}
                            {/* Render avatar */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 1, paddingHorizontal: 10 }}>
                                {isAnonymous ? (
                                    <Image
                                        style={styles.avatar}
                                        source={{ uri: 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=' }}
                                    />
                                ) : (
                                    <TouchableOpacity onPress={() => handleAvatarPress(user)}>
                                        <Image
                                            style={styles.avatar}
                                            source={{ uri: userAvatarUri || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
                                        />
                                    </TouchableOpacity>
                                )}
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ backgroundColor: (currentMessage as CustomMessage).isAnonymous ? '#CCCCCC' : (originalProps.position === 'right' ? 'lightblue' : 'lightgreen'), borderRadius: 10, padding: 10, maxWidth: '80%', alignSelf: originalProps.position === 'right' ? 'flex-end' : 'flex-start' }}>
                                            <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black' }}>{currentMessage.text}</Text>
                                            <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black', fontSize: 10 }}>{messageTime}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                }
            
                // Render the message without the avatar, include a placeholder
                return (
                    <View>
                        {isNewDay && (
                            <Text style={{ textAlign: 'center', fontSize: 12, marginBottom: 10, color: isAnonymousMode ? 'white' : 'black' }}>
                                {createdAtDate.toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 1, paddingHorizontal: 10}}>
                            {/* Invisible placeholder for avatar */}
                            <View style={{ width: 36, height: 36, marginRight: 8 }} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ backgroundColor: (currentMessage as CustomMessage).isAnonymous ? '#CCCCCC' : (originalProps.position === 'right' ? 'lightblue' : 'lightgreen'), borderRadius: 10, padding: 10, maxWidth: '80%', alignSelf: originalProps.position === 'right' ? 'flex-end' : 'flex-start' }}>
                                        <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black' }}>{currentMessage.text}</Text>
                                        <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black', fontSize: 10 }}>{messageTime}</Text>
                                    </View>
                                </View>
                        </View>
                    </View>
                );
            }}
            inverted={false}
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
    toggleButton: {
        backgroundColor: '#ff6090',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        marginBottom: 10,
        width: '50%',
        alignSelf: 'center',
    },
    toggleButtonText: {
        color: 'black',
        fontSize: 16,
        textAlign: 'center',
    },
})

export default NetworkScreen;
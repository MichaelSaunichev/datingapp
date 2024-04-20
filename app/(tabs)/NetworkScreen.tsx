import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback, } from 'react-native';
import { Avatar, GiftedChat, IMessage, User, Send  } from 'react-native-gifted-chat';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Keyboard } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomMessage extends IMessage {
  user: User;
  isAnonymous: boolean;
  emoji?: string;
  likes?: string[];
}

const NetworkScreen  = () => {
    const [temporaryAnonymousMode, setTemporaryAnonymousMode] = useState<boolean>(false);
    const [isAnonymousMode, setIsAnonymousMode] = useState<boolean>(false);
    const [messages, setMessages] = useState<CustomMessage[]>([]);
    const [profileImageUris, setProfileImageUris] = useState<{ [userId: string]: string }>({});
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [modal2Visible, setModal2Visible] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedEmoji, setSelectedEmoji] = useState<string>('');
    const userId = '2';
    const scrollViewRef = useRef<ScrollView>(null);
    const [showChat, setShowChat] = useState<boolean>(false);

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
                const response = await fetch(`http://192.168.1.17:3000/api/uri/${userId}`);
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
            const response = await fetch(`http://192.168.1.17:3000/api/globalchat`);
            if (!response.ok) {
                throw new Error('Failed to fetch global chat');
            }
            const { messages, total } = await response.json();
            setMessages(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const loadEarlierMessages = async () => {
        try {
            const response = await fetch(`http://192.168.1.17:3000/api/globalchat?limit=20&offset=${messages.length}`);
            if (!response.ok) {
                throw new Error('Failed to fetch earlier messages');
            }
            const { messages: earlierMessages } = await response.json();
            
            // Update state with the newly loaded messages
            setMessages(previousMessages => GiftedChat.prepend(previousMessages, earlierMessages, false));
        } catch (error) {
            console.error('Error loading earlier messages:', error);
        }
    };


    const handleLikeToggle = async (message: CustomMessage) => {
        try {
            const isLiked = (message.likes || []).includes(userId);
          
            const updatedLikes = isLiked
                ? (message.likes || []).filter(id => id !== userId)
                : [...(message.likes || []), userId];
          
            const updatedMessage: CustomMessage = {
                ...message,
                likes: updatedLikes,
            };
    
            // Update the state to reflect the updated likes
            setMessages(prevMessages => prevMessages.map(prevMessage =>
                prevMessage._id === updatedMessage._id ? updatedMessage : prevMessage
            ));
    
            // Send the updated likes to the backend
            const response = await fetch(`http://192.168.1.17:3000/api/globalchat/${updatedMessage._id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ likes: updatedLikes }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to update like status');
            }
        } catch (error) {
            console.error('Error handling like toggle:', error);
        }
    };

    const onSend = async (newMessages: CustomMessage[] = []) => {
        const messagesToAppend = newMessages.map(message => ({
            ...message,
            isAnonymous: isAnonymousMode,
            emoji: isAnonymousMode ? selectedEmoji : undefined,
        }));
    
        // Update the messages state
        setMessages(previousMessages =>
            GiftedChat.append(previousMessages, messagesToAppend, false)
        );

        const lastNewMessage = newMessages[newMessages.length - 1];

        const messageToSend = {
            ...lastNewMessage,
            isAnonymous: isAnonymousMode,
            emoji: isAnonymousMode ? selectedEmoji : undefined,
        };

        try {
            // Send the new message to the backend server
            const response = await fetch(`http://192.168.1.17:3000/api/globalchat`, {
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
        } finally {
            scrollToBottom();
        }
    };

    const handleAvatarPress = async (user: User) => {
        try {
            const response = await fetch(`http://192.168.1.17:3000/api/user/${user._id}`);
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

    const scrollToBottomComponent = () => {
        return (
            <FontAwesome name="angle-double-down" size={24} color="#333" />
        );
    };

    const scrollToBottom = () => {
        if (scrollViewRef && scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    };

    interface RenderSendProps {
        text?: string;
        onSend: (messages: IMessage[]) => void;
    }

    const renderSend = (props: RenderSendProps) => {
        return (
            <Send {...props}>
                <View>
                    <MaterialCommunityIcons
                    name="send-circle"
                    style={{marginBottom: 5, marginRight: 5}}
                    size={32}
                    color={isAnonymousMode ? '#CCCCCC' : 'lightblue'}
                    />
                </View>
            </Send>
        );
    };

    return (
    <View style={{ flex: 1 }}>
    {showChat? (
            <View style={{ flex: 1 , backgroundColor: isAnonymousMode ? '#222222' : '#FFF8E1'}}>
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                            <TouchableOpacity style={styles.backButton} onPress={() => setShowChat(false)}>
                                <Text style={styles.toggleButtonText}>Back</Text>
                            </TouchableOpacity>
                            <Text style={[styles.actionButtonText, { marginRight: 20, marginLeft: 20, marginBottom: 10, color: isAnonymousMode ? 'white' : 'black' }]}>
                                {isAnonymousMode ? 'Your identity will be hidden' : 'Your identity will be visible'}
                            </Text>
                            <TouchableOpacity style={styles.toggleButton} onPress={() => setModal2Visible(true)}>
                                <MaterialCommunityIcons name="cog" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
                <GiftedChat
                    loadEarlier={true}
                    onLoadEarlier={loadEarlierMessages}
                    scrollToBottom
                    scrollToBottomComponent={scrollToBottomComponent}
                    alwaysShowSend
                    renderSend={renderSend}
                    messages={messages}
                    onSend={messages => onSend(messages as CustomMessage[])}
                    user={{ _id: userId }}
                    renderMessage={(props) => {
                        const { currentMessage, nextMessage, ...originalProps } = props;
                    
                        if (!currentMessage) {
                            return null;
                        }
                        const user = currentMessage.user;
                        const userAvatarUri = user?._id && profileImageUris[user._id];
                    
                        const isAnonymous = currentMessage && (currentMessage as CustomMessage).isAnonymous;
                    
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
                    
                        const isNextMessageDifferentUser = nextMessage && nextMessage.user?._id !== currentMessage.user?._id;
                        const isNextMessageSwitchingToOrFromAnonymous = nextMessage && (nextMessage as CustomMessage).isAnonymous !== (currentMessage as CustomMessage).isAnonymous;
                        const isNextMessageNewAnonymousAvatar = nextMessage && (nextMessage as CustomMessage).isAnonymous && (currentMessage as CustomMessage).isAnonymous && (nextMessage as CustomMessage).emoji !== (currentMessage as CustomMessage).emoji;
                    
                        // Render the avatar only if the next message is from a different user or switching from anonymous mode
                        if (isNextMessageDifferentUser || isNextMessageSwitchingToOrFromAnonymous || isNextMessageNewAnonymousAvatar) {
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
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, paddingHorizontal: 10 }}>
                                        {!isCurrentUser && (
                                            <View>
                                                {isAnonymous ? (
                                                    (currentMessage as CustomMessage).emoji ? (
                                                        <View style = {styles.avataremoji}>
                                                            <Text style={styles.emojiText}>{(currentMessage as CustomMessage).emoji}</Text>
                                                        </View>
                                                    ) : (
                                                        <View style = {styles.avataremoji}>
                                                            <Text style={styles.emojiText}>😊</Text>
                                                        </View>
                                                    )
                                                ) : (
                                                    <TouchableOpacity onPress={() => handleAvatarPress(user)}>
                                                        <Image
                                                            style={styles.avatar}
                                                            source={{ uri: userAvatarUri || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
                                                        />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: originalProps.position === 'right' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                                                <View style={{ maxWidth: '80%' }}>
                                                    <View style={{ backgroundColor: (currentMessage as CustomMessage).isAnonymous ? '#CCCCCC' : (originalProps.position === 'right' ? 'lightblue' : 'lightgreen'), borderRadius: 10, padding: 10 }}>
                                                        <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black' }}>{currentMessage.text}</Text>
                                                        <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black', fontSize: 10 }}>{messageTime}</Text>
                                                    </View>
                                                    {(currentMessage as CustomMessage).likes && ((currentMessage as CustomMessage).likes?.length ?? 0) > 0 && (
                                                        <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: originalProps.position === 'right' ? 'flex-end' : 'flex-start', marginTop: 0 }}>
                                                            <Text style={{ color: 'white', fontSize: 12 }}> {(currentMessage as CustomMessage).likes?.length ?? 0} {(currentMessage as CustomMessage).likes?.length === 1 ? 'Like' : 'Likes'} </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {!isCurrentUser && (
                                                <TouchableOpacity onPress={() => handleLikeToggle(currentMessage as CustomMessage)} style={{alignSelf: 'center', paddingLeft: 8 }}>
                                                    <View style={styles.likeButton}>
                                                        <FontAwesome name={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? 'heart' : 'heart-o'} size={24} color={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? 'red' : 'red'} />
                                                    </View>
                                                </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        {isCurrentUser && (
                                            <View>
                                                {isAnonymous ? (
                                                    (currentMessage as CustomMessage).emoji ? (
                                                        <View style={[styles.avataremoji, { marginLeft: 8 }]}>
                                                            <Text style={styles.emojiText}>{(currentMessage as CustomMessage).emoji}</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={[styles.avataremoji, { marginLeft: 8 }]}>
                                                            <Text style={styles.emojiText}>😊</Text>
                                                        </View>
                                                    )
                                                ) : (
                                                    <TouchableOpacity onPress={() => handleAvatarPress(user)}>
                                                        <Image
                                                            style={[styles.avatar, {marginLeft: 8}]}
                                                            source={{ uri: userAvatarUri || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
                                                        />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        }

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
                                <View style={{ flex: 1, marginLeft: 8, marginBottom: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: originalProps.position === 'right' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                                        {!isCurrentUser && (<View style={{ width: 46, height: 38 }} />)}
                                        <View style={{ maxWidth: '80%' }}>
                                            <View style={{ backgroundColor: (currentMessage as CustomMessage).isAnonymous ? '#CCCCCC' : (originalProps.position === 'right' ? 'lightblue' : 'lightgreen'), borderRadius: 10, padding: 10 }}>
                                                <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black' }}>{currentMessage.text}</Text>
                                                <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black', fontSize: 10 }}>{messageTime}</Text>
                                            </View>
                                            {(currentMessage as CustomMessage).likes && ((currentMessage as CustomMessage).likes?.length ?? 0) > 0 && (
                                                <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: originalProps.position === 'right' ? 'flex-end' : 'flex-start', marginTop: 0 }}>
                                                    <Text style={{ color: 'white', fontSize: 12 }}> {(currentMessage as CustomMessage).likes?.length ?? 0} {(currentMessage as CustomMessage).likes?.length === 1 ? 'Like' : 'Likes'} </Text>
                                                </View>
                                            )}
                                        </View>
                                        {!isCurrentUser && (
                                        <TouchableOpacity onPress={() => handleLikeToggle(currentMessage as CustomMessage)} style={{alignSelf: 'center', paddingLeft: 8 }}>
                                            <View style={styles.likeButton}>
                                                <FontAwesome name={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? 'heart' : 'heart-o'} size={24} color={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? 'red' : 'red'} />
                                            </View>
                                        </TouchableOpacity>
                                        )}
                                        {isCurrentUser && (<View style={{ width: 54, height: 38}} />)}
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
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modal2Visible}
                    onRequestClose={() => setModal2Visible(false)}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalContent}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Anonymous Settings</Text>
                            {/* Button to toggle between temporary anonymous and non-anonymous modes */}
                            {!temporaryAnonymousMode ? (
                                <TouchableOpacity style={styles.actionButton} onPress={() => setTemporaryAnonymousMode(true)}>
                                    <Text style={styles.toggleButtonText}>Go Anonymous</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.actionButton} onPress={() => setTemporaryAnonymousMode(false)}>
                                    <Text style={styles.toggleButtonText}>Go Non-Anonymous</Text>
                                </TouchableOpacity>
                            )}
                            {/* Render avatar selection if in temporary anonymous mode */}
                            {temporaryAnonymousMode && (
                                <View>
                                    <Text style={{ fontSize: 16, marginTop: 20 }}>Choose an Avatar:</Text>
                                    <View style={styles.emojiContainer}>
                                        <View style={styles.emojiList}>
                                            {['🤖', '👻', '👽', '🤡', '🍆'].map(emoji => (
                                                <TouchableOpacity
                                                    key={emoji}
                                                    style={[styles.emojiItem, selectedEmoji === emoji ? styles.selectedEmoji : null]}
                                                    onPress={() => setSelectedEmoji(emoji)}
                                                >
                                                    <Text style={styles.emojiText}>{emoji}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            )}
                            {/* Close button */}
                            <TouchableOpacity style={styles.cancelButton} onPress={() => {
                                setModal2Visible(false);
                                setIsAnonymousMode(temporaryAnonymousMode);
                            }}>
                                <Text style={styles.actionButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
    ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#FFF8E1"  }}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowChat(true)}>
                <Text style={{ color: 'black', fontSize: 20 }}>Enter Global Chat</Text>
            </TouchableOpacity>
            <Text style={{fontStyle: 'italic', color: '#777'}}>Please be respectful to others in the chat.</Text>
        </View>

    )}
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
        backgroundColor: '#4CAF50',
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
    avataremoji: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#CCCCCC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleButton: {
        backgroundColor: '#ff6090',
        padding: 10,
        borderRadius: 25,
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        alignSelf: 'center',
    },
    actionButton: {
        backgroundColor: '#ff6090',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        marginRight: 10,
        marginBottom: 10,
        alignSelf: 'center',
    },
    toggleButtonText: {
        color: 'black',
        fontSize: 16,
        textAlign: 'center',
    },
    emojiContainer: {
        marginTop: 0,
        marginBottom: 10,
        alignItems: 'center',
    },
    emojiHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emojiList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    emojiItem: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        margin: 3,
        borderRadius: 10,
        backgroundColor: '#ddd',
    },
    selectedEmoji: {
        backgroundColor: '#ff6090',
    },
    emojiText: {
        fontSize: 16,
    },
    likeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    scrollButton: {
        width: 40,
        height: 40,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: 'grey',
        paddingVertical: 8,
        borderRadius: 5,
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 14,
        alignSelf: 'flex-start',
        marginLeft: 10
    },
})

export default NetworkScreen;
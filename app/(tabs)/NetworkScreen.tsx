import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Alert } from 'react-native';
import { GiftedChat, IMessage, User, Send  } from 'react-native-gifted-chat';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Keyboard } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { API_URL } from '@env';

interface CustomMessage extends IMessage {
  user: User;
  isAnonymous: boolean;
  emoji?: string;
  likes?: string[];
}

const NetworkScreen  = () => {
    const route = useRoute();
    const routeParams = route.params as { userEmail: string | undefined };
    const userEmail = routeParams ? routeParams.userEmail : undefined;

    const [isAnonymousMode, setIsAnonymousMode] = useState<boolean>(false);
    const [messages, setMessages] = useState<CustomMessage[]>([]);
    const [pictures, setPictures] = useState<{ [userId: string]: string }>({});
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [modal2Visible, setModal2Visible] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedEmoji, setSelectedEmoji] = useState<string>('');
    const userId = userEmail || '';
    const [showChat, setShowChat] = useState<boolean>(false);
    const [modalLoading, setModalLoading] = useState<boolean>(false);
    const [readyChat, setReadyChat] = useState(false)

    const socketRef = useRef(null as Socket | null);

    useEffect(() => {
        const socket = io(`${API_URL}`);
        socketRef.current = socket;
        
        socket.on('message', ( {theUserId} ) => {
            if (userId != theUserId){
                fetchMostRecentMessage();
            }
        });

        socket.on('like', ({ updatedMessage, theUserId }) => {
            if (theUserId != userId){
                setMessages((prevMessages) =>
                    prevMessages.map((prevMessage) =>
                        prevMessage._id === updatedMessage._id ? updatedMessage : prevMessage
                    )
                );
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (showChat) {
          const fetchMessagesWithRetry = () => {
            fetchMessages().catch(error => {
              setTimeout(fetchMessagesWithRetry, 1000);
            });
          };
      
          fetchMessagesWithRetry();
        }
      }, [showChat]);

    useEffect(() => {
        if(showChat){
            setReadyChat(true);
        }
    }, [messages]);

    useEffect(() => {
        const userIdsToFetch = messages
            .map((message) => message.user?._id)
            .filter((id, index, array) => id && array.indexOf(id) === index && !pictures[id]);
        fetchProfileImageUris(userIdsToFetch.map(String))
    }, [messages]);

    const fetchProfileImageUris = async (userIds: string[]) => {
        try {
            const newPictures: { [userId: string]: string } = {};
            for (const userId of userIds) {
                const response = await fetch(`${API_URL}/api/uri/${userId}`);
                const pictures = await response.json();
    
                if (pictures.length > 0) {
                    // Directly use the first picture URL
                    const imageUrl = pictures[0];
                    newPictures[userId] = imageUrl;
                }
            }
            setPictures((prevPictures) => ({ ...prevPictures, ...newPictures }));
        } catch (error) {
            console.error('Error fetching profile images:', error);
        }
    };

  
    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/api/globalchat`);
            if (!response.ok) {
                throw new Error('Failed to fetch global chat');
            }
            const { messages, total } = await response.json() as { messages: CustomMessage[], total: number };
            
            const now = new Date();
            const localMessages = messages
                .map(message => ({
                    ...message,
                    createdAt: new Date(message.createdAt)
                }))
                .filter(message => message.createdAt <= now);
    
            setMessages(localMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };
    
    const fetchMostRecentMessage = async () => {
        try {
            const response = await fetch(`${API_URL}/api/globalchat?limit=1`);
            if (!response.ok) {
                throw new Error('Failed to fetch most recent message');
            }
            const { messages } = await response.json() as { messages: CustomMessage[] };
            const now = new Date();
            const mostRecentMessage = {
                ...messages[0],
                createdAt: new Date(messages[0].createdAt)
            };
    
            if (mostRecentMessage.createdAt > now) {
                return;
            }
    
            setMessages(previousMessages => {
                const isMessageAlreadyFetched = previousMessages.some(msg => msg._id === mostRecentMessage._id);
                if (isMessageAlreadyFetched) {
                    return previousMessages;
                }
                return GiftedChat.append(previousMessages, [mostRecentMessage], false);
            });
        } catch (error) {
            console.error('Error fetching most recent message:', error);
        }
    };
    
    const loadEarlierMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/api/globalchat?limit=20&offset=${messages.length}`);
            if (!response.ok) {
                throw new Error('Failed to fetch earlier messages');
            }
            const { messages: earlierMessages } = await response.json() as { messages: CustomMessage[] };
    
            const now = new Date();
            const localEarlierMessages = earlierMessages
                .map(message => ({
                    ...message,
                    createdAt: new Date(message.createdAt)
                }))
                .filter(message => message.createdAt <= now);
    
            setMessages(previousMessages => {
                // Combine previous messages with the new messages
                const combinedMessages = [...previousMessages, ...localEarlierMessages];
                
                // Create a map to remove duplicates based on the message _id
                const uniqueMessagesMap = new Map();
                combinedMessages.forEach(message => {
                    uniqueMessagesMap.set(message._id, message);
                });
    
                // Convert the map back to an array of unique messages
                const uniqueMessages = Array.from(uniqueMessagesMap.values());
    
                // Sort messages by createdAt to maintain order
                uniqueMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
                return uniqueMessages;
            });
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
            const response = await fetch(`${API_URL}/api/globalchat/${updatedMessage._id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ likes: userId }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to update like status');
            }
            if (socketRef.current) {
                socketRef.current.emit('sendLike', { updatedMessage: updatedMessage, theUserId: userId });
              } else {
                console.error('Socket connection is not established');
              }
            
        } 
        
        catch (error) {
            console.error('Error handling like toggle:', error);
        }
    };

    const onSend = async (newMessages: CustomMessage[] = []) => {
        const messagesToAppend = newMessages.map(message => ({
            ...message,
            isAnonymous: isAnonymousMode,
            emoji: isAnonymousMode ? selectedEmoji : undefined,
        }));

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
            const response = await fetch(`${API_URL}/api/globalchat`, {
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
            if (socketRef.current) {
                socketRef.current.emit('sendMessage', { theUserId: userId });
              } else {
                console.error('Socket connection is not established');
              }
        }
    };

    const handleAvatarPress = async (user: User, isAnonymous: boolean) => {
        if (isAnonymous) {
            showReportDialog(user, true);
        } else {
            if (!modalLoading) {
                setModalLoading(true);
                try {
                    const response = await fetch(`${API_URL}/api/user/${user._id}`);
                    if (!response.ok) {
                        setModalLoading(false);
                        return;
                    }
                    const userProfile = await response.json();
                    setSelectedUser(userProfile);
                    setModalVisible(true);
                    setModalLoading(false);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setModalLoading(false);
                }
            }
        }
    };

    const scrollToBottomComponent = () => {
        return (
            <FontAwesome name="angle-double-down" size={24} color="#333" />
        );
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

    const calculateAgeFromDOB = (dob: string): number | null => {
        if (!dob) return null;
        const dobDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        return age;
    };

    const showReportDialog = (user: User, isAnonymous: boolean = false) => {
        Alert.alert(
            'Report',
            'Please select a reason for reporting:',
            [
                { text: 'Inappropriate Content', onPress: () => handleReport(user, 'inappropriate content', isAnonymous) },
                { text: 'Abusive Behavior', onPress: () => handleReport(user, 'abusive behavior', isAnonymous) },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };
    
    const handleReport = async (reportedItem: User, reason: string, isAnonymous: boolean) => {
        const reportedUserId = isAnonymous ? reportedItem._id || (reportedItem as CustomMessage).user._id : (reportedItem as User as any).id || (reportedItem as User)._id;
    
        // Log the reported user ID
        console.log('Reported User ID:', reportedUserId);
    
        try {
            const response = await fetch(`${API_URL}/api/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportedUserId,
                    reportingUserId: userId,
                    timestamp: new Date().toISOString(),
                    reason,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to report');
            }
            Alert.alert('Report submitted', 'Thank you for your feedback.');
        } catch (error) {
            console.error('Error reporting:', error);
            Alert.alert('Report Failed', 'There was an issue submitting your report. Please try again later or contact support if the problem persists.');
        }
    };
    

    return (
    <View style={{ flex: 1 }}>
    {readyChat? (
            <View style={{ flex: 1 , backgroundColor: isAnonymousMode ? '#2C3E50' : '#FFF8E1'}}>
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                            <TouchableOpacity disabled = {modalLoading} style={[styles.backButton, { opacity: modalLoading ? 0.5 : 1 }]} onPress={() => {setMessages([]); setShowChat(false); setReadyChat(false); setPictures({})}}>
                                <Text style={styles.toggleButtonText}>Back</Text>
                            </TouchableOpacity>
                            <Text style={[styles.actionButtonText, { marginRight: 20, marginLeft: 20, marginBottom: 10, color: isAnonymousMode ? 'white' : 'black' }]}>
                                {isAnonymousMode ? 'Your identity will be hidden' : 'Your identity will be visible'}
                            </Text>
                            <TouchableOpacity disabled = {modalLoading} style={[styles.toggleButton, { opacity: modalLoading ? 0.5 : 1 }]} onPress={() => setModal2Visible(true)}>
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
                    user={{ _id: userId || ''}}
                    renderMessage={(props) => {
                        const { currentMessage, nextMessage, ...originalProps } = props;
                    
                        if (!currentMessage) {
                            return null;
                        }
                        const user = currentMessage.user;
                        const userAvatarUri = user?._id && pictures[user._id];
                    
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
                                                        <TouchableOpacity onPress={() => handleAvatarPress(user, true)}>
                                                            <View style={styles.avataremoji}>
                                                                <Text style={styles.emojiText}>{(currentMessage as CustomMessage).emoji || '😊'}</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    )
                                                ) : (
                                                    <TouchableOpacity onPress={() => handleAvatarPress(user, false)}>
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
                                                        <View style={{ backgroundColor: '#F08080', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: originalProps.position === 'right' ? 'flex-end' : 'flex-start', marginTop: 0 }}>
                                                            <Text style={{ color: 'white', fontSize: 12 }}> {(currentMessage as CustomMessage).likes?.length ?? 0} {(currentMessage as CustomMessage).likes?.length === 1 ? 'Like' : 'Likes'} </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {!isCurrentUser && (
                                                <TouchableOpacity onPress={() => handleLikeToggle(currentMessage as CustomMessage)} style={{alignSelf: 'center', paddingLeft: 8 }}>
                                                    <View style={styles.likeButton}>
                                                        <FontAwesome name={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? 'heart' : 'heart-o'} size={24} color={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? '#F08080' : '#F08080'} />
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
                                                    <TouchableOpacity onPress={() => handleAvatarPress(user, false)}>
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
                                                <View style={{ backgroundColor: '#F08080', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: originalProps.position === 'right' ? 'flex-end' : 'flex-start', marginTop: 0 }}>
                                                    <Text style={{ color: 'white', fontSize: 12 }}> {(currentMessage as CustomMessage).likes?.length ?? 0} {(currentMessage as CustomMessage).likes?.length === 1 ? 'Like' : 'Likes'} </Text>
                                                </View>
                                            )}
                                        </View>
                                        {!isCurrentUser && (
                                        <TouchableOpacity onPress={() => handleLikeToggle(currentMessage as CustomMessage)} style={{alignSelf: 'center', paddingLeft: 8 }}>
                                            <View style={styles.likeButton}>
                                                <FontAwesome name={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? 'heart' : 'heart-o'} size={24} color={(currentMessage as CustomMessage).likes && (currentMessage as CustomMessage).likes?.includes(userId) ? '#F08080' : '#F08080'} />
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
                    onRequestClose={() => {setSelectedUser(null); setModalVisible(false);}}
                >
                    {selectedUser && (
                        <View style={styles.centeredView}>
                            <View style={styles.modalContent}>
                                {selectedUser.id !== userId && (
                                    <TouchableOpacity style={styles.flagButton} onPress={() => showReportDialog(selectedUser)}>
                                        <FontAwesome name="flag" size={24} color="#FF6347" />
                                    </TouchableOpacity>
                                )}
                                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>{selectedUser.name}, {calculateAgeFromDOB(selectedUser.dob) !== null && calculateAgeFromDOB(selectedUser.dob)}</Text>
                                    <View style={{ alignItems: 'center' }}>
                                        {selectedUser.pictures && selectedUser.pictures.length > 0 && (
                                            <Image
                                                key={selectedUser.pictures[0]}
                                                source={{ uri: selectedUser.pictures[0] }}
                                                style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                                            />
                                        )}
                                    </View>
                                    <Text style={{ fontSize: 14, marginTop: 10, textAlign: 'center' }}>{selectedUser.bio}</Text>
                                    <View style={{ alignItems: 'center' }}>
                                        {selectedUser.pictures && selectedUser.pictures.slice(1).map((uri: string, index: number) => (
                                            <Image
                                                key={uri}
                                                source={{ uri }}
                                                style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                                            />
                                        ))}
                                    </View>
                                </ScrollView>
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity onPress={() => {setSelectedUser(null); setModalVisible(false);}} style={styles.cancelButtonProfile}>
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
                            {!isAnonymousMode ? (
                                <TouchableOpacity style={styles.actionButton} onPress={() => setIsAnonymousMode(true)}>
                                    <Text style={styles.toggleButtonText}>Go Anonymous</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.actionButton} onPress={() => setIsAnonymousMode(false)}>
                                    <Text style={styles.toggleButtonText}>Go Non-Anonymous</Text>
                                </TouchableOpacity>
                            )}
                            {/* Render avatar selection if in temporary anonymous mode */}
                            {isAnonymousMode && (
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
                            <TouchableOpacity style={[styles.cancelButton, { marginTop: 20 }]} onPress={() => {
                                setModal2Visible(false);
                            }}>
                                <Text style={styles.actionButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
    ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E4D2B', padding: 20 }}>
            <FontAwesome name="comments" size={64} color="white" style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 10, textAlign: 'center' }}>
                Welcome to Global Chat
            </Text>
            <TouchableOpacity
                style={{
                    backgroundColor: '#FFD700',
                    paddingVertical: 15,
                    paddingHorizontal: 30,
                    borderRadius: 25,
                    marginBottom: 20,
                }}
                onPress={() => setShowChat(true)}
            >
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E4D2B' }}>Enter Global Chat</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, color: 'white', marginBottom: 30, textAlign: 'center' }}>
                Connect with fellow Cal Poly students. Please be respectful and enjoy your conversations!
            </Text>
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
        width: '100%',
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 50,
        marginTop: 10,
    },
    cancelButtonProfile: {
        width: '100%',
        backgroundColor: '#888888',
        padding: 10,
        borderRadius: 50,
        marginTop: 10,
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
        width: '100%',
        backgroundColor: '#ff6090',
        padding: 10,
        borderRadius: 50,
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
        borderRadius: 50,
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 14,
        alignSelf: 'flex-start',
        marginLeft: 10
    },
    flagButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
    },
})

export default NetworkScreen;
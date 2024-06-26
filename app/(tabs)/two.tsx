import { useState, useEffect, useRef } from 'react';
import { FlatList, TouchableOpacity, Text, View, Image, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { GiftedChat, IMessage, User, Send, MessageProps } from 'react-native-gifted-chat';
import { useRoute } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { API_URL } from '@env';

interface CustomMessage extends IMessage {
  user: User;
}

const TabTwoScreen = () => {
  const route = useRoute();
  const routeParams = route.params as { userEmail: string | undefined };
  const userEmail = routeParams ? routeParams.userEmail : undefined;
  
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chats, setChats] = useState<{ name: string; picture?: string; _id: string; firstMessage: string}[]>([]);
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [readyChat, setReadyChat] = useState<boolean>(false);

  const [modal1Visible, setmodal1Visible] = useState(false);
  const [modal2Visible, setmodal2Visible] = useState(false);

  const [loadingChat, setLoadingChat] = useState<boolean>(false);

  const [modal2Loading, setModal2Loading] = useState<boolean>(false);

  const [userFirstImageBlobs, setUserFirstImageBlobs] = useState<{ [userId: string]: string }>({});
  const [initialRender, setInitialRender] = useState<boolean>(false);

  const socketRef = useRef(null as Socket | null);
  const [shouldFetchChats, setShouldFetchChats] = useState<boolean>(false);
  const selectedChatRef = useRef<string | null>(null);
  const chatUserIdsRef = useRef<string[]>([]);


  const userId = userEmail;

  useEffect(() => {
    const userIds = chats.map(chat => chat._id);
    chatUserIdsRef.current = userIds;
  }, [chats]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchChatsInitial();
        setInitialRender(true);
      } catch (error) {
        setTimeout(fetchData, 1000);
      }
    };
  
    fetchData();
  
  }, []);

  useEffect(() => {
    const socket = io(`${API_URL}`);
    socketRef.current = socket;
    
    socket.on('updateTheChats', ({ theUserId1, theUserId2, func }) => {
      //unmatch or block
      if (func == "1" && theUserId2 == userId){
        if (selectedChatRef.current == theUserId1) {
          //in chat
          setSelectedChat(null);
        }
        fetchChatsInitial();
      }
      //add chat after match
      else if ( func == "0" && ( (theUserId1 === userId) || (theUserId2 === userId) ) ){
          fetchChatsInitial();
      }
      //deleted account
      else if (func == "2" && theUserId1 != userId){
        const isUserId1InChats = chatUserIdsRef.current.includes(theUserId1);
        if (isUserId1InChats) {
          if (selectedChatRef.current == theUserId1) {
            //in chat
            setSelectedChat(null);
          }
          fetchChatsInitial();
        }
      }
    });

    socket.on('theNewMessage', ({ senderId, recipientId }) => {
      //if person being sent to
      if (recipientId === userId) {
        // if in the chat
        if (selectedChatRef.current === senderId) {
          fetchMostRecentMessage();
          setShouldFetchChats(true);
        // in another chat
        } else if (selectedChatRef.current != null){
          setShouldFetchChats(true);
        //outside of chats
        } else{
          fetchChats();
        }
      }
    });
  
    return () => {
        socket.disconnect();
    };
  }, []);


  const fetchMostRecentMessage = async () => {
    try {
        const chatId = selectedChatRef.current?.toString();
        const response = await fetch(`${API_URL}/api/chat/${userId}/${chatId}?limit=1`);
        if (!response.ok) {
            throw new Error('Failed to fetch most recent message');
        }
        const { messages } = await response.json();
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
        const response = await fetch(`${API_URL}/api/chat/${userId}/${selectedChat}?limit=20&offset=${messages.length}`);
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
            const combinedMessages = [...previousMessages, ...localEarlierMessages];

            const uniqueMessagesMap = new Map();
            combinedMessages.forEach(message => {
                uniqueMessagesMap.set(message._id, message);
            });

            const uniqueMessages = Array.from(uniqueMessagesMap.values());
            uniqueMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            return uniqueMessages;
        });
    } catch (error) {
        console.error('Error loading earlier messages:', error);
    }
  };


  const fetchChats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat users');
      }
      const chatUsers = await response.json();
      setChats(chatUsers);
    } catch (error) {
      console.error('Error fetching chat users:', error);
    }
  };

  
  const fetchChatsInitial = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat users');
      }
      const chatUsers = await response.json();
  
      const mapping: { [userId: string]: string } = {};
      await Promise.all(chatUsers.map(async (user: { picture?: string; _id: string }) => {
        if (user.picture) {
          mapping[user._id] = user.picture;
        }
      }));
      setUserFirstImageBlobs(mapping);
      setChats(chatUsers);
    } catch (error) {
      throw error;
    }
  };

  const onChatSelect = async (chatId: string) => {
    if (loadingChat) {
        return;
    }
    setLoadingChat(true);
    setSelectedChat(chatId);

    try {
        const response = await fetch(`${API_URL}/api/chat/${userId}/${chatId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        const { messages, userProfile } = await response.json();

        const now = new Date();
        const localMessages = messages
            .map((message: CustomMessage) => ({
                ...message,
                createdAt: new Date(message.createdAt)
            }))
            .filter((message: CustomMessage) => message.createdAt <= now);

        setMessages(localMessages);
        setUserProfile(userProfile);
    } catch (error) {
        console.error('Error loading messages:', error);
    } finally {
        setReadyChat(true);
        setLoadingChat(false);
    }
  };

  const onSend = async (newMessages: CustomMessage[] = []) => {
    const chatId = selectedChat?.toString();
    if (!chatId || newMessages.length === 0) {
      return;
    }
  
    const lastNewMessage = newMessages[newMessages.length - 1];
  
    const updatedMessages = [...messages, lastNewMessage];
    setMessages(updatedMessages);
  
    const messageToSend = {
      ...lastNewMessage,
      user: {
        _id: userId,
        name: userEmail, // Assuming the user's name is the email
      },
    };
  
    try {
      await fetch(`${API_URL}/api/chat/${userId}/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageToSend),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setShouldFetchChats(true);
      if (socketRef.current) {
        socketRef.current.emit('newMessage', { senderId: userId, recipientId: selectedChat });
      }
    }
  };
  

  const handleUnmatch = async (userId2: string) => {
    try {
      const response = await fetch(`${API_URL}/api/unmatch/${userId}/${userId2}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to unmatch user');
      }
    } catch (error) {
      console.error('Error unmatching:', error);
    } finally{
      if (socketRef.current) {
        setSelectedChat(null);
        fetchChats();
        socketRef.current.emit('updateChats', { theUserId1: userId, theUserId2: userId2, func: "1" });
      }
    }
  };

  const handleBlock = async (userId2: string) => {
    try {
      const response = await fetch(`${API_URL}/api/block/${userId}/${userId2}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to unmatch user');
      }
    } catch (error) {
      console.error('Error unmatching:', error);
    } finally{
      setSelectedChat(null);
      fetchChats();
      if (socketRef.current) {
        socketRef.current.emit('updateChats', { theUserId1: userId, theUserId2: userId2, func: "1" });
      }
    }
  };

  const showReportDialog = (userId2: string) => {
    Alert.alert(
      'Report User',
      'Please select a reason for reporting this user:',
      [
        { text: 'Inappropriate Content', onPress: () => handleReport(userId2, 'inappropriate content') },
        { text: 'Abusive Behavior', onPress: () => handleReport(userId2, 'abusive behavior') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };
  
  const handleReport = async (reportedUserId: string, reason: string) => {
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
        throw new Error('Failed to report user');
      }
  
      // Block the user after reporting
      handleBlock(reportedUserId);
  
      Alert.alert('Report submitted', 'Thank you for your feedback.');
    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('Report failed', 'There was an issue submitting your report.');
    }
  };

  const scrollToBottomComponent = () => {
      return (
          <FontAwesome name="angle-double-down" size={24} color="#333" />
      )
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
                  color="#2e64e5"
                  />
              </View>
          </Send>
      );
  };

  const renderChats = ({ item }: { item: { name: string; picture?: string; _id: string, firstMessage: string } }) => (
    <TouchableOpacity onPress={() => onChatSelect(item._id)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, marginVertical: 5 }}>
        <Image
          source={{ uri: userFirstImageBlobs[item._id] || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
        />
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'black' }}>{item.name}</Text>
          <Text numberOfLines={2} style={{ fontSize: 14, color: 'black', marginTop: 5 }}>
            {item.firstMessage ? (item.firstMessage.length > 100 ? item.firstMessage.slice(0, 100) + '...' : item.firstMessage) : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = (props: MessageProps<IMessage>) => {
    const { currentMessage, nextMessage, ...originalProps } = props;

    if (!currentMessage) {
        return null;
    }

    const user = currentMessage.user;

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

    return (
        <View>
            {isNewDay && (
                <Text style={{ textAlign: 'center', fontSize: 12, marginBottom: 10 }}>
                    {createdAtDate.toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, paddingHorizontal: 10 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: originalProps.position === 'right' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                        <View style={{ maxWidth: '80%' }}>
                            <View style={{ backgroundColor: originalProps.position === 'right' ? 'lightblue' : 'lightgreen', borderRadius: 10, padding: 10 }}>
                                <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black' }}>{currentMessage.text}</Text>
                                <Text style={{ color: originalProps.position === 'right' ? 'white' : 'black', fontSize: 10 }}>{messageTime}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
  };
  const renderChatScreen = () => {
    if (selectedChat !== null && readyChat ) {
      return (
        <View style={{ flex: 1 , backgroundColor: '#FFF8E1'}}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: 15 }}>
            <TouchableOpacity
              onPress={() => { setMessages([]); setReadyChat(false); setSelectedChat(null); setUserProfile(null); if (shouldFetchChats) {
                fetchChats(); setShouldFetchChats(false)} }}
              style={{
                backgroundColor: '#888888',
                borderRadius: 5,
                paddingVertical: 8,
                paddingHorizontal: 14,
                opacity: modal2Loading ? 0.5 : 1,
              }}
              disabled={modal2Loading}
            >
              <Text style={{ color: 'black', fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
            <View style={{ position: 'absolute', top: 7, left: '50%', marginLeft: -10 }}>
              <TouchableOpacity onPress={() => {setmodal2Visible(true); setModal2Loading(true)}}>
                {userProfile && (
                  <Image
                    source={{ uri: userFirstImageBlobs[userProfile.id] || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
                    style={{ width: 50, height: 50, borderRadius: 50 }}
                  />
                )}
              </TouchableOpacity>
            </View>
            <View style={{ position: 'absolute', top: 15, right: '1.5%' }}>
              <TouchableOpacity onPress={() => setmodal1Visible(true)} style={[styles.manageButton, { opacity: modal2Loading ? 0.5 : 1 }]} disabled={modal2Loading}>
                <MaterialCommunityIcons name="cog" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modal1Visible}
              onRequestClose={() => setmodal1Visible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContentManage}>
                  <Text style={styles.modalTitle}>Manage User</Text>
                  <TouchableOpacity onPress={() => { setMessages([]); setReadyChat(false); setSelectedChat(null); setUserProfile(null); handleUnmatch(selectedChat.toString()); setmodal1Visible(false); }} style={styles.unmatchButton}>
                    <Text style={styles.actionButtonText}>Unmatch</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setMessages([]); setReadyChat(false); setSelectedChat(null); setUserProfile(null); handleBlock(selectedChat.toString()); setmodal1Visible(false); }} style={styles.blockButton}>
                    <Text style={styles.actionButtonText}>Block</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => showReportDialog(selectedChat.toString())} style={styles.reportButton}>
                    <Text style={styles.actionButtonText}>Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setmodal1Visible(false)} style={styles.cancelButton}>
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modal2Visible}
              onRequestClose={() => setmodal2Visible(false)}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalContent}>
                  <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>{userProfile.name}, {calculateAgeFromDOB(userProfile.dob) || ''}</Text>
                    <View style={{ alignItems: 'center' }}>
                      {/* Display the first picture */}
                      {userProfile.pictures && userProfile.pictures.length > 0 && (
                        <Image
                          source={{ uri: userProfile.pictures[0] }}
                          style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                        />
                      )}
                      {/* Display the bio */}
                      <Text style={{ fontSize: 14, marginTop: 10, textAlign: 'center' }}>{userProfile.bio}</Text>
                      {/* Display the rest of the pictures */}
                      {userProfile.pictures && userProfile.pictures.slice(1).map((url: string, index: number) => (
                        <Image
                          key={index}
                          source={{ uri: url }}
                          style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                        />
                      ))}
                    </View>
                  </ScrollView>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => {setModal2Loading(false); setmodal2Visible(false)}} style={styles.cancelButtonProfile}>
                      <Text style={styles.actionButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
          <GiftedChat
            loadEarlier={true}
            onLoadEarlier={loadEarlierMessages}
            scrollToBottom
            scrollToBottomComponent={scrollToBottomComponent}
            alwaysShowSend
            renderSend={renderSend}
            messages={messages}
            onSend={(newMessages) => onSend(newMessages)}
            user={{ _id: userId || '' }}
            renderAvatar={(props) => {
              if (props.currentMessage?.user?._id === userId) {
                return null;
              } else {
                return (
                  <TouchableOpacity onPress={() => setmodal2Visible(true)}>
                    <View style={styles.avatarContainer}>
                      <Image
                        style={styles.avatar}
                        source={{ uri: userFirstImageBlobs[userProfile.id] || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              }
            }}
            renderMessage={renderMessage}
            inverted = {false}
          />
        </View>
      );
    } else if (chats.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E4D2B', padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
            You have no matches yet. {'\n'}Keep swiping to find your match!
          </Text>
        </View>
      );
    } else {
      return (
        <FlatList
          data={chats}
          renderItem={renderChats}
          keyExtractor={(item) => item._id.toString()}
          style={{ backgroundColor: '#1E4D2B' }}
          ListHeaderComponent={() => <View style={{ height: 1, backgroundColor: 'black' }} />}
          ListFooterComponent={() => <View style={{ height: 1, backgroundColor: 'black' }} />}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'black' }} />}
        />
      );
    }
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20
    },
    modalContentManage: {
      backgroundColor: '#FFDAB9',
      padding: 20,
      borderRadius: 10,
      width: '80%',
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
    modalTitle: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: -15,
    },
    manageButton: {
      backgroundColor: '#ff6090',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 25,
      marginRight: 10,
    },
    manageButtonText: {
      color: 'black',
      fontSize: 16,
    },
    unmatchButton: {
      backgroundColor: '#FFFACD',
      padding: 10,
      borderRadius: 50,
      marginTop: 10,
    },
    blockButton: {
      backgroundColor: '#FFA07A',
      padding: 10,
      borderRadius: 50,
      marginTop: 10,
    },
    reportButton: {
      backgroundColor: '#FF6F61',
      padding: 10,
      borderRadius: 50,
      marginTop: 10,
    },
    cancelButton: {
      backgroundColor: '#888888',
      padding: 10,
      borderRadius: 50,
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
  });

  return (
    <View style={{ flex: 1 }}>
      {initialRender ? (
        renderChatScreen()
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E4D2B' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};


export default TabTwoScreen;

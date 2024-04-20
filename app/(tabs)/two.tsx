import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, TouchableOpacity, Text, View, Image, Button, Modal, StyleSheet, ImageBackground } from 'react-native';
import { GiftedChat, IMessage, User, Send } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


interface CustomMessage extends IMessage {
  user: User;
}

const TabTwoScreen = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chats, setChats] = useState<{ name: string; profileImageUri?: string; _id: string }[]>([]);
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [readyChat, setReadyChat] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);

  const [modal1Visible, setmodal1Visible] = useState(false);
  const [modal2Visible, setmodal2Visible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const navigation = useNavigation();


  const userId = 2;

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        await fetchUserData();
        await fetchChats();
      };
      fetchData();
    }, [userId])
  );

  const fetchUserData = async () => {
    try {
      const response = await fetch(`http://192.168.1.17:3000/api/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await response.json();
      setUserName(userData.name);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const loadEarlierMessages = async () => {
    try {
      const response = await fetch(`http://192.168.1.17:3000/api/chat/${userId}/${selectedChat}?limit=20&offset=${messages.length}`);
      if (!response.ok) {
        throw new Error('Failed to fetch earlier messages');
      }
      const { messages: earlierMessages } = await response.json();
  
      // Update state with the newly loaded messages
      setMessages(previousMessages => earlierMessages.concat(previousMessages));
    } catch (error) {
      console.error('Error loading earlier messages:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(`http://192.168.1.17:3000/api/chats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat users');
      }
      const chatUsers = await response.json();
      console.log("chatUsers:", chatUsers);
      setChats(chatUsers.reverse());
    } catch (error) {
      console.error('Error fetching chat users:', error);
    }
  };

  const onChatSelect = async (chatId: number) => {
    setSelectedChat(chatId);
  
    try {
      const response = await fetch(`http://192.168.1.17:3000/api/chat/${userId}/${chatId}`);
  
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
  
      const {messages, userProfile} = await response.json();
      setMessages(messages);
      setUserProfile(userProfile);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
    finally {
      setReadyChat(true);
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
    
    try {
      const response = await fetch(`http://192.168.1.17:3000/api/chat/${userId}/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lastNewMessage),
      });
      if (response.ok){
        fetchChats();
      }
      else {
        throw new Error('Failed post');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUnmatch = async (userId2: string) => {
    try {
      const response = await fetch(`http://192.168.1.17:3000/api/unmatch/${userId}/${userId2}`, {
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
      fetchChats();
    }
  };

  const handleBlock = async (userId2: string) => {
    try {
      const response = await fetch(`http://192.168.1.17:3000/api/block/${userId}/${userId2}`, {
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
      fetchChats();
    }
  };
  const scrollToBottomComponent = () => {
      return (
          <FontAwesome name="angle-double-down" size={24} color="#333" />
      )
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
                  color="#2e64e5"
                  />
              </View>
          </Send>
      );
  };

  const renderChats = ({ item }: { item: { name: string; profileImageUri?: string; _id: string, firstMessage: string } }) => (
    <TouchableOpacity onPress={() => onChatSelect(Number(item._id))}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#888888' }}>
        <Image
          source={{ uri: item.profileImageUri || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'black' }}>{item.name}</Text>
        <Text numberOfLines={2} style={{ fontSize: 14, color: '#555', marginLeft: 10, marginTop: 5, flexShrink: 1 }}>
          {item.firstMessage ? (item.firstMessage.length > 100 ? item.firstMessage.slice(0, 100) + '...' : item.firstMessage) : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderChatScreen = () => {
    if (selectedChat !== null && readyChat ) {
      return (
        <View style={{ flex: 1 , backgroundColor: '#FFF8E1'}}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: 15 }}>
            <TouchableOpacity
              onPress={() => { setMessages([]); setReadyChat(false); setSelectedChat(null); setUserProfile(null); }}
              style={{
                backgroundColor: '#888888',
                borderRadius: 5,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }}
            >
              <Text style={{ color: 'black', fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
            <View style={{ position: 'absolute', top: 7, left: '50%', marginLeft: -10 }}>
              <TouchableOpacity onPress={() => setmodal2Visible(true)}>
                {userProfile && (
                  <Image
                    source={{ uri: userProfile.profileImageUris[0] || 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image' }}
                    style={{ width: 50, height: 50, borderRadius: 50 }}
                  />
                )}
              </TouchableOpacity>
            </View>
            <View style={{ position: 'absolute', top: 15, right: '1.5%' }}>
              <TouchableOpacity onPress={() => setmodal1Visible(true)} style={styles.manageButton}>
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
                    <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>{userProfile.name}, {userProfile.age}</Text>
                    {/* Render the first profile image */}
                    <View style={{ alignItems: 'center' }}>
                    {userProfile.profileImageUris.length > 0 && (
                      <Image
                        key={userProfile.profileImageUris[0]}
                        source={{ uri: userProfile.profileImageUris[0] }}
                        style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                      />
                    )}
                    </View>
                    {/* Render the bio after the first picture */}
                    <Text style={{ fontSize: 14, marginTop: 10, textAlign: 'center' }}>{userProfile.bio}</Text>
                    {/* Render additional profile pictures */}
                    <View style={{ alignItems: 'center' }}>
                      {userProfile.profileImageUris.slice(1).map((uri: string, index: number) => (
                        <Image
                          key={uri}
                          source={{ uri }}
                          style={{ width: 250, height: 250, borderRadius: 25, marginTop: 10 }}
                        />
                      ))}
                    </View>
                  </ScrollView>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => setmodal2Visible(false)} style={styles.cancelButtonProfile}>
                      <Text style={styles.actionButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
          <GiftedChat
            //listViewProps={{ref: scrollViewRef, onContentSizeChange: () => scrollToBottom(),}}
            loadEarlier={true}
            onLoadEarlier={loadEarlierMessages}
            scrollToBottom
            scrollToBottomComponent={scrollToBottomComponent}
            alwaysShowSend
            renderSend={renderSend}
            messages={messages}
            onSend={(newMessages) => onSend(newMessages)}
            user={{ _id: userId}}
            renderAvatar={(props) => {
              if (props.currentMessage?.user?._id === userId) {
                return null;
              } else {
                // Render profile picture
                return (
                  <TouchableOpacity onPress={() => setmodal2Visible(true)}>
                    <View style={styles.avatarContainer}>
                      <Image
                        style={styles.avatar}
                        source={{
                          uri: userProfile && userProfile.profileImageUris.length > 0
                            ? userProfile.profileImageUris[0]
                            : 'https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=No+Image'
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              }
            }}
            
            inverted = {false}
          />
        </View>
      );
    } else {
      return (
        <FlatList
          data={chats}
          renderItem={renderChats}
          keyExtractor={(item) => item._id.toString()}
          style={{ backgroundColor: '#FFF8E1' }}
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
      borderRadius: 5,
      marginTop: 10,
    },
    blockButton: {
      backgroundColor: '#FF6F61',
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
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
  });

  return <View style={{ flex: 1 }}>{renderChatScreen()}</View>;
};


export default TabTwoScreen;

import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, TouchableOpacity, Text, View, Image, Button, Modal, StyleSheet } from 'react-native';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook
import { ScrollView } from 'react-native';


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

  const navigation = useNavigation();

  const userId = 1;
  

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
      const response = await fetch(`http://192.168.1.22:3000/api/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await response.json();
      setUserName(userData.name);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(`http://192.168.1.22:3000/api/chats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat users');
      }
      const chatUsers = await response.json();
      setChats(chatUsers.reverse());
    } catch (error) {
      console.error('Error fetching chat users:', error);
    }
  };

  const onChatSelect = async (chatId: number) => {
    setSelectedChat(chatId);
  
    try {
      const response = await fetch(`http://192.168.1.22:3000/api/chat/${userId}/${chatId}`);
  
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
  
      const {messages, userProfile} = await response.json();
      setMessages(messages);
      setUserProfile(userProfile);
      console.log('messages:', messages);
      console.log("userProfile:", userProfile);
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
      const response = await fetch(`http://192.168.1.22:3000/api/chat/${userId}/${chatId}`, {
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
      const response = await fetch(`http://192.168.1.22:3000/api/unmatch/${userId}/${userId2}`, {
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
      const response = await fetch(`http://192.168.1.22:3000/api/block/${userId}/${userId2}`, {
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

  const renderChats = ({ item }: { item: { name: string; profileImageUri?: string; _id: string } }) => (
    <TouchableOpacity onPress={() => onChatSelect(Number(item._id))}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
        {item.profileImageUri && (
          <Image
            source={{ uri: item.profileImageUri }}
            style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
          />
        )}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', flex: 1 }}>{item.name}</Text>
        <TouchableOpacity onPress={() => setmodal1Visible(true)} style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage User</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modal1Visible}
        onRequestClose={() => setmodal1Visible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage User</Text>
            <TouchableOpacity onPress={() => { handleUnmatch(item._id); setmodal1Visible(false); }} style={styles.unmatchButton}>
              <Text style={styles.actionButtonText}>Unmatch</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleBlock(item._id); setmodal1Visible(false); }} style={styles.blockButton}>
              <Text style={styles.actionButtonText}>Block</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setmodal1Visible(false)} style={styles.cancelButton}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );

  const renderChatScreen = () => {
    if (selectedChat !== null && readyChat ) {
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: 15 }}>
            <TouchableOpacity
              onPress={() => { setMessages([]); setReadyChat(false); setSelectedChat(null); setUserProfile(null); }}
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                marginRight: 10,
              }}
            >
              <Text style={{ color: 'black', fontSize: 14 }}>Back</Text>
            </TouchableOpacity>
            <View style={{ position: 'absolute', top: 7, left: '50%', marginLeft: -10 }}>
              <TouchableOpacity onPress={() => setmodal2Visible(true)}>
                {userProfile && userProfile.profileImageUris.length > 0 && (
                  <Image
                    source={{ uri: userProfile.profileImageUris[0] }}
                    style={{ width: 50, height: 50, borderRadius: 50 }}
                  />
                )}
              </TouchableOpacity>
            </View>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modal2Visible}
              onRequestClose={() => setmodal2Visible(false)}
            >
              <View style={[styles.modalContent, { width: '100%' }]}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <View style={[styles.modalContent, { marginTop: 50, marginBottom: 50, width: '100%' }]}>
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
                    <TouchableOpacity onPress={() => setmodal2Visible(false)} style={styles.cancelButton}>
                      <Text style={styles.actionButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </Modal>
          </View>
          <GiftedChat
            messages={messages}
            onSend={(newMessages) => onSend(newMessages)}
            user={{ _id: userId, name: userName ?? 'DefaultName' }}
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
    modalContent: {
      backgroundColor: '#FFC107',
      padding: 20,
      borderRadius: 10,
      width: '80%',
    },
    modalTitle: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
    },
    manageButton: {
      backgroundColor: '#e91e63',
      padding: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    manageButtonText: {
      color: 'white',
      fontSize: 16,
    },
    unmatchButton: {
      backgroundColor: 'orange',
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
    },
    blockButton: {
      backgroundColor: 'red',
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
    },
    cancelButton: {
      backgroundColor: 'grey',
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 16,
    },
  });

  return <View style={{ flex: 1 }}>{renderChatScreen()}</View>;
};


export default TabTwoScreen;

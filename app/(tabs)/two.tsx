import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, TouchableOpacity, Text, View, Image, Button, Modal, StyleSheet } from 'react-native';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook


interface CustomMessage extends IMessage {
  user: User;
}

const TabTwoScreen = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chats, setChats] = useState<{ name: string; profileImageUri?: string; _id: string }[]>([]);
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [readyChat, setReadyChat] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

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
      // Fetch messages for the selected chat from the backend
      const response = await fetch(`http://192.168.1.22:3000/api/chat/${userId}/${chatId}`);
  
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
  
      const messages = await response.json();
      // Update the state with the fetched messages without reversing
      setMessages(messages);
      console.log('messages:', messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Handle the error, e.g., display a message to the user
    }
    finally {
      setReadyChat(true);
    }
  };

  const onSend = async (newMessages: CustomMessage[] = []) => {
    // Assuming you're using the selectedChat as the chatId
    const chatId = selectedChat?.toString();
    if (!chatId || newMessages.length === 0) {
      // Exit early if chatId is null or there are no new messages
      return;
    }
  
    // Send the last message instead of the first one
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
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage User</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage User</Text>
            <TouchableOpacity onPress={() => { handleUnmatch(item._id); setModalVisible(false); }} style={styles.unmatchButton}>
              <Text style={styles.actionButtonText}>Unmatch</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleBlock(item._id); setModalVisible(false); }} style={styles.blockButton}>
              <Text style={styles.actionButtonText}>Block</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
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
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: 10 }}>
            <TouchableOpacity
              onPress={() => {setMessages([]); setReadyChat(false); setSelectedChat(null)}}
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                marginRight: 10, // Add some right margin for spacing
              }}
            >
              <Text style={{ color: 'black', fontSize: 14 }}>Back</Text>
            </TouchableOpacity>
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      width: '80%', // Adjust the width as needed
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

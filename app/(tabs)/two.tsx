import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, TouchableOpacity, Text, View } from 'react-native';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook


interface CustomMessage extends IMessage {
  user: User;
}

const TabTwoScreen = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chats, setChats] = useState<User[]>([]);
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [readyChat, setReadyChat] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
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
      const response = await fetch(`http://192.168.1.9:3000/api/user/${userId}`);
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
      const response = await fetch(`http://192.168.1.9:3000/api/chats/${userId}`);
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
      const response = await fetch(`http://192.168.1.9:3000/api/chat/${userId}/${chatId}`);
  
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
      const response = await fetch(`http://192.168.1.9:3000/api/chat/${userId}/${chatId}`, {
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

  const renderChats = ({ item }: { item: User }) => (
    <TouchableOpacity onPress={() => onChatSelect(Number(item._id))}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{item.name}</Text>
      </View>
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

  return <View style={{ flex: 1 }}>{renderChatScreen()}</View>;
};


export default TabTwoScreen;

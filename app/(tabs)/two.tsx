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
  const navigation = useNavigation(); // Initialize useNavigation

  const onChatSelect = async (chatId: number) => {
    setSelectedChat(chatId);
 
    try {
      // Fetch messages for the selected chat from the back end
      const response = await fetch(`http://localhost:3000/api/chat/${chatId}`);
     
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
 
      const messages = await response.json();
 
      // Reverse the order of messages before setting them in the state
      const reversedMessages = messages.reverse();
 
      // Log the received messages
      console.log('Received messages:', reversedMessages);
 
      // Update the state with the fetched messages
      setMessages(reversedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Handle the error, e.g., display a message to the user
    }
  };

  /*useEffect(() => {
    // Fetch chat users when the component mounts
    const fetchChats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/chats');
        if (!response.ok) {
          throw new Error('Failed to fetch chat users');
        }
        const chatUsers = await response.json();
        console.log('Fetched chat users:', chatUsers);
        setChats(chatUsers);
      } catch (error) {
        console.error('Error fetching chat users:', error);
        // Handle the error, e.g., display a message to the user
      }
    };
  
    fetchChats();
  }, []);*/

  useFocusEffect(
    React.useCallback(() => {
      const fetchChats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/chats');
        if (!response.ok) {
          throw new Error('Failed to fetch chat users');
        }
        const chatUsers = await response.json();
        console.log('Fetched chat users:', chatUsers);
        setChats(chatUsers);
      } catch (error) {
        console.error('Error fetching chat users:', error);
        // Handle the error, e.g., display a message to the user
      }
      };
      fetchChats();
    }, [])
  );


  const renderChats = ({ item }: { item: User }) => (
    <TouchableOpacity onPress={() => onChatSelect(Number(item._id))}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderChatScreen = () => {
    if (selectedChat !== null) {
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: 10 }}>
            <TouchableOpacity
              onPress={() => setSelectedChat(null)}
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
            user={{ _id: 0, name: 'User 0' }}
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


  const onSend = async (newMessages: CustomMessage[] = []) => {
    // Assuming you're using the selectedChat as the chatId
    const chatId = selectedChat?.toString();
 
    if (!chatId || newMessages.length === 0) {
      // Exit early if chatId is null or there are no new messages
      return;
    }
 
    // Reverse the order of new messages before sending them
    const reversedNewMessages = newMessages.reverse();
 
    // POST the new message to the backend
    try {
      const response = await fetch(`http://localhost:3000/api/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reversedNewMessages[0]), // Assuming only one message is sent at a time
      });
 
      const result = await response.json();
      console.log(result);
 
      // Fetch updated messages after sending a new message
      const updatedMessages = await fetch(`http://localhost:3000/api/chat/${chatId}`);
      const updatedMessagesData = await updatedMessages.json();
 
      // Reverse the order of updated messages before setting them in the state
      const reversedUpdatedMessages = updatedMessagesData.reverse();
 
      setMessages(reversedUpdatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };


  return <View style={{ flex: 1 }}>{renderChatScreen()}</View>;
};


export default TabTwoScreen;

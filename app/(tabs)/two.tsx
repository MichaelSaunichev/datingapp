import React, { useState } from 'react';
import { FlatList, TouchableOpacity, Text, View } from 'react-native';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

interface CustomMessage extends IMessage {
  user: User;
}

const TabTwoScreen = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chats, setChats] = useState<User[]>([
    { _id: 2, name: 'User 2' },
    { _id: 3, name: 'User 3' },
    // Add more users as needed
  ]);

  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const navigation = useNavigation(); // Initialize useNavigation

  const onChatSelect = (chatId: number) => {
    setSelectedChat(chatId);
    // Load messages for the selected chat from your data source
    // For now, let's assume that messages are loaded for demonstration purposes
    const loadedMessages: CustomMessage[] = [
      {
        _id: '1',
        text: `Hello ${chats.find((chat) => chat._id === chatId)?.name}!`,
        createdAt: new Date(),
        user: { _id: 1, name: 'You' },
      },
    ];
    setMessages(loadedMessages);
  };

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
            user={{ _id: 1, name: 'You' }}
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

  const onSend = (newMessages: CustomMessage[] = []) => {
    setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));
  };

  return <View style={{ flex: 1 }}>{renderChatScreen()}</View>;
};

export default TabTwoScreen;
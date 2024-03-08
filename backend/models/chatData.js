const pool = require('../config/database');

const createNewChat = async (participantIds) => {
    try {
      // Insert a new record into the Chats table
      const [chatResult] = await pool.execute('INSERT INTO Chats DEFAULT VALUES');
      const chatId = chatResult.insertId;
  
      // Associate participants with the chat (assuming a junction table UsersChats)
      for (const userId of participantIds) {
        await pool.execute('INSERT INTO UsersChats (userId, chatId) VALUES (?, ?)', [userId, chatId]);
      }
  
      // Create an initial chat message (optional)
      await createChatMessage({
        text: 'Chat started',
        senderId: null, // Optionally set the senderId to indicate system-generated message
        receiverId: null, // Optionally set the receiverId
        chatId,
        isSender: false, // Adjust based on your logic
      });
  
      return chatId; // Return the ID of the newly created chat
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  };

const createChatMessage = async (chatMessage) => {
  try {
    const {
      text,
      senderId,
      receiverId,
      chatId,
      isSender, // A flag indicating whether the message was sent by the user
    } = chatMessage;

    const [result] = await pool.execute(
      'INSERT INTO ChatData (text, senderId, receiverId, chatId, isSender, createdAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [text, senderId, receiverId, chatId, isSender]
    );

    return result.insertId; // Return the ID of the newly created chat message
  } catch (error) {
    console.error('Error creating chat message:', error);
    throw error;
  }
};

const getChatMessagesByChatId = async (chatId) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM ChatData WHERE chatId = ? ORDER BY createdAt ASC',
      [chatId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

// Add other chat data-related methods as needed

module.exports = {
    createNewChat,
    createChatMessage,
    getChatMessagesByChatId,
};
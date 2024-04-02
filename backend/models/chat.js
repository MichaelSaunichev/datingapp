const pool = require('../config/database');

const createChat = async (chatData) => {
  try {
    const [result] = await pool.execute('INSERT INTO Chats (name) VALUES (?)', [chatData.name]);
    return result.insertId; // Return the ID of the newly created chat
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

const getChatsByUserId = async (userId) => {
  try {
    const [rows] = await pool.execute('SELECT Chats.* FROM Chats INNER JOIN ChatData ON Chats.id = ChatData.chatId WHERE ChatData.userId = ?', [userId]);
    return rows;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

// Add other chat-related methods as needed

module.exports = {
    createChat,
    getChatsByUserId,
};
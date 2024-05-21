const db = require('../db');

// Function to add a message to a chat
const addMessage = async (userId, chatUserId, message, initial = false) => {
    try {
      const result = await db.query(
        'INSERT INTO chats (user_id, chat_user_id, message, initial) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, chatUserId, message, initial]
      );
      console.log("the mess", message);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
};

// Function to get messages for a chat
const getMessages = async (userId, chatUserId, limit = 20, offset = 0) => {
    try {
      const result = await db.query(
        `SELECT id, user_id, chat_user_id, message, created_at, initial
         FROM chats
         WHERE (user_id = $1 AND chat_user_id = $2) OR (user_id = $2 AND chat_user_id = $1)
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [userId, chatUserId, limit, offset]
      );
  
      const messages = result.rows.map((msg) => ({
        _id: msg.id,
        text: msg.message,
        createdAt: msg.created_at,
        user: {
          _id: msg.user_id,
          name: msg.user_id,
        },
        initial: msg.initial
      }));
  
      // Reverse the messages to maintain the correct order in the chat
      return messages.reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
};

const deleteChat = async (userId, chatUserId) => {
  try {
    await db.query(
      'DELETE FROM chats WHERE (user_id = $1 AND chat_user_id = $2) OR (user_id = $2 AND chat_user_id = $1)',
      [userId, chatUserId]
    );
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

const getMostRecentMessage = async (userId, chatUserId) => {
    try {
        const result = await db.query(
        `SELECT id, user_id, chat_user_id, message, created_at, initial
            FROM chats
            WHERE (user_id = $1 AND chat_user_id = $2) OR (user_id = $2 AND chat_user_id = $1)
            ORDER BY created_at DESC
            LIMIT 1`,
        [userId, chatUserId]
        );

        const message = result.rows.map((msg) => ({
        _id: msg.id,
        text: msg.message,
        createdAt: msg.created_at,
        user: {
            _id: msg.user_id,
            name: msg.user_id,
        },
        initial: msg.initial
        }));

        return message;
    } catch (error) {
        console.error('Error fetching most recent message:', error);
        throw error;
    }
};

const getChatUsers = async (userId) => {
  try {
    const result = await db.query(
        `SELECT chat_user_id, MAX(created_at) as last_message_time
        FROM (
            SELECT chat_user_id, created_at
            FROM chats
            WHERE user_id = $1
            UNION ALL
            SELECT user_id as chat_user_id, created_at
            FROM chats
            WHERE chat_user_id = $1
        ) AS combined
        GROUP BY chat_user_id
        ORDER BY last_message_time DESC`,
        [userId]
    );
    return result.rows;
    } catch (error) {
    console.error('Error fetching chat users:', error);
    throw error;
    }
};

module.exports = {
    addMessage,
    getMessages,
    deleteChat,
    getChatUsers,
    getMostRecentMessage
};
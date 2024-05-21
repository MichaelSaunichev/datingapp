const db = require('../db');

const addMessage = async (newMessage) => {
  try {

    const { _id, text, createdAt, user } = newMessage;

    const result = await db.query(
      'INSERT INTO global_chat (_id, text, createdAt, "user", isAnonymous) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [_id, text, createdAt, JSON.stringify(user), newMessage.isAnonymous || false]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;  // Re-throw the error to be caught by the route handler
  }
};
const getMessages = async (limit, offset) => {
    try {
      // Fetch the most recent messages first
      const result = await db.query(
        'SELECT _id, text, createdAt, "user", isAnonymous, likes FROM global_chat ORDER BY createdAt DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      const totalResult = await db.query('SELECT COUNT(*) FROM global_chat');
      const total = parseInt(totalResult.rows[0].count);
  
      // Reverse the order of the fetched messages
      const messages = result.rows.map(msg => ({
        _id: msg._id,
        text: msg.text,
        createdAt: msg.createdat,
        user: msg.user, // No need to parse
        isAnonymous: msg.isanonymous,
        likes: msg.likes
      })).reverse();
  
  
      return { messages, total };
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  };

  const updateMessageLikes = async (messageId, userId) => {
    try {
  
      // Fetch the current likes for the message
      const currentLikesResult = await db.query(
        'SELECT likes FROM global_chat WHERE _id = $1',
        [messageId]
      );
  
      if (currentLikesResult.rowCount === 0) {
        throw new Error(`Message with ID ${messageId} not found`);
      }
  
      const currentLikes = currentLikesResult.rows[0].likes || [];
  
      // Ensure userId is a string
      if (Array.isArray(userId)) {
        userId = userId[0];
      }
  
      // Check if the user ID is already in the likes array
      let updatedLikes;
      if (currentLikes.includes(userId)) {
        // Remove the user ID from the likes array
        updatedLikes = currentLikes.filter(id => id !== userId);
      } else {
        // Add the user ID to the likes array
        updatedLikes = [...currentLikes, userId];
      }
  
      // Update the likes array in the database
      const result = await db.query(
        'UPDATE global_chat SET likes = $1 WHERE _id = $2 RETURNING *',
        [updatedLikes, messageId]
      );
  
      return result.rows[0];
    } catch (error) {
      console.error("Error updating likes:", error);
      throw error;  // Re-throw the error to be caught by the route handler
    }
  };

module.exports = {
  addMessage,
  getMessages,
  updateMessageLikes,
};
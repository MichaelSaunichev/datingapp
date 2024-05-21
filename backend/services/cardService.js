const db = require('../db');

// Function to add a card
const addCard = async (userId, cardId, likesYou = 0) => {
  try {
    const result = await db.query(
      'INSERT INTO cards (user_id, card_id, likes_you) VALUES ($1, $2, $3) RETURNING *',
      [userId, cardId, likesYou]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding card:', error);
    throw error;
  }
};

// Function to get cards for a user
const getCardsByUserId = async (userId) => {
  try {
    const result = await db.query('SELECT * FROM cards WHERE user_id = $1', [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching cards by user ID:', error);
    throw error;
  }
};

// Function to update likes
const updateLikes = async (userId, cardId, likesYou) => {
  try {
    const result = await db.query(
      'UPDATE cards SET likes_you = $1 WHERE user_id = $2 AND card_id = $3 RETURNING *',
      [likesYou, userId, cardId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating likes:', error);
    throw error;
  }
};

// Function to delete a card
const deleteCard = async (userId, cardId) => {
  try {
    const result = await db.query('DELETE FROM cards WHERE user_id = $1 AND card_id = $2 RETURNING *', [userId, cardId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
};

// Function to delete all cards for a user
const deleteCardsByUserId = async (userId) => {
  try {
    await db.query('DELETE FROM cards WHERE user_id = $1', [userId]);
  } catch (error) {
    console.error('Error deleting cards by user ID:', error);
    throw error;
  }
};

// Function to check if a card exists
const cardExists = async (userId, cardId) => {
  try {
    const result = await db.query('SELECT * FROM cards WHERE user_id = $1 AND card_id = $2', [userId, cardId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if card exists:', error);
    throw error;
  }
};

module.exports = {
  addCard,
  getCardsByUserId,
  updateLikes,
  deleteCard,
  deleteCardsByUserId,
  cardExists,
};
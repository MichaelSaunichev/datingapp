const pool = require('../config/database');

const createCard = async (cardData) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO Cards (text, longText, imageUrl, likesYou, userId) VALUES (?, ?, ?, ?, ?)',
      [cardData.text, cardData.longText, cardData.imageUrl, cardData.likesYou, cardData.userId]
    );

    return result.insertId; // Return the ID of the newly created card
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
};

const getCardsByUserId = async (userId) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Cards WHERE userId = ?', [userId]);
    return rows;
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
};

// Add other card-related methods as needed

module.exports = {
    createCard,
    getCardsByUserId,
};
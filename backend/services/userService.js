const db = require('../db');

// Function to add a new user to the database
const createUser = async (userData) => {
  try {
    const { id, name, dob, gender, bio, pictures, dating_preferences, account_paused, render_index } = userData;
    const result = await db.query(
      'INSERT INTO users (id, name, dob, gender, bio, pictures, dating_preferences, account_paused, render_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, name, dob, gender, bio, JSON.stringify(pictures), dating_preferences, account_paused, render_index]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Function to get a user by ID from the database
const getUserById = async (userId) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

// Function to get all users from the database
const getAllUsers = async () => {
  try {
    const result = await db.query('SELECT * FROM users');
    return result.rows;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

// Function to update user data in the database
const updateUser = async (userId, updatedData) => {
    try {
      // Start building the update query
      let query = 'UPDATE users SET ';
      let queryParams = [];
      let paramIndex = 1;
  
      // Add fields to the update query dynamically
      for (const key in updatedData) {
        if (updatedData.hasOwnProperty(key) && updatedData[key] !== undefined) {
          query += `${key} = $${paramIndex}, `;
          queryParams.push(key === 'pictures' ? JSON.stringify(updatedData[key]) : updatedData[key]);
          paramIndex++;
        }
      }
  
      // Remove the trailing comma and space
      query = query.slice(0, -2);
      
      // Add the condition to update the specific user
      query += ` WHERE id = $${paramIndex} RETURNING *`;
      queryParams.push(userId);
  
      // Execute the query
      const result = await db.query(query, queryParams);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

// Function to delete a user by ID from the database
const deleteUser = async (userId) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
};
const pool = require('../config/database');

const createUser = async (userData) => {
  try {
    const {
      id,
      name,
      age,
      gender,
      bio,
      profileImageUris,
      datingPreferences,
      minimumAge,
      maximumAge,
      accountPaused,
      notificationsEnabled,
    } = userData;

    const [result] = await pool.execute(
      'INSERT INTO Users (id, name, age, gender, bio, profileImageUris, datingPreferences, minimumAge, maximumAge, accountPaused, notificationsEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        age,
        gender,
        bio,
        JSON.stringify(profileImageUris),
        datingPreferences,
        minimumAge,
        maximumAge,
        accountPaused,
        notificationsEnabled,
      ]
    );

    return result.insertId; // Return the ID of the newly created user
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Users WHERE id = ?', [userId]);
    return rows[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

const updateUserById = async (userId, updatedData) => {
  try {
    const [result] = await pool.execute(
      'UPDATE Users SET name = ?, age = ?, gender = ?, bio = ?, ...otherFields = ? WHERE id = ?',
      [
        updatedData.name,
        updatedData.age,
        updatedData.gender,
        updatedData.bio,
        // ... Add other fields and values as needed
        userId,
      ]
    );

    return result.affectedRows > 0; // Return true if the user was updated
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Add other user-related methods as needed

module.exports = {
    createUser,
    getUserById,
    updateUserById,
};
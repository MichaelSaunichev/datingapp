const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const userFunctions = require('../models/user');
const cardFunctions = require('../models/card');
const chatDataFunctions = require('../models/chatData');
const { render } = require('../app');

const users = [
  { id: '0', name: 'User 0', age: 20, gender: 'Male', bio: 'Description 0', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false, renderIndex: 0 },
  { id: '1', name: 'User 1', age: 21, gender: 'Female', bio: 'Description 1', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: true, renderIndex: 0 },
  { id: '2', name: 'User 2', age: 22, gender: 'Male', bio: 'Description 2', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false, renderIndex: 0 },
  { id: '3', name: 'User 3', age: 23, gender: 'Male', bio: 'Description 3', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: true, notificationsEnabled: false, renderIndex: 0 },
  { id: '4', name: 'User 4', age: 24, gender: 'Female', bio: 'Description 4', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false, renderIndex: 0 },
];

const cardData = {
  '0': [
    { id: '1', likesYou: 0 },
    { id: '2', likesYou: 0 },
    { id: '3', likesYou: 0 },
    { id: '4', likesYou: 0 },
  ],
  '1': [
    { id: '0', likesYou: 0 },
    { id: '2', likesYou: 0 },
    { id: '3', likesYou: 0 },
    { id: '4', likesYou: 0 },
  ],
  '2': [
    { id: '0', likesYou: 0 },
    { id: '1', likesYou: 0 },
    { id: '3', likesYou: 0 },
    { id: '4', likesYou: 0 },
  ],
  '3': [
    { id: '0', likesYou: 0 },
    { id: '1', likesYou: 0 },
    { id: '2', likesYou: 0 },
    { id: '4', likesYou: 0 },
  ],
  '4': [
    { id: '0', likesYou: 0 },
    { id: '1', likesYou: 0 },
    { id: '2', likesYou: 0 },
    { id: '3', likesYou: 0 },
  ],
};

const chatData = {

}

// --------------------------------------------------------------------------------------
// User

// Get user by ID
router.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Update user data
router.post('/api/user/:userId/update', (req, res) => {
  const { userId } = req.params;
  const updatedData = req.body;

  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updatedData };
    res.json(users[userIndex]);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// --------------------------------------------------------------------------------------
// cards

router.delete('/api/cards/:userId/:cardId', (req, res) => {
  const { userId, cardId } = req.params;
  const userIndex = users.findIndex(user => user.id === userId);
  // Check if the user ID exists in cardData
  if (cardData.hasOwnProperty(userId)) {
    // Find the index of the card with the given ID for the specified user
    const indexToRemove = cardData[userId].findIndex(card => card.id === cardId);

    // If the card is found, remove it from the array
    if (indexToRemove !== -1) {
      cardData[userId].splice(indexToRemove, 1);
      if (indexToRemove < users[userIndex].renderIndex) {
        users[userIndex].renderIndex -= 1;
      }
      if (users[userIndex].renderIndex >= cardData[userId].length) {
        users[userIndex].renderIndex = 0;
      }
      res.json({ success: true, message: 'Card removed successfully' });
    } else {
      res.json({ success: false, message: 'Card not found for the specified user ID' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Card data not found for the specified user ID' });
  }
});

router.get('/api/cards', function (req, res, next) {
  const { userId, datingPreferences, minimumAge, maximumAge } = req.query;
  // Retrieve user cards data for the specified user ID
  const userCards = cardData[userId] || [];

  if (userCards.length === 0) {
    return res.json(null); // User has no cards
  }

  let currentIndex = users.find(u => u.id === userId).renderIndex;
  const originalIndex = currentIndex;
  let nextCard = null;

  while (true) {
    const card = userCards[currentIndex];

    const likedUserId = card.id;
    const likedUser = users.find(u => u.id === likedUserId);

    // Check if the liked user matches the specified preferences
    const meetsPreferences =
      (datingPreferences === 'Everyone') ||
      (likedUser.gender === 'Non-binary') ||
      ((datingPreferences === 'Men' && likedUser.gender === 'Male') ||
        (datingPreferences === 'Women' && likedUser.gender === 'Female')) &&
      (likedUser.age >= minimumAge && likedUser.age <= maximumAge) &&
      (likedUser.accountPaused === false);

    if (meetsPreferences) {
      nextCard = {
        id: likedUserId,
        name: likedUser.name,
        bio: likedUser.bio,
        profileImageUris: likedUser.profileImageUris,
        likesYou: card.likesYou,
        accountPaused: likedUser.accountPaused,
        age: likedUser.age,
        gender: likedUser.gender
      };

      // Update the renderIndex property, wrapping around if necessary
      users.find(u => u.id === userId).renderIndex = currentIndex;
      return res.json(nextCard);
    }

    // If the current card doesn't meet preferences, move to the next index
    currentIndex += 1;
    // Wrap the index to 0 if it reaches the end of the array
    if (currentIndex === userCards.length) {
      currentIndex = 0;
    }

    // If completed one loop, return null
    if (currentIndex === originalIndex) {
      return res.json(null);
    }
  }
});

const incrementIndex = (userId) => {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.renderIndex = (user.renderIndex + 1) % cardData[userId].length;
  }
};

router.post('/api/incrementIndex', (req, res) => {
  const { userId } = req.body;

  // Increment the renderIndex
  incrementIndex(userId);

  res.status(200).json({ success: true });
});

router.put('/api/addlike/:userId/:likedUser', (req, res) => {
  const userId = req.params.userId;
  const likedUser = req.params.likedUser;
  console.log("liked", likedUser);

  // Find the user in the likedUser array with the specified userId
  const likedUserData = cardData[likedUser];
  const likedUserIndex = likedUserData.findIndex(user => user.id === userId);

  if (likedUserIndex !== -1) {
    // Update the likesYou property to 1
    likedUserData[likedUserIndex].likesYou = 1;
    res.status(200).json({ message: 'Like added successfully.' });
  } else {
    res.status(404).json({ error: 'User not found in likedUser array.' });
  }
});

// --------------------------------------------------------------------------------------
// chats

// Add chats to both users
router.put('/api/addchat/:userId/:newUserId', (req, res) => {
  const userId = req.params.userId;
  const newUserId = req.params.newUserId;

  if (!chatData.hasOwnProperty(userId)) {
    chatData[userId] = new Map();
  }
  if (!chatData[userId].has(newUserId)) {
    chatData[userId].set(newUserId, []);
  }

  if (!chatData.hasOwnProperty(newUserId)) {
    chatData[newUserId] = new Map();
  }
  if (!chatData[newUserId].has(userId)) {
    chatData[newUserId].set(userId, []);
  }
  res.status(200).send('Users added to chatData');
});

router.get('/api/chats/:userId', function(req, res, next) {
  const userId = req.params.userId;
  const chatUsers = [];

  // Iterate through chatData
  const chatDataForUser = chatData[userId] || [];

  chatDataForUser.forEach((messages, chatId) => {
    // Find the corresponding user in the 'users' array based on the chatId
    const correspondingUser = users.find(user => user.id === chatId);

    // Check if the user is found
    if (correspondingUser) {
      const user = {
        _id: chatId,
        name: correspondingUser.name,
      };
      // Add the chatInfo to the array
      chatUsers.push(user);
    }
  });
  res.json(chatUsers);
});

router.get('/api/chat/:userId/:chatId', function (req, res, next) {
  const userId = req.params.userId;
  const chatId = req.params.chatId;

  chatDataForUser = chatData[userId] || [];
  const messages = chatDataForUser.get(chatId) || [];
  res.json(messages);
});

/* POST a new message to a chat. */
router.post('/api/chat/:userId/:chatId', function (req, res, next) {
  const userId = req.params.userId;
  const chatId = req.params.chatId;
  const newMessage = req.body;

  // Get existing messages for the chat
  const messages1 = chatData[userId].get(chatId) || [];
  // Add the new message
  messages1.push(newMessage);
  // Update the chatData
  chatData[userId].set(chatId, messages1);
  moveChatToTop(userId,chatId);

  const messages2 = chatData[chatId].get(userId) || [];
  // Add the new message
  messages2.push(newMessage);
  // Update the chatData
  chatData[chatId].set(userId, messages2);
  moveChatToTop(chatId,userId);

  res.json({ success: true, message: 'Message added successfully' });
});

function moveChatToTop(userId,chatId) {
  // Get the chat messages from chatData
  const chatMessages = chatData[userId].get(chatId);

  if (chatMessages) {
    // Delete the chat from its current position in chatData
    chatData[userId].delete(chatId);

    // Set the chat back to the top in chatData
    chatData[userId].set(chatId, chatMessages);
  }
}

// --------------------------------------------------------------------------------------

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

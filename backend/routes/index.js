const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const userFunctions = require('../models/user');
const cardFunctions = require('../models/card');
const chatDataFunctions = require('../models/chatData');
const { render } = require('../app');

const globalChat = []

const users = [
  { id: '0', name: 'Sean', age: 20, gender: 'Male', bio: 'Description 0', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false, renderIndex: 0 },
  { id: '1', name: 'Stacy', age: 21, gender: 'Female', bio: 'Description 1', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: true, renderIndex: 0 },
  { id: '2', name: 'Chad', age: 22, gender: 'Male', bio: 'Description 2', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false, renderIndex: 0 },
  { id: '3', name: 'Diego', age: 23, gender: 'Male', bio: 'Description 3', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false, renderIndex: 0 },
  { id: '4', name: 'Emma', age: 24, gender: 'Female', bio: 'Description 4', profileImageUris: [], datingPreferences: 'Everyone', 
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
router.get('/api/uri/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);

  if (user) {
    const { profileImageUris } = user;
    res.json(profileImageUris || []);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

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
    // Find index of the card with the given ID for the specified user
    const indexToRemove = cardData[userId].findIndex(card => card.id === cardId);

    // If the card is found remove it from the array
    if (indexToRemove !== -1) {
      cardData[userId].splice(indexToRemove, 1);

      // Wrap if past the last index
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
  console.log("datingpreference:", datingPreferences);
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

    const checkUserId = card.id;
    const checkUser = users.find(u => u.id === checkUserId);

    const meetsPreferences =
      (
      (datingPreferences === 'Everyone') ||
      (checkUser.gender === 'Non-binary') ||
      ((datingPreferences === 'Men' && checkUser.gender === 'Male') ||
        (datingPreferences === 'Women' && checkUser.gender === 'Female')) 
      ) &&
      (checkUser.age >= minimumAge && checkUser.age <= maximumAge) &&
      (checkUser.accountPaused === false);

    if (meetsPreferences) {
      nextCard = {
        id: checkUserId,
        name: checkUser.name,
        bio: checkUser.bio,
        profileImageUris: checkUser.profileImageUris,
        likesYou: card.likesYou,
        accountPaused: checkUser.accountPaused,
        age: checkUser.age,
        gender: checkUser.gender
      };

      // Update renderIndex
      users.find(u => u.id === userId).renderIndex = currentIndex;
      return res.json(nextCard);
    }

    // If the current card doesn't meet preferences, move to the next index
    currentIndex += 1;
    console.log("index:",currentIndex);
    // Wrap the index to 0 if it reaches the end of the array
    if (currentIndex === userCards.length) {
      currentIndex = 0;
    }

    // If completed one loop, return null
    if (currentIndex === originalIndex) {
      return res.json(nextCard);
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

router.delete('/api/block/:userId1/:userId2', (req, res) => {
  const userId1 = req.params.userId1;
  const userId2 = req.params.userId2;

  // Remove chat data for the first user
  if (chatData.hasOwnProperty(userId1) && chatData[userId1].has(userId2)) {
    chatData[userId1].delete(userId2);
  }

  // Remove chat data for the second user
  if (chatData.hasOwnProperty(userId2) && chatData[userId2].has(userId1)) {
    chatData[userId2].delete(userId1);
  }

  res.status(200).send('Chats removed for both users');
});

function addCard(userId, unmatchedUserId) {
  const userIndex = users.findIndex(user => user.id === userId);
  const renderIndex = userIndex !== -1 ? users[userIndex].renderIndex : -1;

  if (cardData.hasOwnProperty(userId) && !cardData[userId].some(user => user.id === unmatchedUserId)) {
    const userToAdd = { id: unmatchedUserId, likesYou: 0 };
    if (renderIndex !== -1) {
      cardData[userId].splice(renderIndex, 0, userToAdd);
    } else {
      cardData[userId].push(userToAdd);
    }
  }

  if (userIndex !== -1 && cardData.hasOwnProperty(userId) && cardData[userId].length > 1) {
    users[userIndex].renderIndex++;
  }
}

router.delete('/api/unmatch/:userId1/:userId2', (req, res) => {
  const userId1 = req.params.userId1;
  const userId2 = req.params.userId2;

  // Remove chat data for the first user
  if (chatData.hasOwnProperty(userId1) && chatData[userId1].has(userId2)) {
    chatData[userId1].delete(userId2);
  }

  // Remove chat data for the second user
  if (chatData.hasOwnProperty(userId2) && chatData[userId2].has(userId1)) {
    chatData[userId2].delete(userId1);
  }

  // Implement adding back cards for both users

  // Find the renderIndex of userId1 and userId2
  const userIndex1 = users.findIndex(user => user.id === userId1);
  const renderIndex1 = userIndex1 !== -1 ? users[userIndex1].renderIndex : -1;

  const userIndex2 = users.findIndex(user => user.id === userId2);
  const renderIndex2 = userIndex2 !== -1 ? users[userIndex2].renderIndex : -1;

  addCard(userId1, userId2);
  addCard(userId2, userId1);

  res.status(200).send('Chats removed for both users');
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
      let profileImageUri;
      // Check if profile images are available for the user
      if (correspondingUser.profileImageUris && correspondingUser.profileImageUris.length > 0) {
        // If profile images are available, take the first one
        profileImageUri = correspondingUser.profileImageUris[0];
      }
      const user = {
        _id: chatId,
        name: correspondingUser.name,
        profileImageUri: profileImageUri
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
  const userProfile = users.find(user => user.id === chatId);
  res.json({messages, userProfile});
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
// global chat

router.post('/api/globalchat', function (req, res, next) {
  const newMessage = req.body;
  globalChat.push(newMessage);

  res.json({ success: true, message: 'Message added successfully' });
});

router.get('/api/globalchat', function (req, res, next){
  chat = globalChat || [];
  res.json(chat);
});

// --------------------------------------------------------------------------------------

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

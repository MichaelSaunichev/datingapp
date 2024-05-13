const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const userFunctions = require('../models/user');
const cardFunctions = require('../models/card');
const chatDataFunctions = require('../models/chatData');
const { render } = require('../app');

const globalChat = []

const users = [
  { id: 'x@gmail.com', name: 'Sean', dob: '2002-05-16T23:32:00.000Z', gender: 'Male', bio: 'Description 0', pictures: [], datingPreferences: 'Everyone', 
  accountPaused: false, renderIndex: 0 },
  { id: 'y@gmail.com', name: 'Stacy', dob: '2001-05-16T23:32:00.000Z', gender: 'Female', bio: 'Description 1', pictures: [], datingPreferences: 'Everyone', 
  accountPaused: false, renderIndex: 0 },
  { id: 'z@gmail.com', name: 'Chad', dob: '2005-05-16T23:32:00.000Z', gender: 'Male', bio: 'Description 2', pictures: [], datingPreferences: 'Everyone', 
  accountPaused: false, renderIndex: 0 },
  { id: 'a@gmail.com', name: 'Diego', dob: '2003-05-16T23:32:00.000Z', gender: 'Male', bio: 'Description 3', pictures: [], datingPreferences: 'Everyone', 
  accountPaused: false, renderIndex: 0 },
  { id: 'b@gmail.com', name: 'Emma', dob: '2002-05-16T23:32:00.000Z', gender: 'Female', bio: 'Description 4', pictures: [], datingPreferences: 'Everyone', 
  accountPaused: false, renderIndex: 0 },
];

const cardData = {
  'x@gmail.com': [
    { id: 'y@gmail.com', likesYou: 0 },
    { id: 'z@gmail.com', likesYou: 0 },
    { id: 'a@gmail.com', likesYou: 0 },
    { id: 'b@gmail.com', likesYou: 0 },
  ],
  'y@gmail.com': [
    { id: 'x@gmail.com', likesYou: 0 },
    { id: 'z@gmail.com', likesYou: 0 },
    { id: 'a@gmail.com', likesYou: 0 },
    { id: 'b@gmail.com', likesYou: 0 },
  ],
  'z@gmail.com': [
    { id: 'x@gmail.com', likesYou: 0 },
    { id: 'y@gmail.com', likesYou: 0 },
    { id: 'a@gmail.com', likesYou: 0 },
    { id: 'b@gmail.com', likesYou: 0 },
  ],
  'a@gmail.com': [
    { id: 'x@gmail.com', likesYou: 0 },
    { id: 'y@gmail.com', likesYou: 0 },
    { id: 'z@gmail.com', likesYou: 0 },
    { id: 'b@gmail.com', likesYou: 0 },
  ],
  'b@gmail.com': [
    { id: 'x@gmail.com', likesYou: 0 },
    { id: 'y@gmail.com', likesYou: 0 },
    { id: 'z@gmail.com', likesYou: 0 },
    { id: 'a@gmail.com', likesYou: 0 },
  ],
};

const chatData = {

}

// --------------------------------------------------------------------------------------
// User

router.delete('/api/user/delete/:userId', (req, res) => {
  const userId = req.params.userId;
  const index = users.findIndex(user => user.id === userId);
  if (index !== -1) {
    // Remove user from users array
    users.splice(index, 1);

    // Remove user's card data
    delete cardData[userId];


    // Remove user from other users' cardData
    for (const key in cardData) {
      const userIndex = cardData[key].findIndex(card => card.id === userId);
      if (userIndex !== -1) {
        const user = users.find(user => user.id === key);
        if (user && user.renderIndex != null && userIndex < user.renderIndex) {
          user.renderIndex -= 1;
        }
        cardData[key].splice(userIndex, 1);
      }
    }

    // Remove user's chat data
    delete chatData[userId];

    // Remove chat data with the deleted user from other users' chatData
    for (const key in chatData) {
      chatData[key].delete(userId);
    }
    console.log("users", users);
    console.log("carddata", cardData);
    console.log("chatData", chatData);

    res.status(200).json({ message: `User with ID ${userId} deleted successfully.` });
  } else {
    res.status(404).json({ error: `User with ID ${userId} not found.` });
  }
});

router.post('/api/user/create', (req, res) => {
  const { bio, dob, gender, name, pictures, datingPreferences, id } = req.body;

  const newUser = {
    id: id,
    name,
    dob,
    gender,
    bio,
    pictures,
    datingPreferences,
    accountPaused: false,
    renderIndex: 0
  };

  users.push(newUser);

  console.log("users:",users);

  if (!cardData[newUser.id]) {
    cardData[newUser.id] = [];
  }

  users.forEach((user) => {
    if (user.id !== newUser.id) {
      cardData[newUser.id].push({ id: user.id, likesYou: 0 });
    }
  });


  users.forEach((user) => {
    if (user.id !== newUser.id && cardData[user.id]) {
      const renderIndex = user.renderIndex;
      const insertIndex = renderIndex + 1;
      cardData[user.id].splice(insertIndex, 0, { id: newUser.id, likesYou: 0 });
    }
  });

  console.log("cardData:", cardData);

  res.status(201).json(newUser);
});

router.get('/api/uri/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);

  if (user) {
    const { pictures } = user;
    res.json(pictures || []);
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
  console.log("data", updatedData);

  if (userIndex !== -1) {
    // Preserve the existing renderIndex if it exists
    const renderIndex = users[userIndex].renderIndex;
    // Merge updatedData with existing user data
    users[userIndex] = { ...users[userIndex], ...updatedData };
    // Restore the renderIndex if it exists
    if (renderIndex !== undefined) {
      users[userIndex].renderIndex = renderIndex;
    }
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
  const { userId, datingPreferences } = req.query;
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

    if (!card) {
      return res.json(null);
    }

    const checkUserId = card.id;
    const checkUser = users.find(u => u.id === checkUserId);

    const meetsPreferences =
      (datingPreferences === 'Everyone') ||
      (checkUser.gender === 'Non-binary') ||
      ((datingPreferences === 'Men' && checkUser.gender === 'Male') ||
        (datingPreferences === 'Women' && checkUser.gender === 'Female')) 
    if (meetsPreferences) {
      nextCard = {
        id: checkUserId,
        name: checkUser.name,
        bio: checkUser.bio,
        pictures: checkUser.pictures,
        likesYou: card.likesYou,
        accountPaused: checkUser.accountPaused,
        dob: checkUser.dob,
        gender: checkUser.gender
      };

      // Update renderIndex
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
      let picture;
      // Check if profile images are available for the user
      if (correspondingUser.pictures && correspondingUser.pictures.length > 0) {
        // If profile images are available, take the first one
        picture = correspondingUser.pictures[0];
      }
      const firstMessage = messages.length > 0 ? messages[messages.length - 1] : null;

      const user = {
        _id: chatId,
        name: correspondingUser.name,
        picture: picture,
        firstMessage: firstMessage ? firstMessage.text : null,
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
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;

  const chatDataForUser = chatData[userId] || [];
  const messages = chatDataForUser.get(chatId) || [];

  const startIndex = Math.max(messages.length - offset - limit, 0);
  const endIndex = Math.min(messages.length - offset, messages.length);

  const chat = messages.slice(startIndex, endIndex);

  const userProfile = users.find(user => user.id === chatId);

  res.json({ messages: chat, userProfile });
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

router.get('/api/globalchat', function (req, res, next) {
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;

  const startIndex = Math.max(globalChat.length - offset - limit, 0);
  const endIndex = Math.min(globalChat.length - offset, globalChat.length); 

  const chat = globalChat.slice(startIndex, endIndex);

  res.json({ messages: chat, total: globalChat.length });
});

router.post('/api/globalchat/:messageId/like', function(req, res, next) {
  const messageId = req.params.messageId;
  const { likes } = req.body;

  // Find the message by its ID in the global chat array
  const messageIndex = globalChat.findIndex(message => message._id === messageId);

  if (messageIndex !== -1) {
    // Update the likes for the message
    globalChat[messageIndex].likes = likes;

    res.json({ success: true, message: 'Like status updated successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Message not found' });
  }
});

// --------------------------------------------------------------------------------------

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

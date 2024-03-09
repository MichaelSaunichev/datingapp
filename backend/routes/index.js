const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const userFunctions = require('../models/user');
const cardFunctions = require('../models/card');
const chatFunctions = require('../models/chat');
const chatDataFunctions = require('../models/chatData');

//implement chatdata to be accessed by 2 users

//maybe take out cardData and implement likesyou matchedAlready (and more?)
//maybe in one function and then just go through users

const users = [
  { id: '0', name: 'User 0', age: '21', gender: 'male', bio: 'Description 0', profileImageUris: [], datingPreferences: 'Everyone', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false },
  { id: '1', name: 'User 1', age: '22', gender: 'female', bio: 'Description 1', profileImageUris: [], datingPreferences: 'Men', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: true },
  { id: '2', name: 'User 2', age: '23', gender: 'male', bio: 'Description 2', profileImageUris: [], datingPreferences: 'Women', 
  minimumAge: 18, maximumAge: 25, accountPaused: false, notificationsEnabled: false },
];

const cardData = [
  { id: 1, text: 'User 1', longText: 'Description', imageUrl: 'https://example.com/image1.jpg', likesYou: 1 },
  { id: 2, text: 'User 2', longText: 'Description', imageUrl: 'https://example.com/image2.jpg', likesYou: 0 },
  { id: 3, text: 'User 3', longText: 'Description', imageUrl: 'https://example.com/image3.jpg', likesYou: 1 },
  { id: 6, text: 'User 6', longText: 'Description', imageUrl: 'https://example.com/image3.jpg', likesYou: 1 },
];

const chatData = new Map([
  ['5', [
    {
      text: 'Hello there!',
      user: { _id: 5, name: 'User 5' },
      createdAt: new Date(),
      _id: uuid.v4(),
    }
  ]],
  ['4', [
    {
      text: 'Hi!',
      user: { _id: 4, name: 'User 4' },
      createdAt: new Date(),
      _id: uuid.v4(),
    }
  ]],
  ['7', [
  ]],
]);

// --------------------------------------------------------------------------------------
// User

// Get user by ID
router.get('/api/user/:userId', (req, res) => {
  console.log("asd")
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

router.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params;

  // Find the index of the card with the given ID
  const indexToRemove = cardData.findIndex(card => card.id == id);

  // If the card is found, remove it from the array
  if (indexToRemove !== -1) {
    cardData.splice(indexToRemove, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Card not found' });
  }
});

router.get('/api/cards', function(req, res, next) {
  res.json(cardData);
});

// --------------------------------------------------------------------------------------
// chats

// Add user to chat
router.post('/api/addchat', (req, res) => {
  const newUser = req.body;

  // Assuming newUser has an _id field for simplicity
  const userId = String(newUser._id);

  // Check if the chat already exists in chatData
  if (!chatData.has(userId)) {
    chatData.set(userId, []);
  }

  res.json({ message: 'User added to chatData', user: newUser });
});

router.get('/api/chats', function(req, res, next) {
  console.log(chatData);
  const chatUsers = [];
  // Iterate through chatData
  chatData.forEach((messages, chatId) => {
    // Assuming chatId is the user ID for simplicity; adjust accordingly
    const user = { _id: chatId, name: `User ${chatId}` };
    // Add the chatInfo to the array
    chatUsers.push(user);
  });
  res.json(chatUsers);
});

router.get('/api/chat/:chatId', function (req, res, next) {
  const chatId = req.params.chatId;
  const messages = chatData.get(chatId) || [];
  res.json(messages);
});

/* POST a new message to a chat. */
router.post('/api/chat/:chatId', function (req, res, next) {
  const chatId = req.params.chatId;
  const newMessage = req.body;

  // Get existing messages for the chat
  const messages = chatData.get(chatId) || [];

  // Add the new message
  messages.push(newMessage);

  // Update the chatData
  chatData.set(chatId, messages);

  moveChatToTop(chatId);

  // Log the updated chatData structure to the console
  console.log('Updated chatData structure:', chatData);

  res.json({ success: true, message: 'Message added successfully' });
});

function moveChatToTop(chatId) {
  // Get the chat messages from chatData
  const chatMessages = chatData.get(chatId);

  if (chatMessages) {
    // Delete the chat from its current position in chatData
    chatData.delete(chatId);

    // Set the chat back to the top in chatData
    chatData.set(chatId, chatMessages);
  }
}

// --------------------------------------------------------------------------------------

/* GET home page. */
router.get('/', function(req, res, next) {
  // Log the chatData structure to the console
  console.log('Current chatData structure:', chatData);
 
  res.render('index', { title: 'Express' });
});

module.exports = router;

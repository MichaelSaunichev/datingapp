const express = require('express');
const router = express.Router();
const uuid = require('uuid');

const users = [
  { id: '0', name: 'User 0', age: '21', gender: 'male', bio: 'Description 0', profileImageUris: [], datingPreferences: 'Everyone', accountPaused: false, notificationsEnabled: false },
  { id: '1', name: 'User 1', age: '22', gender: 'female', bio: 'Description 1', profileImageUris: [], datingPreferences: 'Men', accountPaused: false, notificationsEnabled: true },
  { id: '2', name: 'User 2', age: '23', gender: 'male', bio: 'Description 2', profileImageUris: [], datingPreferences: 'Women', accountPaused: false, notificationsEnabled: false },
];

const cardData = [
  { id: 1, text: 'User 1', longText: 'Description', imageUrl: 'https://example.com/image1.jpg', likesYou: 1 },
  { id: 2, text: 'User 2', longText: 'Description', imageUrl: 'https://example.com/image2.jpg', likesYou: 1 },
  { id: 3, text: 'User 3', longText: 'Description', imageUrl: 'https://example.com/image3.jpg', likesYou: 1 },
  { id: 6, text: 'User 6', longText: 'Description', imageUrl: 'https://example.com/image3.jpg', likesYou: 1 },
];

const chats = [
  { _id: 4, name: 'User 4' },
  { _id: 5, name: 'User 5' },
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
]);

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

// Add user to chat
router.post('/api/addchat', (req, res) => {
  const newUser = req.body;

  // Add the new user to the beginning of the chats array
  chats.unshift(newUser);

  res.json({ message: 'User added to chats', user: newUser });
});

router.get('/api/chats', function(req, res, next) {
  console.log(chatData)
  res.json(chats);
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

  // Log the updated chatData structure to the console
  console.log('Updated chatData structure:', chatData);

  res.json({ success: true, message: 'Message added successfully' });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  // Log the chatData structure to the console
  console.log('Current chatData structure:', chatData);
 
  res.render('index', { title: 'Express' });
});

module.exports = router;

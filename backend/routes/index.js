const express = require('express');
const router = express.Router();
const uuid = require('uuid'); // Import the uuid library


const chatData = new Map([
  ['1', [
    {
      text: 'Hello there!',
      user: { _id: 1, name: 'User 1' },
      createdAt: new Date(),
      _id: uuid.v4(), // Generate a unique ID for the message
    }
  ]],
  // ... (other chat data)
]);


/* GET home page. */
router.get('/', function(req, res, next) {
  // Log the chatData structure to the console
  console.log('Current chatData structure:', chatData);
 
  res.render('index', { title: 'Express' });
});

router.get('/api/chat/:chatId', function (req, res, next) {
  console.log('get');
  const chatId = req.params.chatId;
  const messages = chatData.get(chatId) || [];
  res.json(messages);
});


/* POST a new message to a chat. */
router.post('/api/chat/:chatId', function (req, res, next) {
  console.log('post');
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


module.exports = router;

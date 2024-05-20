const express = require('express');
const router = express.Router();
const { addMessage, getMessages, updateMessageLikes } = require('../services/globalChatService');
const userService = require('../services/userService');
const { render } = require('../app');

const cardData = {
};

const chatData = {
}

// --------------------------------------------------------------------------------------
// User

// Delete a user
router.delete('/api/user/delete/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const deletedUser = await userService.deleteUser(userId);

    if (deletedUser) {
      // Remove user's card data
      delete cardData[userId];

      // Remove user from other users' cardData
      for (const key in cardData) {
        const userIndex = cardData[key].findIndex(card => card.id === userId);
        if (userIndex !== -1) {
          const user = await userService.getUserById(key);
          if (user && user.render_index != null && userIndex < user.render_index) {
            user.render_index -= 1;
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

      console.log("carddata", cardData);
      console.log("chatData", chatData);

      res.status(200).json({ message: `User with ID ${userId} deleted successfully.` });
    } else {
      res.status(404).json({ error: `User with ID ${userId} not found.` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Create a new user
router.post('/api/user/create', async (req, res) => {
  try {
    const { bio, dob, gender, name, pictures, dating_preferences, id } = req.body;

    const newUser = {
      id,
      name,
      dob,
      gender,
      bio,
      pictures,
      dating_preferences,
      account_paused: false,
      render_index: 0,
    };

    // Add user to the database
    const createdUser = await userService.createUser(newUser);

    console.log("created user:", createdUser);

    // Initialize card data for the new user
    if (!cardData[createdUser.id]) {
      cardData[createdUser.id] = [];
    }

    // Add existing users to the new user's card data
    const users = await userService.getAllUsers(); // Fetch all users from the database
    users.forEach((user) => {
      if (user.id !== createdUser.id) {
        cardData[createdUser.id].push({ id: user.id, likesYou: 0 });
      }
    });

    // Add the new user to existing users' card data
    users.forEach((user) => {
      if (user.id !== createdUser.id && cardData[user.id]) {
        const render_index = user.render_index;
        const insertIndex = render_index + 1;
        cardData[user.id].splice(insertIndex, 0, { id: createdUser.id, likesYou: 0 });
      }
    });

    console.log("cardData:", cardData);

    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Get user by ID
router.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Update user data
router.post('/api/user/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedData = req.body;

    const updatedUser = await userService.updateUser(userId, updatedData);

    if (updatedUser) {
      console.log("upda", updatedUser);
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Get user's pictures by user ID
router.get('/api/uri/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    if (user) {
      const { pictures } = user;
      res.json(pictures || []);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user pictures' });
  }
});

// --------------------------------------------------------------------------------------
// cards

router.delete('/api/cards/:userId/:cardId', async (req, res) => {
  const { userId, cardId } = req.params;
  try {
    const user = await userService.getUserById(userId);
    if (user && cardData.hasOwnProperty(userId)) {
      const indexToRemove = cardData[userId].findIndex(card => card.id === cardId);
      if (indexToRemove !== -1) {
        cardData[userId].splice(indexToRemove, 1);
        if (user.render_index >= cardData[userId].length) {
          user.render_index = 0;
        }
        await userService.updateUser(userId, { render_index: user.render_index });
        res.json({ success: true, message: 'Card removed successfully' });
      } else {
        res.json({ success: false, message: 'Card not found for the specified user ID' });
      }
    } else {
      res.status(404).json({ success: false, message: 'Card data not found for the specified user ID' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting card' });
  }
});

router.get('/api/cards', async (req, res, next) => {
  const { userId, dating_preferences } = req.query;
  try {
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userCards = cardData[userId] || [];
    if (userCards.length === 0) {
      return res.json(null); // User has no cards
    }

    let currentIndex = user.render_index;
    const originalIndex = currentIndex;
    let nextCard = null;

    while (true) {
      console.log(`Checking card at index: ${currentIndex}`);
      const card = userCards[currentIndex];
      if (!card) {
        return res.json(null);
      }

      const checkUserId = card.id;
      const checkUser = await userService.getUserById(checkUserId);
      if (!checkUser) {
        console.log(`User with ID ${checkUserId} not found`);
        currentIndex = (currentIndex + 1) % userCards.length;
        if (currentIndex === originalIndex) {
          return res.json(null);
        }
        continue;
      }

      console.log("da", dating_preferences);

      const meetsPreferences =
        (dating_preferences === 'Everyone') ||
        (checkUser.gender === 'Non-binary') ||
        ((dating_preferences === 'Men' && checkUser.gender === 'Male') ||
          (dating_preferences === 'Women' && checkUser.gender === 'Female'));

      console.log(`User: ${checkUserId}, Meets Preferences: ${meetsPreferences}`);

      if (meetsPreferences) {
        nextCard = {
          id: checkUserId,
          name: checkUser.name,
          bio: checkUser.bio,
          pictures: checkUser.pictures,
          likesYou: card.likesYou,
          account_paused: checkUser.account_paused,
          dob: checkUser.dob,
          gender: checkUser.gender
        };

        // Update render_index
        user.render_index = currentIndex;
        await userService.updateUser(userId, { render_index: user.render_index });
        return res.json(nextCard);
      }

      // If the current card doesn't meet preferences, move to the next index
      currentIndex = (currentIndex + 1) % userCards.length;

      // If completed one loop, return null
      if (currentIndex === originalIndex) {
        return res.json(nextCard);
      }
    }
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Error fetching cards' });
  }
});


const incrementIndex = async (userId) => {
  try {
    const user = await userService.getUserById(userId);
    if (user) {
      user.render_index = (user.render_index + 1) % cardData[userId].length;
      await userService.updateUser(userId, { render_index: user.render_index });
    }
  } catch (error) {
    console.error('Error incrementing render_index:', error);
  }
};

router.post('/api/incrementIndex', async (req, res) => {
  const { userId } = req.body;
  try {
    await incrementIndex(userId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error incrementing render_index' });
  }
});

// Add like to a user
router.put('/api/addlike/:userId/:likedUser', async (req, res) => {
  const { userId, likedUser } = req.params;
  try {
    const likedUserData = cardData[likedUser];
    const likedUserIndex = likedUserData.findIndex(user => user.id === userId);

    if (likedUserIndex !== -1) {
      likedUserData[likedUserIndex].likesYou = 1;
      res.status(200).json({ message: 'Like added successfully.' });
    } else {
      res.status(404).json({ error: 'User not found in likedUser array.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error adding like' });
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

// Unmatch users and handle cards
router.delete('/api/unmatch/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;
  try {
    if (chatData.hasOwnProperty(userId1) && chatData[userId1].has(userId2)) {
      chatData[userId1].delete(userId2);
    }

    if (chatData.hasOwnProperty(userId2) && chatData[userId2].has(userId1)) {
      chatData[userId2].delete(userId1);
    }

    const addCard = async (userId, unmatchedUserId) => {
      const user = await userService.getUserById(userId);
      const render_index = user.render_index;
      if (cardData.hasOwnProperty(userId) && !cardData[userId].some(user => user.id === unmatchedUserId)) {
        const userToAdd = { id: unmatchedUserId, likesYou: 0 };
        if (render_index !== -1) {
          cardData[userId].splice(render_index, 0, userToAdd);
        } else {
          cardData[userId].push(userToAdd);
        }
      }

      if (render_index !== -1 && cardData[userId].length > 1) {
        user.render_index++;
        await userService.updateUser(userId, { render_index: user.render_index });
      }
    };

    await addCard(userId1, userId2);
    await addCard(userId2, userId1);

    res.status(200).send('Chats removed for both users');
  } catch (error) {
    res.status(500).json({ error: 'Error unmatching users' });
  }
});

router.get('/api/chats/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const chatUsers = [];
    const chatDataForUser = chatData[userId] || [];

    for (let [chatId, messages] of chatDataForUser.entries()) {
      const correspondingUser = await userService.getUserById(chatId);

      if (correspondingUser) {
        let picture = correspondingUser.pictures && correspondingUser.pictures.length > 0 ? correspondingUser.pictures[0] : null;
        const firstMessage = messages.length > 0 ? messages[messages.length - 1].text : null;

        chatUsers.push({
          _id: chatId,
          name: correspondingUser.name,
          picture,
          firstMessage
        });
      }
    }
    res.json(chatUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chats' });
  }
});

router.get('/api/chat/:userId/:chatId', async (req, res) => {
  const { userId, chatId } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const chatDataForUser = chatData[userId] || [];
    const messages = chatDataForUser.get(chatId) || [];

    const startIndex = Math.max(messages.length - offset - limit, 0);
    const endIndex = Math.min(messages.length - offset, messages.length);

    const chat = messages.slice(startIndex, endIndex);

    const userProfile = await userService.getUserById(chatId);

    res.json({ messages: chat, userProfile });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat messages' });
  }
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

// Add a new message to the global chat
router.post('/api/globalchat', async (req, res, next) => {
  try {
    const newMessage = req.body;
    console.log("New message createdAt:", newMessage.createdAt); // Log the createdAt value
    const addedMessage = await addMessage(newMessage);
    res.json({ success: true, message: 'Message added successfully', data: addedMessage });
  } catch (error) {
    next(error);
  }
});

// Get messages from the global chat with pagination
router.get('/api/globalchat', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    console.log("Fetching messages with the following parameters:");
    console.log("Limit:", limit);
    console.log("Offset:", offset);
    const { messages, total } = await getMessages(limit, offset);
    console.log("Fetched messages:", messages);
    console.log("Total messages count:", total);
    res.json({ messages, total });
  } catch (error) {
    console.error("Error fetching messages:", error);
    next(error);
  }
});

// Update the like count for a specific message
router.post('/api/globalchat/:messageId/like', async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const { likes } = req.body;
    console.log("liky", likes);
    const updatedMessage = await updateMessageLikes(messageId, likes);
    if (updatedMessage) {
      res.json({ success: true, message: 'Like status updated successfully', data: updatedMessage });
    } else {
      res.status(404).json({ success: false, message: 'Message not found' });
    }
  } catch (error) {
    console.error("Error updating likes:", error);
    next(error);
  }
});



// --------------------------------------------------------------------------------------

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

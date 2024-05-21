const express = require('express');
const router = express.Router();
const { addMessage, getMessages, updateMessageLikes } = require('../services/globalChatService');
const userService = require('../services/userService');
const cardService = require('../services/cardService');
const chatService = require('../services/chatService');
const { render } = require('../app');

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
      await cardService.deleteCardsByUserId(userId);

      // Remove user's chat data
      await chatService.deleteChat(userId);

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

    // Add existing users to the new user's card data
    const users = await userService.getAllUsers(); // Fetch all users from the database
    users.forEach(async (user) => {
      if (user.id !== createdUser.id) {
        await cardService.addCard(createdUser.id, user.id);
        await cardService.addCard(user.id, createdUser.id);
      }
    });

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
    if (user) {
      await cardService.deleteCard(userId, cardId);
      if (user.render_index >= (await cardService.getCardsByUserId(userId)).length) {
        user.render_index = 0;
      }
      await userService.updateUser(userId, { render_index: user.render_index });
      res.json({ success: true, message: 'Card removed successfully' });
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

    const userCards = await cardService.getCardsByUserId(userId);
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

      const checkUserId = card.card_id;
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
          likesYou: card.likes_you,
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
      const userCards = await cardService.getCardsByUserId(userId);
      user.render_index = (user.render_index + 1) % userCards.length;
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
    const likedUserCards = await cardService.getCardsByUserId(likedUser);
    const likedUserCard = likedUserCards.find(card => card.card_id === userId);

    if (likedUserCard) {
      await cardService.updateLikes(likedUser, userId, 1);
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
router.put('/api/addchat/:userId/:newUserId', async (req, res) => {
  const userId = req.params.userId;
  const newUserId = req.params.newUserId;

  try {
    await chatService.addMessage(userId, newUserId, "Chat started", true);
    res.status(200).send('Users added to chatData');
  } catch (error) {
    res.status(500).json({ error: 'Error adding chat' });
  }
});

router.delete('/api/block/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    await chatService.deleteChat(userId1, userId2);
    res.status(200).send('Chats removed for both users');
  } catch (error) {
    res.status(500).json({ error: 'Error removing chats' });
  }
});

// Unmatch users and handle cards
router.delete('/api/unmatch/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;
  try {
    await chatService.deleteChat(userId1, userId2);

    const addCard = async (userId, unmatchedUserId) => {
      const user = await userService.getUserById(userId);
      const render_index = user.render_index;
      if (!await cardService.cardExists(userId, unmatchedUserId)) {
        await cardService.addCard(userId, unmatchedUserId);
      }

      if (render_index !== -1 && (await cardService.getCardsByUserId(userId)).length > 1) {
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
    const chatUserIds = await chatService.getChatUsers(userId);

    for (let { chat_user_id } of chatUserIds) {
      const correspondingUser = await userService.getUserById(chat_user_id);

      if (correspondingUser) {
        let picture = correspondingUser.pictures && correspondingUser.pictures.length > 0 ? correspondingUser.pictures[0] : null;
        // Fetch the most recent message using the new function
        const mostRecentMessage = await chatService.getMostRecentMessage(userId, chat_user_id);

        console.log("the first", mostRecentMessage);

        chatUsers.push({
          _id: chat_user_id,
          name: correspondingUser.name,
          picture,
          firstMessage: mostRecentMessage.length > 0 && !mostRecentMessage[0].initial ? mostRecentMessage[0].text : null // Filter initial message
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
    const messages = await chatService.getMessages(userId, chatId, limit, offset);
    const filteredMessages = messages.filter(message => !message.initial); // Filter out initial message
    const userProfile = await userService.getUserById(chatId);

    res.json({ messages: filteredMessages, userProfile });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat messages' });
  }
});

/* POST a new message to a chat. */
router.post('/api/chat/:userId/:chatId', async (req, res) => {
  const { userId, chatId } = req.params;
  const newMessage = req.body;

  // Log the request body to debug the issue
  console.log('Received new message:', newMessage);

  try {
    if (!newMessage.text) {
      return res.status(400).json({ error: 'Message content is missing' });
    }
    
    await chatService.addMessage(userId, chatId, newMessage.text);
    res.json({ success: true, message: 'Message added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding message' });
  }
});

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

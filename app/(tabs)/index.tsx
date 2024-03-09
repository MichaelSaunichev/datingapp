import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface Card {
  id: number;
  name: string;
  bio: string;
  imageUrl: string;
  likesYou: number;
}

const TabOneScreen = () => {
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      renderCardUI();
    }, [])
  );

  const renderCardUI = async () => {
    try {
      // Fetch card data from the backend
      const response = await fetch(`http://192.168.1.9:3000/api/cards`);
      if (!response.ok) {
        throw new Error('Failed to fetch card data');
      }
  
      const cardData = await response.json();

      // Update the cards state with the fetched data
      setCards(cardData);

    } catch (error) {
      console.error('Error fetching card data:', error);
    }
  };

  const removeCard = async (card: Card) => {
    try {
      const response = await fetch(`http://192.168.1.9:3000/api/cards/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to remove card');
      }
  
      console.log('Card removed successfully');
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  const addChat = async (card: Card) => {
    try {
      // Extract relevant properties from the card
      const { id, name } = card;
  
      // Create an object with id and name properties
      const user = { _id: id, name: name };
  
      const response = await fetch('http://192.168.1.9:3000/api/addchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add user to chats');
      }
  
      console.log('User added to chats:', user);
    } catch (error) {
      console.error('Error adding user to chats:', error);
    }
  };

  const onLike = async () => {
    // Get the current card
    const currentCard = cards[currentIndex];
  
    console.log('Liked:', currentCard);
  
    if (currentCard.likesYou === 1) {
      try {
        addChat(currentCard);
        await removeCard(currentCard).then(() => {
          renderCardUI();
        });
      } catch (error) {
        console.error('Error adding user to chats or removing card:', error);
      }
    } else {
      setCurrentIndex((prevIndex) => (prevIndex + 1));
    }
  };

  const onDislike = async () => {
    const currentCard = cards[currentIndex];
    console.log('Disliked:', currentCard);
    setCurrentIndex((prevIndex) => (prevIndex + 1));
  };

  const renderCard = (card: Card) => (
    <ScrollView contentContainerStyle={styles.cardContainer} nestedScrollEnabled>
      <View style={styles.card}>
        {/* Customize how to display the card data */}
        <Text>{card.name}</Text>
        <Text>{card.bio}</Text>
        {/* ... (other card data) */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: 'grey' }]} onPress={onDislike}>
            <Text style={styles.buttonText}>Dislike</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: 'grey' }]} onPress={onLike}>
            <Text style={styles.buttonText}>Like</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const getRenderedCard = () => {
    if (cards.length === 0) {
      return null;
    }
  
    let validIndex = currentIndex;
    
    // Reset to 0 if index exceeds the length of cards array
    if (validIndex >= cards.length) {
      setCurrentIndex(0);
      validIndex = 0;
    }
  
    const renderedCard = renderCard(cards[validIndex]);
  
    return renderedCard;
  };

  return (
    <View style={styles.container}>
      {getRenderedCard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Take up the whole screen width
  },
  card: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%', // Adjust the width based on your design
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TabOneScreen;
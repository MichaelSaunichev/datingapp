import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';

interface Card {
  id: number;
  text: string;
  imageUrl: string;
  longText: string; // Add a new property for longer text
}

const data: Card[] = [
  { id: 1, text: 'Card 1', imageUrl: 'https://example.com/image1.jpg', longText: 'Long text for Card 1...' },
  { id: 2, text: 'Card 2', imageUrl: 'https://example.com/image2.jpg', longText: 'Long text for Card 2...' },
  { id: 3, text: 'Card 3', imageUrl: 'https://example.com/image3.jpg', longText: 'Long text for Card 3...' },
  // Add more data as needed
];

const TabOneScreen = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>(data);

  const onLike = () => {
    // Handle like event
    console.log('Liked:', cards[currentIndex]);
    showNextCard();
  };

  const onDislike = () => {
    // Handle dislike event
    console.log('Disliked:', cards[currentIndex]);
    showNextCard();
  };

  const showNextCard = () => {
    // Increment the index to show the next card
    setCurrentIndex((prevIndex) => (prevIndex + 1 < cards.length ? prevIndex + 1 : 0));
  };

  const renderCard = (card: Card) => (
    <ScrollView contentContainerStyle={styles.cardContainer} nestedScrollEnabled>
      <View style={styles.card}>
        <Image source={{ uri: card.imageUrl }} style={styles.image} />
        <Text style={styles.cardText}>{card.text}</Text>
        <Text>{card.longText}</Text>
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

  return (
    <View style={styles.container}>
      {renderCard(cards[currentIndex])}
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
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '50%', // Adjust the height based on your design
    borderRadius: 8,
    marginBottom: 10,
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
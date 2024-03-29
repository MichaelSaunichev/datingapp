import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useViewRefSet } from 'react-native-reanimated/lib/typescript/reanimated2/ViewDescriptorsSet';

interface Card {
  id: number;
  name: string;
  bio: string;
  profileImageUris: string[];
  likesYou: number;
  accountPaused: number;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary';
}

type userPreferences = {
  datingPreferences: 'Men' | 'Women' | 'Everyone';
  minimumAge: number;
  maximumAge: number;
}

const TabOneScreen = () => {
  
  const [preferences, setPreferences] = useState<userPreferences | null>(null);
  const [card, setCard] = useState<Card>();
  const [loading, setLoading] = useState<Boolean>(false);

  const userId = '1';

  useFocusEffect(
    React.useCallback(() => {
      fetch(`http://192.168.1.9:3000/api/user/${userId}`)
      .then(response => response.json())
      .then(userData => {
        console.log('User Data:', userData);
        const { datingPreferences, minimumAge, maximumAge } = userData;
        setPreferences({
          datingPreferences: datingPreferences,
          minimumAge: minimumAge,
          maximumAge: maximumAge,
        });
      })
      .catch(error => console.error('Error fetching user data:', error));
    }, [userId])
  );

  useEffect(() => {
    if (preferences){
      renderCardUI();
    }
  }, [preferences]);

  const renderCardUI = async () => {
    if (preferences){
      try {
        const { datingPreferences, minimumAge, maximumAge } = preferences;
        console.log(datingPreferences, minimumAge, maximumAge);
        // Fetch card data from the backend with filtering parameters
        const response = await fetch(`http://192.168.1.9:3000/api/cards?userId=${userId}&datingPreferences=${datingPreferences}&minimumAge=${minimumAge}&maximumAge=${maximumAge}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch card data');
        }
    
        const cardData = await response.json();

        // Update the cards state with the fetched data
        setCard(cardData);

      } catch (error) {
        console.error('Error fetching card data:', error);
      }
    }
  };

  const removeCard = async (card: Card) => {
    try {
      const response = await fetch(`http://192.168.1.9:3000/api/cards/${userId}/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to remove card');
      }

      const responseData = await response.json();
      console.log(responseData.message);
  
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  const addChat = async (userId: string, chatAddId: number) => {
    try {
      const response = await fetch(`http://192.168.1.9:3000/api/addchat/${userId}/${chatAddId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to add user to chats');
      }

    } catch (error) {
      console.error('Error adding user to chats:', error);
    }
  };

  const addLike = async (likedUser: number) => {
    try {
      const response = await fetch(`http://192.168.1.9:3000/api/addlike/${userId}/${likedUser}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to add like');
      }
    } catch (error) {
      console.error('Error adding like:', error);
    }
  };

  const onLike = async () => {
    if (loading){
      console.log("loading");
      return
    }
    const currentCard = card;
    console.log('Liked:', currentCard);
    if (currentCard != undefined){
      if (currentCard.likesYou === 1) {
        try {
          addChat(userId, currentCard.id);
          await removeCard(currentCard).then(() => {
            renderCardUI();
          });
        } catch (error) {
          console.error('Error liked back:', error);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          addLike(currentCard.id);
          await removeCard(currentCard).then(() => {
            renderCardUI();
          });
        } catch (error) {
          console.error('Error not liked back:', error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const onDislike = async () => {
    if (loading) {
      console.log("loading");
      return;
    }
  
    try {
      const currentCard = card;
      console.log('Disliked:', currentCard);
      await fetch('http://192.168.1.9:3000/api/incrementIndex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId }),
      });
      renderCardUI();
    } catch (error) {
      console.error('Error disliking card:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (card: Card | null) => (
    <ScrollView contentContainerStyle={styles.cardContainer} nestedScrollEnabled>
      {card ? (
        <View style={styles.card}>
          {/* Customize how to display the card data */}
          <Text>{card.name}</Text>
          <Text>{card.bio}</Text>
          {/* Render profile images */}
          {/* Scrollable container for profile images */}
          <ScrollView horizontal>
            <View style={styles.imageContainer}>
              {card.profileImageUris.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.profileImage} />
              ))}
            </View>
          </ScrollView>
          {/* ... (other card data) */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: 'grey' }]} onPress={() => { setLoading(true); onDislike(); }}>
              <Text style={styles.buttonText}>Dislike</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: 'grey' }]} onPress={() => { setLoading(true); onLike(); }}>
              <Text style={styles.buttonText}>Like</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text>No more cards</Text>
      )}
    </ScrollView>
  );

  const getRenderedCard = () => {
    if (card === undefined) {
      return null;
    }
    const renderedCard = renderCard(card);
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
  imageContainer: {
    marginTop: 10,
  },
  profileImage: {
    width: 250, // Adjust the size as needed
    height: 250, // Adjust the size as needed
    borderRadius: 8, // Adjust the border radius as needed
    marginVertical: 5, // Adjust the vertical margin as needed
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
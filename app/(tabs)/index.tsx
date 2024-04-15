import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
  const [loadingMatched, setLoadingMatched] = useState<Boolean>(false);
  const [matched, setMatched] = useState<Boolean>(false);

  const userId = '3';

  useFocusEffect(
    React.useCallback(() => {
      setLoading(false);
      setMatched(false);
      fetch(`http://192.168.1.8:3000/api/user/${userId}`)
      .then(response => response.json())
      .then(userData => {
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
    if (loadingMatched){
      console.log("loading Matched");
      return
    }

    if (preferences){
      try {
        const { datingPreferences, minimumAge, maximumAge } = preferences;
        // Fetch card data from the backend with filtering parameters
        const response = await fetch(`http://192.168.1.8:3000/api/cards?userId=${userId}&datingPreferences=${datingPreferences}&minimumAge=${minimumAge}&maximumAge=${maximumAge}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch card data');
        }
    
        const cardData = await response.json();

        // Update the cards state with the fetched data
        setCard(cardData);

      } catch (error) {
        console.error('Error fetching card data:', error);
      } finally{
          setLoadingMatched(false);
          setMatched(false);
        }
    }
  };

  const removeCard = async (card: Card) => {
    try {
      const response = await fetch(`http://192.168.1.8:3000/api/cards/${userId}/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to remove card');
      }
      //const responseData = await response.json();
      //console.log(responseData.message);
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  const addChat = async (userId: string, chatAddId: number) => {
    try {
      const response = await fetch(`http://192.168.1.8:3000/api/addchat/${userId}/${chatAddId}`, {
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
      const response = await fetch(`http://192.168.1.8:3000/api/addlike/${userId}/${likedUser}`, {
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
            setMatched(true);
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
    else{
      setLoading(false);
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
      await fetch('http://192.168.1.8:3000/api/incrementIndex', {
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
    <View style={{ backgroundColor: '#FFF8E1', padding: 20, width: '100%', height: '100%' }}>
      {matched && <Text style={{fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: -10, marginBottom: 10}}>You Matched!</Text>}
      <ScrollView contentContainerStyle={styles.cardContainer} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {card ? (
          <View style={styles.card}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', width:'80%' }}>{card.name}, {card.age}</Text>
            <View style={{ alignItems: 'center' }}>
              {card.profileImageUris.length > 0 && (
                <Image
                  key={card.profileImageUris[0]}
                  source={{ uri: card.profileImageUris[0] }}
                  style={styles.profileImage}
                />
              )}
            </View>
            <Text style={{ fontSize: 14, marginTop: 0, textAlign: 'center', width:'80%' }}>{card.bio}</Text>
            <View style={{ alignItems: 'center' }}>
              {card.profileImageUris.slice(1).map((uri: string, index: number) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={styles.profileImage}
                />
              ))}
            </View>
          </View>
        ) : (
          <Text>No more users</Text>
        )}
      </ScrollView>
      {!matched && card && (
      <View style={styles.buttonContainerChoice}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF6F61' }]} onPress={() => { setLoading(true); onDislike(); }}>
          <FontAwesome name="times" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={() => { setLoading(true); onLike(); }}>
          <FontAwesome name="heart" size={24} color="white" />
        </TouchableOpacity>
      </View>
      )}
      {matched && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#3498db', marginTop: 10 }]} onPress={() => { setLoadingMatched(true); renderCardUI() } }>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    width: '100%',
  },
  profileImage: {
    width: '70%',
    aspectRatio: 1,
    borderRadius: 10,
    marginVertical: 10,
  },
  card: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666666',
    backgroundColor: '#FFDAB9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
    height: '100%',
  },
  buttonContainerChoice: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: -8,
  },
  buttonContainer: {
    width: '100%',
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
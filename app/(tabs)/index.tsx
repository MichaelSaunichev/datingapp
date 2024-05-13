import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRoute } from '@react-navigation/native';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';

interface Card {
  id: number;
  name: string;
  bio: string;
  pictures: string[];
  likesYou: number;
  accountPaused: number;
  dob: string;
  gender: 'Male' | 'Female' | 'Non-binary';
}

type userPreferences = {
  datingPreferences: 'Men' | 'Women' | 'Everyone';
}

const TabOneScreen = () => {
  const route = useRoute();
  const routeParams = route.params as { userEmail: string | undefined };
  const userEmail = routeParams ? routeParams.userEmail : undefined;
  
  const [preferences, setPreferences] = useState<userPreferences | null>(null);
  const [card, setCard] = useState<Card>();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMatched, setLoadingMatched] = useState<boolean>(false);
  const [matched, setMatched] = useState<boolean>(false);

  const socketRef = useRef(null as Socket | null);

  const userId = userEmail;

  useFocusEffect(
    React.useCallback(() => {
      setLoading(false);
      setMatched(false);
  
      const fetchUser = () => {
        fetch(`http://192.168.1.19:3000/api/user/${userId}`)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else if (response.status === 404) {
              console.log("retry");
              setTimeout(fetchUser, 500);
            } else {
              throw new Error('Failed to fetch user data');
            }
          })
          .then(userData => {
            if(userData){
              const { datingPreferences } = userData;
              setPreferences({
                datingPreferences: datingPreferences,
              });
            }
          })
          .catch(error => console.error('Error fetching user data:', error));
      };
  
      fetchUser();
    }, [userId])
  );

  useEffect(() => {
    if (preferences){
      renderCardUI();
    }
  }, [preferences]);

  useEffect(() => {
    const socket = io('http://192.168.1.19:3000');
    socketRef.current = socket;
    
    socket.on('updateTheChats', ({ theUserId1, theUserId2, func }) => {
      if (func == "2"){
        renderCardUI();
      }
    });
  
    return () => {
        socket.disconnect();
    };
  }, []);


  const renderCardUI = async () => {
    if (loadingMatched){
      return
    }
    setLoadingMatched(true);
    if (preferences){
      try {
        const { datingPreferences } = preferences;
        // Fetch card data from the backend with filtering parameters
        const response = await fetch(`http://192.168.1.19:3000/api/cards?userId=${userId}&datingPreferences=${datingPreferences}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch card data');
        }
    
        const cardData = await response.json();

        if (!cardData) {
          setCard(cardData);
        } else{
          const imageUrls = cardData.pictures;
          // Load images
          const images = await Promise.all(imageUrls.map(async (url: string) => {
            const response = await fetch(url);
            const blob = await response.blob();
            return URL.createObjectURL(blob); // Convert blob to object URL
          }));

          // Once all images are loaded, set the card data and images
          setCard({ ...cardData, pictures: images });
        }

      } catch (error) {
        console.error('Error fetching card data:', error);
      } finally{
          setLoadingMatched(false);
          setLoading(false);
          setMatched(false);
        }
    }
  };

  const removeCard = async (card: Card) => {
    try {
      const response = await fetch(`http://192.168.1.19:3000/api/cards/${userId}/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to remove card');
      }
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  const addChat = async (userId: string | undefined, chatAddId: number) => {
    try {
      const response = await fetch(`http://192.168.1.19:3000/api/addchat/${userId}/${chatAddId}`, {
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
      const response = await fetch(`http://192.168.1.19:3000/api/addlike/${userId}/${likedUser}`, {
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
    if (loading || !preferences) {
      return;
    }
    setLoading(true); 
    const { datingPreferences } = preferences;

    const response = await fetch(`http://192.168.1.19:3000/api/cards?userId=${userId}&datingPreferences=${datingPreferences}`);
        
    if (!response.ok) {
      throw new Error('Failed to fetch card data');
    }
    const cardData = await response.json();
    if (cardData != null){
      if (cardData.likesYou === 1) {
        try {
          addChat(userId, cardData.id);
          await removeCard(cardData).then(() => {
            setMatched(true);
            if (socketRef.current) {
              socketRef.current.emit('updateChats', { theUserId1: userId, theUserId2: cardData.id, func: "0" });
            }
          });
        } catch (error) {
          console.error('Error liked back:', error);
        }
      } else {
        try {
          await addLike(cardData.id);
          await removeCard(cardData).then(() => {
            renderCardUI();
          });
        } catch (error) {
          console.error('Error not liked back:', error);
        }
      }
    }
    else{
      console.log("not valid card");
      renderCardUI();
    }
  };

  const onDislike = async () => {
    if (loading || !preferences) {
      return;
    }
    setLoading(true);
    const { datingPreferences } = preferences;
    const response = await fetch(`http://192.168.1.19:3000/api/cards?userId=${userId}&datingPreferences=${datingPreferences}`);
    if (!response.ok) {
      throw new Error('Failed to fetch card data');
    }
    const cardData = await response.json();
    if (cardData != null){
      try {
        await fetch('http://192.168.1.19:3000/api/incrementIndex', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userId }),
        });
        renderCardUI();
      } catch (error) {
        console.error('Error disliking card:', error);
      }
    } else{
      console.log("not valid card");
      renderCardUI();
    }
  };

  const calculateAgeFromDOB = (dob: string): number | null => {
    if (!dob) return null;
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age;
  };

  const renderCard = (card: Card | null) => (
    <View style={{ backgroundColor: '#FFF8E1', padding: 20, width: '100%', height: '100%' }}>
      {matched && <Text style={{fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: -10, marginBottom: 10}}>You Matched!</Text>}
      <ScrollView contentContainerStyle={styles.cardContainer} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {card ? (
          <View style={styles.card}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', width:'80%' }}>{card.name}, {calculateAgeFromDOB(card.dob) || ''}</Text>
            <View style={{ alignItems: 'center' }}>
              {card.pictures.length > 0 && (
                <Image
                  key={card.pictures[0]}
                  source={{ uri: card.pictures[0] }}
                  style={styles.profileImage}
                />
              )}
            </View>
            <Text style={{ fontSize: 14, marginTop: 0, textAlign: 'center', width:'80%' }}>{card.bio}</Text>
            <View style={{ alignItems: 'center' }}>
              {card.pictures.slice(1).map((uri: string, index: number) => (
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
        <TouchableOpacity disabled = {loading} style={[styles.button, { backgroundColor: '#FF6F61', opacity: loading ? 0.5 : 1 }]} onPress={() => { onDislike(); }}>
          <FontAwesome name="times" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50', opacity: loading ? 0.5 : 1 }]} onPress={() => { onLike(); }}>
          <FontAwesome name="heart" size={24} color="white" />
        </TouchableOpacity>
      </View>
      )}
      {matched && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity disabled = {loadingMatched} style={[styles.button, { opacity: loadingMatched ? 0.5 : 1, backgroundColor: '#3498db', marginTop: 10}]} onPress={() => { renderCardUI() } }>
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
      {getRenderedCard() || (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
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
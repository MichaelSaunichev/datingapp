import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

import { useRoute } from '@react-navigation/native';
import 'react-native-reanimated'

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  
  const colorScheme = useColorScheme();
  const route = useRoute();
  const routeParams = route.params as { userEmail: string | undefined };
  const userEmail = routeParams ? routeParams.userEmail : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        initialParams={{ userEmail }}
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <TabBarIcon name="heart" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        initialParams={{ userEmail }}
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
          tabBarHideOnKeyboard: true,
        }}
      />
      <Tabs.Screen
        name="NetworkScreen"
        initialParams={{ userEmail }}
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          tabBarHideOnKeyboard: true,
        }}
        
      />
      <Tabs.Screen
        name="ProfileScreen"
        initialParams={{ userEmail }}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

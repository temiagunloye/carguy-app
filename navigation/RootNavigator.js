// navigation/RootNavigator.js
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import PartDetailScreen from '../screens/PartDetailScreen';
import ShopScreen from '../screens/ShopScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import VehicleInventoryScreen from '../screens/VehicleInventoryScreen';

const Tab = createBottomTabNavigator();
const InventoryStack = createNativeStackNavigator();
const ShopStack = createNativeStackNavigator();

function ProfileScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#050608',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white' }}>Profile (placeholder)</Text>
    </View>
  );
}

function InventoryStackNavigator() {
  return (
    <InventoryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#050608' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <InventoryStack.Screen
        name="InventoryList"
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
      <InventoryStack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ title: '' }}
      />
      <InventoryStack.Screen
        name="VehicleInventory"
        component={VehicleInventoryScreen}
        options={{ title: 'All Items' }}
      />
      <InventoryStack.Screen
        name="PartDetail"
        component={PartDetailScreen}
        options={{ title: '' }}
      />
    </InventoryStack.Navigator>
  );
}

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#050608' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <ShopStack.Screen
        name="ShopMain"
        component={ShopScreen}
        options={{ title: 'Car App' }}
      />
    </ShopStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#050608',
          borderTopColor: '#15161a',
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#777b83',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'HomeTab') iconName = 'home-outline';
          if (route.name === 'InventoryTab') iconName = 'list-outline';
          if (route.name === 'ShopTab') iconName = 'flame-outline';
          if (route.name === 'ProfileTab') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryStackNavigator}
        options={{ title: 'Inventory', headerShown: false }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopStackNavigator}
        options={{ title: 'The Shop', headerShown: false }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

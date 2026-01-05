// src/navigation/RootNavigator.js

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import CarScanCaptureScreen from "../features/carScan/CarScanCaptureScreen";
import CarScanIntroScreen from "../features/carScan/CarScanIntroScreen";
import MainPhotoSelectScreen from "../features/carScan/MainPhotoSelectScreen";
import RenderingProcessingScreen from "../features/rendering/RenderingProcessingScreen";
import AddCarScreen from "../screens/AddCarScreen";
import AddPartScreen from "../screens/AddPartScreen";
import BuildHistoryScreen from "../screens/BuildHistoryScreen";
import CarDetailScreen from "../screens/CarDetailScreen";
import ContactUsScreen from "../screens/ContactUsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HelpCenterScreen from "../screens/HelpCenterScreen";
import HomeScreen from "../screens/HomeScreen";
import InventoryScreen from "../screens/InventoryScreen";
import ModelViewerScreen from "../screens/ModelViewerScreen";
import PartDetailScreen from "../screens/PartDetailScreen";
import PartTryOnScreen from "../screens/PartTryOnScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ShopScreen from "../screens/ShopScreen";
import TermsPrivacyScreen from "../screens/TermsPrivacyScreen";
import TryModsScreen from "../screens/TryModsScreen";
import UpgradeScreen from "../screens/UpgradeScreen";
import UsageStatsScreen from "../screens/UsageStatsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#1a1a1a",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#666666",
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{ title: "Inventory" }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{ title: "The Shop" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="AddCar"
        component={AddCarScreen}
      />
      <Stack.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="BuildHistory"
        component={BuildHistoryScreen}
      />
      <Stack.Screen
        name="AddPart"
        component={AddPartScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="TryMods"
        component={TryModsScreen}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
      />
      <Stack.Screen
        name="ContactUs"
        component={ContactUsScreen}
      />
      <Stack.Screen
        name="TermsPrivacy"
        component={TermsPrivacyScreen}
      />
      <Stack.Screen
        name="UsageStats"
        component={UsageStatsScreen}
      />
      <Stack.Screen
        name="CarDetail"
        component={CarDetailScreen}
      />
      <Stack.Screen
        name="PartDetail"
        component={PartDetailScreen}
      />
      <Stack.Screen
        name="CarScanIntro"
        component={CarScanIntroScreen}
      />
      <Stack.Screen
        name="CarScanCapture"
        component={CarScanCaptureScreen}
      />
      <Stack.Screen
        name="MainPhotoSelect"
        component={MainPhotoSelectScreen}
      />
      <Stack.Screen
        name="RenderingProcessing"
        component={RenderingProcessingScreen}
      />
      <Stack.Screen
        name="ModelViewer"
        component={ModelViewerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PartTryOn"
        component={PartTryOnScreen}
      />
    </Stack.Navigator>
  );
}

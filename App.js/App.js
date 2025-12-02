import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import RootNavigator from './navigation/RootNavigator';

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#050608',
    card: '#050608',
    text: '#ffffff',
    border: '#1b1c1f',
    primary: '#ffffff',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

import React from 'react';
import RootNavigator from '../src/navigation/RootNavigator';
import { CarProvider } from '../src/services/carContext';
import { ThemeProvider } from '../src/services/themeContext';

export default function Index() {
  // Expo Router already provides a NavigationContainer,
  // so we just render our navigator here.
  return (
    <ThemeProvider>
      <CarProvider>
        <RootNavigator />
      </CarProvider>
    </ThemeProvider>
  );
}


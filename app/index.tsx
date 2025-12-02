import React from 'react';
import RootNavigator from '../navigation/RootNavigator';

export default function Index() {
  // Expo Router already provides a NavigationContainer,
  // so we just render our navigator here.
  return <RootNavigator />;
}


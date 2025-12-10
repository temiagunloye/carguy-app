import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { CarProvider } from "./src/services/carContext";

export default function App() {
  return (
    <CarProvider>
      <RootNavigator />
    </CarProvider>
  );
}


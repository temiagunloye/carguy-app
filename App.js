import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { CarProvider } from "./src/services/carContext";
import { ThemeProvider } from "./src/services/themeContext";

export default function App() {
  return (
    <ThemeProvider>
      <CarProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </CarProvider>
    </ThemeProvider>
  );
}


import { NavigationContainer } from "@react-navigation/native";
import { AppModeProvider } from "./src/contexts/AppModeContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { CarProvider } from "./src/services/carContext";
import { ThemeProvider } from "./src/services/themeContext";

export default function App() {
  const linking = {
    prefixes: ["carguy://", "https://carguyapp.com"],
    config: {
      screens: {
        BuildViewer: "build/:buildId",
      },
    },
  };

  return (
    <AppModeProvider>
      <ThemeProvider>
        <CarProvider>
          <NavigationContainer linking={linking}>
            <RootNavigator />
          </NavigationContainer>
        </CarProvider>
      </ThemeProvider>
    </AppModeProvider>
  );
}



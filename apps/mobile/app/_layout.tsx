import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { configureLogger } from 'fe-kit/logger';
import { CardflowProvider } from '../src/context/CardflowContext';

configureLogger({ level: __DEV__ ? 'debug' : 'info' });

export default function RootLayout() {
  return (
    <CardflowProvider>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </CardflowProvider>
  );
}

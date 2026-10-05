import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { configureLogger } from 'fe-kit/logger';

configureLogger({ level: __DEV__ ? 'debug' : 'info' });

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#060a17' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

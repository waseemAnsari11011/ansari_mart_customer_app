import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNotificationHandlers } from './src/services/notificationHandler';
function App() {

  useEffect(() => {
    const unsubscribe =
      setupNotificationHandlers();

    return unsubscribe;
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;

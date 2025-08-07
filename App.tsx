import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {ChatScreen} from './src/screens/ChatScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ChatScreen />
    </>
  );
}

export default App;

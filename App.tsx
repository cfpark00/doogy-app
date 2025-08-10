import React, {useRef, useEffect} from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createStackNavigator, CardStyleInterpolators, TransitionPresets} from '@react-navigation/stack';
import {HomeScreen} from './src/screens/HomeScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {View, ActivityIndicator} from 'react-native';
import {theme} from './src/theme';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/config/toastConfig';

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  MainPage: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  const {session, loading, isOnboarded} = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const hasNavigatedToLogin = useRef(false);

  useEffect(() => {
    if (!loading && navigationRef.current && navigationRef.current.isReady()) {
      if (!session) {
        // User not logged in - show login screen
        if (!hasNavigatedToLogin.current) {
          navigationRef.current.reset({
            index: 1,
            routes: [
              { name: 'MainPage' },
              { name: 'Login' }
            ],
          });
          hasNavigatedToLogin.current = true;
        } else {
          navigationRef.current.navigate('Login');
        }
      } else if (!isOnboarded) {
        // User logged in but not onboarded - show onboarding
        navigationRef.current.navigate('Onboarding');
        hasNavigatedToLogin.current = false;
      } else {
        // User logged in and onboarded - go to main page
        hasNavigatedToLogin.current = false;
        if (navigationRef.current.canGoBack()) {
          navigationRef.current.goBack();
        } else {
          navigationRef.current.navigate('MainPage');
        }
      }
    }
  }, [session, loading, isOnboarded]);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primary}}>
        <ActivityIndicator size="large" color={theme.colors.white} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
        initialRouteName="MainPage">
        <Stack.Screen 
          name="MainPage" 
          component={HomeScreen}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            presentation: 'modal',
            cardStyleInterpolator: ({current, layouts}: any) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-layouts.screen.height, 0],
                      }),
                    },
                  ],
                },
              };
            },
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 500,
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 500,
                },
              },
            },
          }}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            presentation: 'modal',
            cardStyleInterpolator: ({current, layouts}: any) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 400,
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 400,
                },
              },
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <Toast config={toastConfig} position="top" topOffset={60} />
    </AuthProvider>
  );
}

export default App;

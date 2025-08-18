import React, {useRef, useEffect, useState} from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {HomeScreen} from './src/screens/HomeScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {SplashScreen} from './src/screens/SplashScreen';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {View, ActivityIndicator} from 'react-native';
import {theme} from './src/theme';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/config/toastConfig';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Onboarding: undefined;
  MainPage: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  const {session, loading, isOnboarded, onboardingLoading} = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Splash');
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Handle initial app load - splash screen only
  useEffect(() => {
    if (!loading) {
      // Hide splash once we know the auth state
      setShowSplash(false);
    }
  }, [loading]);

  // Handle navigation after splash is hidden - BUT ONLY when we're certain about onboarding status
  useEffect(() => {
    if (!showSplash && isNavigationReady && navigationRef.current && navigationRef.current.isReady()) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      
      if (!session && currentRoute !== 'Login') {
        // User not logged in - show login immediately
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (session && currentRoute === 'Login') {
        // User just logged in - STAY ON LOGIN until we know onboarding status
        // Don't navigate anywhere yet
        return;
      } else if (session && currentRoute !== 'Onboarding' && currentRoute !== 'MainPage') {
        // User is logged in and we're on some other screen - determine where to go
        if (isOnboarded) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'MainPage' }],
          });
        } else {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          });
        }
      }
    }
  }, [session, isOnboarded, showSplash, isNavigationReady]);

  // Separate effect ONLY for navigating after login when onboarding status is known
  useEffect(() => {
    if (session && !showSplash && isNavigationReady && navigationRef.current && !onboardingLoading) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      
      console.log('Navigation effect - current route:', currentRoute, 'isOnboarded:', isOnboarded, 'onboardingLoading:', onboardingLoading);
      
      if (currentRoute === 'Login') {
        // We're on login screen but user is logged in - navigate based on onboarding
        // BUT ONLY if we're not still loading the onboarding status
        console.log('Navigating from login - isOnboarded:', isOnboarded);
        if (isOnboarded) {
          console.log('Going to MainPage');
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'MainPage' }],
          });
        } else {
          console.log('Going to Onboarding');
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          });
        }
      } else if (currentRoute === 'Onboarding' && isOnboarded) {
        // We're on onboarding but user is actually onboarded - go to main page
        console.log('User is onboarded, switching from Onboarding to MainPage');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'MainPage' }],
        });
      }
    }
  }, [session, isOnboarded, onboardingLoading, showSplash, isNavigationReady]);

  if (loading && !showSplash) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primary}}>
        <ActivityIndicator size="large" color={theme.colors.white} />
      </View>
    );
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => setIsNavigationReady(true)}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          cardStyleInterpolator: ({current}: any) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 200,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 200,
              },
            },
          },
        }}
        initialRouteName="Splash">
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
        />
        <Stack.Screen 
          name="MainPage" 
          component={HomeScreen}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
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

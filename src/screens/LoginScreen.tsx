import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import {theme} from '../theme';
import {useAuth} from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';

export function LoginScreen() {
  const {signInWithGoogle} = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      // Check if it's a cancellation or an actual error
      if (error?.message?.includes('User cancelled') || error?.message?.includes('canceled')) {
        Toast.show({
          type: 'info',
          text1: 'Login Cancelled',
          text2: 'Sign in whenever you\'re ready',
          visibilityTime: 3000,
        });
      } else if (error?.message?.includes('No ID token')) {
        Toast.show({
          type: 'info',
          text1: 'Login Cancelled',
          text2: 'Sign in whenever you\'re ready',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Please try again',
          visibilityTime: 3000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/app_icon.png')} 
          style={styles.appIcon}
        />
        <Text style={styles.title}>Welcome to Doogy</Text>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>Track your dog's daily activities</Text>
          <Text style={styles.descriptionText}>Monitor exercise and health goals</Text>
          <Text style={styles.descriptionText}>Manage treats, rewards, and routines</Text>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleGoogleSignIn}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <>
              <Icon name="google" size={20} color={theme.colors.primary} style={styles.googleIcon} />
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  appIcon: {
    width: 125,
    height: 125,
    marginBottom: theme.spacing.xl,
    borderRadius: 25,
  },
  title: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: theme.spacing.xxl * 1.5,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: theme.fontSize.md + 2,
    color: theme.colors.white,
    marginVertical: theme.spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  button: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
    ...theme.shadows.lg,
  },
  googleIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
});
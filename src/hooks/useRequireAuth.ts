import {useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {Alert} from 'react-native';

/**
 * Hook that requires authentication
 * Redirects to onboarding if not authenticated
 * Use this in screens that require auth
 */
export function useRequireAuth() {
  const {session, loading} = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!loading && !session) {
      Alert.alert('Authentication Required', 'Please sign in to continue');
      // Navigation is handled automatically by App.tsx
    }
  }, [session, loading]);

  return {session, loading, isAuthenticated: !!session};
}
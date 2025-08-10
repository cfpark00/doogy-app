import React, {createContext, useContext, useEffect, useState} from 'react';
import {Session, User} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {AppState} from 'react-native';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isOnboarded: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    supabase.auth.getSession().then(async ({data: {session}}) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check onboarding status on initial load
      if (session?.user) {
        await checkOnboardingStatus(session.user.id);
      }
      
      setLoading(false);
    });

    const {data: {subscription}} = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check onboarding status when user changes
        if (session?.user) {
          await checkOnboardingStatus(session.user.id);
        } else {
          setIsOnboarded(false);
        }
      }
    );

    // Auto-refresh tokens when app becomes active
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const {error} = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        
        if (error) {
          throw error;
        }
      } else {
        throw new Error('No ID token present');
      }
    } catch (error: any) {
      // Re-throw the error to be handled by the component
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await supabase.auth.signOut();
      setIsOnboarded(false); // Reset onboarding status on sign out
    } catch (error: any) {
      // Silently handle sign out errors
      console.error('Sign out error:', error);
    }
  };

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const {data, error} = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking onboarding status:', error);
        setIsOnboarded(false);
      } else if (!data) {
        // Profile doesn't exist yet, create it
        const {error: insertError} = await supabase
          .from('profiles')
          .insert({
            id: userId,
            onboarded: false
          });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
        setIsOnboarded(false);
      } else {
        setIsOnboarded(data.onboarded || false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboarded(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const {error} = await supabase
        .from('profiles')
        .update({onboarded: true})
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setIsOnboarded(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{user, session, loading, isOnboarded, signInWithGoogle, signOut, completeOnboarding}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
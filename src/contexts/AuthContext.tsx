import React, {createContext, useContext, useEffect, useState} from 'react';
import {Session, User} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {AppState} from 'react-native';
import {GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID} from '@env';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isOnboarded: boolean;
  onboardingLoading: boolean;
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
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    supabase.auth.getSession().then(async ({data: {session}, error}) => {
      if (error) {
        console.error('Session error:', error);
        // If there's an error getting the session (like invalid refresh token)
        // clear the session and sign out
        if (error.message?.includes('Refresh Token')) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsOnboarded(false);
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check onboarding status on initial load
        if (session?.user) {
          await checkOnboardingStatus(session.user.id);
        }
      }
      
      setLoading(false);
    });

    const {data: {subscription}} = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle refresh token errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, signing out');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsOnboarded(false);
          return;
        }
        
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
    const appStateSubscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        try {
          // Try to refresh the session when app becomes active
          const {data: {session}, error} = await supabase.auth.getSession();
          if (error && error.message?.includes('Refresh Token')) {
            console.log('Refresh token invalid on app resume, signing out');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setIsOnboarded(false);
          }
          supabase.auth.startAutoRefresh();
        } catch (error) {
          console.error('Error refreshing session on app resume:', error);
        }
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
    setOnboardingLoading(true);
    try {
      console.log('Checking onboarding status for user:', userId);
      const {data, error} = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('Onboarding query result:', {data, error});
      
      if (error) {
        console.error('Error checking onboarding status:', error);
        setIsOnboarded(false);
      } else if (!data) {
        console.log('No profile found, creating new profile');
        // Profile doesn't exist yet, create it with user data
        const {error: insertError} = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
            email: user?.email || null,
            avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
            onboarded: false
          });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
        setIsOnboarded(false);
      } else {
        console.log('Setting isOnboarded to:', data.onboarded);
        setIsOnboarded(data.onboarded || false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboarded(false);
    } finally {
      setOnboardingLoading(false);
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
      
      // Important: Update the state immediately so navigation works
      setIsOnboarded(true);
      
      // Re-check onboarding status to ensure consistency
      await checkOnboardingStatus(user.id);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{user, session, loading, isOnboarded, onboardingLoading, signInWithGoogle, signOut, completeOnboarding}}>
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
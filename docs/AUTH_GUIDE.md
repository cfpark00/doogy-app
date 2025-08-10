# Authentication Guide for Developers

## Quick Start
Auth is automatically handled by the AuthContext. Just use the `useAuth` hook:

```jsx
import {useAuth} from '../contexts/AuthContext';

function YourComponent() {
  const {user, session, loading, signOut} = useAuth();
  
  // You now have access to:
  // - user: User object with email, id, etc.
  // - session: Active session (null if not logged in)
  // - loading: true while checking auth state
  // - signOut: Function to log out
}
```

## Common Patterns

### Protected Components
```jsx
function ProtectedFeature() {
  const {session} = useAuth();
  
  if (!session) {
    return <Text>Please log in to access this feature</Text>;
  }
  
  return <YourProtectedContent />;
}
```

### User Info Display
```jsx
function UserProfile() {
  const {user} = useAuth();
  
  return (
    <View>
      <Text>Email: {user?.email}</Text>
      <Text>ID: {user?.id}</Text>
    </View>
  );
}
```

### Loading States
```jsx
function MyScreen() {
  const {loading, session} = useAuth();
  
  if (loading) {
    return <ActivityIndicator />;
  }
  
  return session ? <MainContent /> : <LoginPrompt />;
}
```

## API Calls with Auth
When making API calls, the session token is automatically included:

```jsx
const {session} = useAuth();

// The session.access_token is automatically handled by Supabase
const {data, error} = await supabase
  .from('your_table')
  .select('*');
```

## DO NOT:
- ❌ Import supabase directly for auth operations
- ❌ Store tokens in component state
- ❌ Check AsyncStorage manually
- ❌ Try to refresh tokens manually
- ❌ Create your own auth context

## Navigation Based on Auth
The app automatically handles navigation:
- Logged out → Shows Onboarding screen
- Logged in → Shows Main app

You don't need to navigate manually after login/logout.

## Troubleshooting

### "useAuth must be used within AuthProvider" Error
This means you're trying to use `useAuth` outside the auth context. All components should be inside the App component which provides auth.

### Session is null but user should be logged in
The auth state is loading. Always check the `loading` state first:

```jsx
const {loading, session} = useAuth();

if (loading) return <LoadingScreen />;
if (!session) return <LoginScreen />;
return <MainApp />;
```

## Questions?
Check the AuthContext implementation at: `/src/contexts/AuthContext.tsx`
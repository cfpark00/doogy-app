import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  PanResponder,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {theme} from '../theme';
import {Message} from '../types';
import {MessageBubble} from '../components/MessageBubble';
import {chatService} from '../services/chatService';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import Icon from 'react-native-vector-icons/Feather';

const {height: screenHeight} = Dimensions.get('window');
const MIN_TOP_HEIGHT = 60; // Minimum height for collapsed top section
const MIN_BOTTOM_HEIGHT = 100; // Minimum height for collapsed bottom section

export const HomeScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dogPhoto, setDogPhoto] = useState<string | null>(null);
  const [dogName, setDogName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const drawerAnimation = useRef(new Animated.Value(-350)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const {signOut, user} = useAuth();
  
  // Animation value for the divider position
  const dividerPosition = useRef(new Animated.Value(screenHeight * 0.5)).current;
  
  // Mock data for tasks
  const tasks = [
    {id: 1, completed: true},
    {id: 2, completed: true},
    {id: 3, completed: true},
    {id: 4, completed: true},
    {id: 5, completed: true},
    {id: 6, completed: false},
    {id: 7, completed: false},
    {id: 8, completed: false},
  ];

  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = 63; // Direct percentage value

  // Fetch user profile and dog data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch user profile
        const {data: profileData} = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setUserName(profileData.name || 'Friend');
        }

        // Fetch first dog's data
        const {data: dogData} = await supabase
          .from('dogs')
          .select('name, photo_url')
          .eq('user_id', user.id)
          .order('created_at', {ascending: true})
          .limit(1)
          .single();
        
        if (dogData) {
          setDogName(dogData.name);
          setDogPhoto(dogData.photo_url);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user]);

  // Function to switch to chat mode (expand top section for chat)
  const switchToChatMode = () => {
    Animated.spring(dividerPosition, {
      toValue: screenHeight - MIN_BOTTOM_HEIGHT - 100,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  };

  // Function to switch to dashboard mode (shrink top section, expand bottom)
  const switchToDashboardMode = () => {
    Animated.spring(dividerPosition, {
      toValue: MIN_TOP_HEIGHT + 100,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  };

  // Function to open drawer
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.spring(drawerAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Function to close drawer
  const closeDrawer = () => {
    // All animations synchronized to 250ms
    Animated.parallel([
      Animated.timing(drawerAnimation, {
        toValue: -350,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
    });
  };

  // Handle logout
  const handleLogout = async () => {
    closeDrawer();
    // Wait for drawer animation to complete before signing out
    setTimeout(async () => {
      await signOut();
    }, 300); // Slightly longer than drawer's 250ms animation
  };

  // Get user initials from name or email
  const getUserInitials = () => {
    if (!user) return 'U';
    
    // Try to get from user metadata (name from Google/provider)
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) {
      const names = fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    
    // Fallback to email
    if (user.email) {
      const emailParts = user.email.split('@')[0];
      return emailParts.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User';
  };

  // Get user avatar URL
  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || 
           user.user_metadata?.picture || 
           null;
  };

  // PanResponder for dragging the divider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const currentValue = (dividerPosition as any)._value;
        const newPosition = currentValue + gestureState.dy;
        const constrainedPosition = Math.max(
          MIN_TOP_HEIGHT,
          Math.min(screenHeight - MIN_BOTTOM_HEIGHT - 100, newPosition)
        );
        dividerPosition.setValue(constrainedPosition);
      },
      onPanResponderRelease: () => {
        // Just let it stay where the user dragged it
      },
    })
  ).current;

  const handleSendMessage = async () => {
    if (!searchText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: searchText.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setSearchText('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);
  };

  return (
    <>
      {/* Top SafeAreaView - Golden background for notch/status bar area */}
      <SafeAreaView style={styles.topSafeArea} />
      
      {/* Bottom SafeAreaView - Cream background for content and home indicator */}
      <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Section - Dashboard/Welcome */}
        <TouchableWithoutFeedback onPress={switchToChatMode}>
          <Animated.View 
            style={[
              styles.topSection,
              {
                height: dividerPosition,
              }
            ]}
          >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.topScrollContent}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {dogPhoto ? (
                    <Image source={{uri: dogPhoto}} style={styles.avatarImage} />
                  ) : (
                    <Image 
                      source={require('../assets/images/dog_pic.png')} 
                      style={styles.avatarImage}
                    />
                  )}
                </View>
              </TouchableOpacity>
              
              <View style={styles.menuButton} />
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                {dogName ? `${dogName}'s Day` : 'Welcome!'}
              </Text>
              <Text style={styles.welcomeText}>
                today is perfect day for 20-30 mins of out{'\n'}
                door activity!
              </Text>
              <Text style={styles.questionText}>
                will you give {dogName || 'your dog'} a treat after a good walk?
              </Text>
            </View>
          </ScrollView>
          
          {/* Chat Input at bottom of top section */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="communicate, ask questions and more"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={switchToChatMode}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </TouchableWithoutFeedback>

        {/* Invisible Divider - no visual bar */}
        <View style={styles.dividerContainer} {...panResponder.panHandlers} />

        {/* Bottom Section - Chat/Dashboard */}
        <TouchableWithoutFeedback onPress={switchToDashboardMode}>
          <Animated.View 
            style={[
              styles.bottomSection,
              {
                height: Animated.subtract(screenHeight - 100, dividerPosition),
              }
            ]}
          >
          {/* Chat Messages */}
          <View style={styles.chatSection}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({item}) => <MessageBubble message={item} />}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({animated: true})
              }
              ListEmptyComponent={
                <View style={styles.dashboardContainer}>
                  {/* Dashboard Cards */}
                  <View style={styles.cardsContainer}>
                    {/* Progress Card */}
                    <TouchableOpacity style={styles.card}>
                      <View style={styles.progressCircle}>
                        {/* Just show the percentage text for now */}
                        <View style={styles.progressRing}>
                          <Text style={styles.progressText}>{progressPercentage}%</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* List Card */}
                    <TouchableOpacity style={styles.card}>
                      <View style={styles.listContainer}>
                        <View style={styles.listItem} />
                        <View style={[styles.listItem, styles.listItemShort]} />
                        <View style={[styles.listItem, styles.listItemMedium]} />
                        <View style={styles.listItem} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Tasks Grid */}
                  <View style={styles.tasksCard}>
                    <View style={styles.tasksGrid}>
                      {tasks.map((task) => (
                        <TouchableOpacity key={task.id} style={styles.taskItem}>
                          <View style={[
                            styles.checkbox,
                            task.completed && styles.checkboxCompleted
                          ]}>
                            {task.completed && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              }
            />
          </View>
        </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Slide-out Drawer */}
      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.drawerOverlay, {opacity: overlayOpacity}]}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.drawer,
                  {
                    transform: [{translateX: drawerAnimation}]
                  }
                ]}
              >
                <SafeAreaView style={styles.drawerContent}>
                  {/* Drawer Header */}
                  <View style={styles.drawerHeader}>
                    <View style={styles.drawerHeaderContent}>
                      <View style={styles.drawerAvatar}>
                        {getUserAvatar() ? (
                          <Image source={{uri: getUserAvatar()}} style={styles.drawerAvatarImage} />
                        ) : (
                          <View style={styles.drawerAvatarPlaceholder}>
                            <Text style={styles.drawerAvatarPlaceholderText}>{getUserInitials()}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.drawerUserInfo}>
                        <Text style={styles.drawerTitle}>{getUserDisplayName()}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Drawer Menu Items */}
                  <View style={styles.drawerMenuContainer}>
                    <ScrollView style={styles.drawerMenu}>
                      <TouchableOpacity style={styles.drawerItem} onPress={() => {
                        closeDrawer();
                        console.log('Account pressed');
                      }}>
                        <Icon name="user" size={22} color={theme.colors.textPrimary} style={styles.drawerItemIcon} />
                        <Text style={styles.drawerItemText}>Account</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.drawerItem} onPress={() => {
                        closeDrawer();
                        console.log('Notifications pressed');
                      }}>
                        <Icon name="bell" size={22} color={theme.colors.textPrimary} style={styles.drawerItemIcon} />
                        <Text style={styles.drawerItemText}>Notifications</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.drawerItem} onPress={() => {
                        closeDrawer();
                        console.log('Settings pressed');
                      }}>
                        <Icon name="settings" size={22} color={theme.colors.textPrimary} style={styles.drawerItemIcon} />
                        <Text style={styles.drawerItemText}>Settings</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.drawerItem} onPress={() => {
                        closeDrawer();
                        console.log('Help pressed');
                      }}>
                        <Icon name="help-circle" size={22} color={theme.colors.textPrimary} style={styles.drawerItemIcon} />
                        <Text style={styles.drawerItemText}>Help & Support</Text>
                      </TouchableOpacity>
                    </ScrollView>

                    {/* Logout at bottom */}
                    <View style={styles.drawerBottomSection}>
                      <View style={styles.drawerDivider} />
                      <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
                        <Icon name="log-out" size={22} color={theme.colors.error} style={styles.drawerItemIcon} />
                        <Text style={[styles.drawerItemText, {color: theme.colors.error}]}>Logout</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </SafeAreaView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  // Safe Area Views
  topSafeArea: {
    flex: 0,
    backgroundColor: theme.colors.primary, // Golden for top/notch area
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface, // Cream for content and bottom area
  },
  topSection: {
    backgroundColor: theme.colors.primary,
    overflow: 'visible',
    zIndex: 5,
  },
  topScrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  bottomSection: {
    backgroundColor: theme.colors.surface,
    zIndex: 1,
  },
  dividerContainer: {
    height: 20,
    marginTop: -10,
    marginBottom: -10,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'space-around',
  },
  menuLine: {
    width: '100%',
    height: 3,
    backgroundColor: theme.colors.white,
    borderRadius: 1.5,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  welcomeSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  welcomeTitle: {
    fontSize: 48,
    fontWeight: '300',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  welcomeText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
    lineHeight: 26,
    marginBottom: theme.spacing.lg,
  },
  questionText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
    lineHeight: 26,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    padding: theme.spacing.sm,
  },
  sendButtonText: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  chatSection: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: theme.spacing.md,
  },
  dashboardContainer: {
    padding: theme.spacing.lg,
  },
  cardsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    height: 140,
    ...theme.shadows.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  listContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  listItem: {
    height: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    width: '100%',
  },
  listItemShort: {
    width: '60%',
  },
  listItemMedium: {
    width: '40%',
  },
  tasksCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  tasksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  taskItem: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.secondaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
  },
  // Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    backgroundColor: theme.colors.surface,
    borderTopRightRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  drawerContent: {
    flex: 1,
    overflow: 'hidden',
    borderTopRightRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  drawerHeader: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.xl,
  },
  drawerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerAvatar: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  drawerAvatarImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    resizeMode: 'cover',
  },
  drawerAvatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarPlaceholderText: {
    fontSize: 20,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  drawerMenuContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  drawerMenu: {
    flex: 1,
    paddingTop: theme.spacing.md,
  },
  drawerBottomSection: {
    paddingBottom: theme.spacing.lg,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.lg,
  },
  drawerItemIcon: {
    width: 24,
    marginRight: theme.spacing.md,
  },
  drawerItemText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
  },
});
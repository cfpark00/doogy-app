import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '../theme';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import Icon from 'react-native-vector-icons/Feather';

type DogOwnershipStatus = 'owner' | 'looking' | 'none';

interface DogData {
  name: string;
  breed: string;
  age: string;
  weight: string;
  trainingLevel: string;
}

export function OnboardingScreen() {
  const {completeOnboarding, signOut, user} = useAuth();
  const insets = useSafeAreaInsets();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(0);
  const [ownershipStatus, setOwnershipStatus] = useState<DogOwnershipStatus | null>(null);
  const [dogCount, setDogCount] = useState<number | null>(null);
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  const [dogsData, setDogsData] = useState<DogData[]>([{
    name: '',
    breed: '',
    age: '',
    weight: '',
    trainingLevel: 'beginner',
  }]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate total steps based on ownership status
  const getTotalSteps = () => {
    if (ownershipStatus === 'owner' && dogCount) {
      // 1 (ownership) + 1 (count) + (5 steps per dog * number of dogs)
      return 2 + (5 * dogCount);
    } else if (ownershipStatus === 'looking') {
      return 2; // Just ownership + looking confirmation
    } else if (ownershipStatus === 'none') {
      return 1; // Just ownership
    }
    return 1; // Default to first step
  };

  const trainingLevels = [
    {id: 'beginner', label: 'Beginner', desc: 'Just starting with basic commands'},
    {id: 'intermediate', label: 'Intermediate', desc: 'Knows sit, stay, come'},
    {id: 'advanced', label: 'Advanced', desc: 'Follows complex commands'},
    {id: 'expert', label: 'Expert', desc: 'Professional training level'},
  ];

  const handleNext = () => {
    // Validation for each step type
    if (currentStep === 0 && !ownershipStatus) {
      Alert.alert('Required', 'Please select an option to continue.');
      return;
    }
    
    if (currentStep === 1 && ownershipStatus === 'owner' && !dogCount) {
      Alert.alert('Required', 'Please enter the number of dogs you have.');
      return;
    }

    // Validate dog data fields
    if (ownershipStatus === 'owner' && dogCount && currentStep >= 2) {
      const dogStepIndex = (currentStep - 2) % 5;
      const dogIndex = Math.floor((currentStep - 2) / 5);
      const currentDog = dogsData[dogIndex];
      
      if (dogStepIndex < 4) { // Name, breed, age, weight steps
        const fields = ['name', 'breed', 'age', 'weight'];
        const field = fields[dogStepIndex];
        if (currentDog && !currentDog[field as keyof DogData].trim()) {
          Alert.alert('Required Field', 'Please fill in this field to continue.');
          return;
        }
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save all data to database
      if (user?.id) {
        // Update profile with ownership status
        const {error: profileError} = await supabase
          .from('profiles')
          .update({
            dog_ownership_status: ownershipStatus,
            dog_count: dogCount || 0,
            onboarded: true,
            preferences: {
              dogs: ownershipStatus === 'owner' ? dogsData.slice(0, dogCount || 0) : []
            }
          })
          .eq('id', user.id);
        
        if (profileError) throw profileError;

        // If user has dogs, save them to the dogs table
        if (ownershipStatus === 'owner' && dogCount) {
          for (let i = 0; i < dogCount; i++) {
            const dog = dogsData[i];
            const {error: dogError} = await supabase
              .from('dogs')
              .insert({
                user_id: user.id,
                name: dog.name,
                breed: dog.breed,
                age: parseInt(dog.age) || null,
                weight: parseFloat(dog.weight) || null,
                training_level: dog.trainingLevel,
              });
            
            if (dogError) {
              console.error('Error saving dog:', dogError);
            }
          }
        }
      }
      
      // Mark user as onboarded
      await completeOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDogData = (dogIndex: number, field: string, value: string) => {
    const newDogsData = [...dogsData];
    if (!newDogsData[dogIndex]) {
      newDogsData[dogIndex] = {
        name: '',
        breed: '',
        age: '',
        weight: '',
        trainingLevel: 'beginner',
      };
    }
    newDogsData[dogIndex] = {
      ...newDogsData[dogIndex],
      [field]: value,
    };
    setDogsData(newDogsData);
    
    // Auto-save to database
    saveDogDataToDb();
  };

  const saveDogDataToDb = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const {error} = await supabase
        .from('profiles')
        .update({
          preferences: {
            onboarding_step: currentStep,
            ownership_status: ownershipStatus,
            dog_count: dogCount,
            dogs: dogsData,
          }
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving onboarding data:', error);
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadOnboardingProgress = async () => {
    if (!user?.id) return;
    
    try {
      const {data, error} = await supabase
        .from('profiles')
        .select('preferences, dog_ownership_status, dog_count')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error || !data) return;
      
      if (data.dog_ownership_status) {
        setOwnershipStatus(data.dog_ownership_status as DogOwnershipStatus);
        setDogCount(data.dog_count);
      }
      
      const savedData = data.preferences as any;
      if (savedData) {
        if (savedData.onboarding_step !== undefined) {
          setCurrentStep(savedData.onboarding_step);
        }
        if (savedData.dogs && Array.isArray(savedData.dogs)) {
          setDogsData(savedData.dogs);
        }
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Change Account',
      'Your progress will be saved. You can complete setup anytime to start using the app.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Change Account', style: 'destructive', onPress: signOut},
      ]
    );
  };

  useEffect(() => {
    loadOnboardingProgress();
  }, [user?.id]);

  useEffect(() => {
    saveDogDataToDb();
  }, [ownershipStatus, dogCount, currentStep]);

  const renderStep = () => {
    // Step 0: Dog ownership question
    if (currentStep === 0) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Do you have a dog?</Text>
          <Text style={styles.stepSubtitle}>Let's personalize your experience</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                ownershipStatus === 'owner' && styles.optionItemSelected,
              ]}
              onPress={() => setOwnershipStatus('owner')}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  ownershipStatus === 'owner' && styles.optionLabelSelected,
                ]}>
                  Yes, I have a dog
                </Text>
                <Text style={[
                  styles.optionDesc,
                  ownershipStatus === 'owner' && styles.optionDescSelected,
                ]}>
                  I'm a proud dog parent
                </Text>
              </View>
              {ownershipStatus === 'owner' && (
                <Icon name="check" size={20} color={theme.colors.white} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionItem,
                ownershipStatus === 'looking' && styles.optionItemSelected,
              ]}
              onPress={() => setOwnershipStatus('looking')}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  ownershipStatus === 'looking' && styles.optionLabelSelected,
                ]}>
                  Not yet, but looking
                </Text>
                <Text style={[
                  styles.optionDesc,
                  ownershipStatus === 'looking' && styles.optionDescSelected,
                ]}>
                  I'm planning to get a dog soon
                </Text>
              </View>
              {ownershipStatus === 'looking' && (
                <Icon name="check" size={20} color={theme.colors.white} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionItem,
                ownershipStatus === 'none' && styles.optionItemSelected,
              ]}
              onPress={() => setOwnershipStatus('none')}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  ownershipStatus === 'none' && styles.optionLabelSelected,
                ]}>
                  Just exploring
                </Text>
                <Text style={[
                  styles.optionDesc,
                  ownershipStatus === 'none' && styles.optionDescSelected,
                ]}>
                  I'm here to learn about dogs
                </Text>
              </View>
              {ownershipStatus === 'none' && (
                <Icon name="check" size={20} color={theme.colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Step 1: How many dogs (only if owner)
    if (currentStep === 1 && ownershipStatus === 'owner') {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>How many dogs do you have?</Text>
          <Text style={styles.stepSubtitle}>We'll set up a profile for each one</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Number of dogs"
            placeholderTextColor={theme.colors.textPlaceholder}
            value={dogCount?.toString() || ''}
            onChangeText={(value) => {
              const num = parseInt(value);
              if (!isNaN(num) && num > 0 && num <= 10) {
                setDogCount(num);
                // Initialize dogs data array
                const newDogsData = [...dogsData];
                for (let i = 0; i < num; i++) {
                  if (!newDogsData[i]) {
                    newDogsData[i] = {
                      name: '',
                      breed: '',
                      age: '',
                      weight: '',
                      trainingLevel: 'beginner',
                    };
                  }
                }
                setDogsData(newDogsData);
              } else if (value === '') {
                setDogCount(null);
              }
            }}
            keyboardType="numeric"
            autoFocus
            maxLength={2}
          />
          {dogCount && dogCount > 1 && (
            <Text style={styles.helperText}>
              Great! Let's set up profiles for all {dogCount} dogs
            </Text>
          )}
        </View>
      );
    }

    // Step 1: Looking for a dog message
    if (currentStep === 1 && ownershipStatus === 'looking') {
      return (
        <View style={styles.stepContainer}>
          <Icon name="search" size={60} color={theme.colors.primary} style={styles.iconLarge} />
          <Text style={styles.stepTitle}>Exciting times ahead!</Text>
          <Text style={styles.stepSubtitle}>
            We'll help you prepare for your future furry friend with tips on choosing the right breed, 
            training basics, and everything you need to know before bringing a dog home.
          </Text>
        </View>
      );
    }

    // Dog profile steps (only if owner with dogs)
    if (ownershipStatus === 'owner' && dogCount && currentStep >= 2) {
      const dogStepIndex = (currentStep - 2) % 5;
      const dogIndex = Math.floor((currentStep - 2) / 5);
      const currentDog = dogsData[dogIndex] || {
        name: '',
        breed: '',
        age: '',
        weight: '',
        trainingLevel: 'beginner',
      };

      const dogLabel = dogCount > 1 ? `Dog ${dogIndex + 1} of ${dogCount}` : 'Your dog';

      // Dog name
      if (dogStepIndex === 0) {
        return (
          <View style={styles.stepContainer}>
            {dogCount > 1 && (
              <Text style={styles.dogCounter}>{dogLabel}</Text>
            )}
            <Text style={styles.stepTitle}>What's your dog's name?</Text>
            <Text style={styles.stepSubtitle}>We'll use this throughout the app</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter your dog's name"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={currentDog.name}
              onChangeText={(value) => updateDogData(dogIndex, 'name', value)}
              autoFocus
            />
          </View>
        );
      }

      // Dog breed
      if (dogStepIndex === 1) {
        return (
          <View style={styles.stepContainer}>
            {dogCount > 1 && (
              <Text style={styles.dogCounter}>{dogLabel}: {currentDog.name}</Text>
            )}
            <Text style={styles.stepTitle}>What breed is {currentDog.name || 'your dog'}?</Text>
            <Text style={styles.stepSubtitle}>This helps us provide better care tips</Text>
            
            <TextInput
              style={styles.input}
              placeholder="e.g., Golden Retriever, Mixed breed"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={currentDog.breed}
              onChangeText={(value) => updateDogData(dogIndex, 'breed', value)}
              autoFocus
            />
          </View>
        );
      }

      // Dog age
      if (dogStepIndex === 2) {
        return (
          <View style={styles.stepContainer}>
            {dogCount > 1 && (
              <Text style={styles.dogCounter}>{dogLabel}: {currentDog.name}</Text>
            )}
            <Text style={styles.stepTitle}>How old is {currentDog.name || 'your dog'}?</Text>
            <Text style={styles.stepSubtitle}>Age helps us tailor training advice</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Age in years"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={currentDog.age}
              onChangeText={(value) => updateDogData(dogIndex, 'age', value)}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        );
      }

      // Dog weight
      if (dogStepIndex === 3) {
        return (
          <View style={styles.stepContainer}>
            {dogCount > 1 && (
              <Text style={styles.dogCounter}>{dogLabel}: {currentDog.name}</Text>
            )}
            <Text style={styles.stepTitle}>What's {currentDog.name || 'your dog'}'s weight?</Text>
            <Text style={styles.stepSubtitle}>This helps with feeding and exercise recommendations</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Weight in kg"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={currentDog.weight}
              onChangeText={(value) => updateDogData(dogIndex, 'weight', value)}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        );
      }

      // Training level
      if (dogStepIndex === 4) {
        return (
          <View style={styles.stepContainer}>
            {dogCount > 1 && (
              <Text style={styles.dogCounter}>{dogLabel}: {currentDog.name}</Text>
            )}
            <Text style={styles.stepTitle}>Training Level</Text>
            <Text style={styles.stepSubtitle}>How experienced is {currentDog.name || 'your dog'} with training?</Text>
            
            <View style={styles.optionsContainer}>
              {trainingLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.optionItem,
                    currentDog.trainingLevel === level.id && styles.optionItemSelected,
                  ]}
                  onPress={() => updateDogData(dogIndex, 'trainingLevel', level.id)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      currentDog.trainingLevel === level.id && styles.optionLabelSelected,
                    ]}>
                      {level.label}
                    </Text>
                    <Text style={[
                      styles.optionDesc,
                      currentDog.trainingLevel === level.id && styles.optionDescSelected,
                    ]}>
                      {level.desc}
                    </Text>
                  </View>
                  {currentDog.trainingLevel === level.id && (
                    <Icon name="check" size={20} color={theme.colors.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }
    }

    return null;
  };

  const isLastStep = currentStep >= getTotalSteps() - 1;

  return (
    <>
      {/* Top SafeAreaView - Golden background for notch/status bar area */}
      <SafeAreaView style={styles.topSafeArea} />
      
      {/* Bottom SafeAreaView - Cream background for content and home indicator */}
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header with Cancel Button */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Change Account</Text>
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Welcome to Doogy!</Text>
              <Text style={styles.subtitle}>
                Let's get started with a few questions
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    {width: `${((currentStep + 1) / Math.max(getTotalSteps(), 1)) * 100}%`}
                  ]} 
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  Step {currentStep + 1} of {getTotalSteps()}
                </Text>
                {isSaving && (
                  <Text style={styles.savingText}>Saving...</Text>
                )}
              </View>
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.contentSection}>
            <ScrollView 
              style={styles.contentScroll} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {renderStep()}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigationSection}>
              {currentStep > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Icon name="arrow-left" size={20} color={theme.colors.primary} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.buttonSpacer} />
              
              {!isLastStep ? (
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Icon name="arrow-right" size={20} color={theme.colors.white} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.nextButton, isLoading && styles.nextButtonDisabled]} 
                  onPress={handleComplete}
                  disabled={isLoading}
                >
                  <Text style={styles.nextButtonText}>
                    {isLoading ? 'Setting up...' : 'Get Started'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  // Safe Area Views
  topSafeArea: {
    flex: 0,
    backgroundColor: theme.colors.background, // Golden for top/notch area
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface, // Cream for content and bottom area
  },
  keyboardContainer: {
    flex: 1,
  },

  // Header Section (Golden background)
  headerSection: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl + theme.spacing.lg, // Extend further down
  },
  cancelButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.lg,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl + 4,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },

  // Progress Section
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.8,
  },
  savingText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.6,
    fontStyle: 'italic',
  },

  // Content Section (Cream background)
  contentSection: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    marginTop: -theme.spacing.xl, // Negative margin to overlap golden section
    paddingTop: theme.spacing.xl, // Add padding back for content spacing
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  
  // Step Content
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: theme.fontSize.xl + 2,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPlaceholder,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md + 2,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    ...theme.shadows.sm,
  },
  helperText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  dogCounter: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconLarge: {
    marginBottom: theme.spacing.lg,
  },

  // Options
  optionsContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  optionItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  optionLabelSelected: {
    color: theme.colors.white,
  },
  optionDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPlaceholder,
  },
  optionDescSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Navigation Section
  navigationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  buttonSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginRight: theme.spacing.xs,
  },
});
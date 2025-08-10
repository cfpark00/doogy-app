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

export function OnboardingScreen() {
  const {completeOnboarding, signOut, user} = useAuth();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [dogData, setDogData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    trainingLevel: 'beginner',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    {
      title: "What's your dog's name?",
      subtitle: "We'll use this throughout the app",
      field: 'name',
      placeholder: 'Enter your dog\'s name',
      keyboardType: 'default' as const,
    },
    {
      title: "What breed is your dog?",
      subtitle: "This helps us provide better care tips",
      field: 'breed',
      placeholder: 'e.g., Golden Retriever, Mixed breed',
      keyboardType: 'default' as const,
    },
    {
      title: "How old is your dog?",
      subtitle: "Age helps us tailor training advice",
      field: 'age',
      placeholder: 'Age in years',
      keyboardType: 'numeric' as const,
    },
    {
      title: "What's your dog's weight?",
      subtitle: "This helps with feeding and exercise recommendations",
      field: 'weight',
      placeholder: 'Weight in kg',
      keyboardType: 'numeric' as const,
    },
  ];

  const trainingLevels = [
    {id: 'beginner', label: 'Beginner', desc: 'Just starting with basic commands'},
    {id: 'intermediate', label: 'Intermediate', desc: 'Knows sit, stay, come'},
    {id: 'advanced', label: 'Advanced', desc: 'Follows complex commands'},
    {id: 'expert', label: 'Expert', desc: 'Professional training level'},
  ];

  const handleNext = () => {
    const currentField = steps[currentStep]?.field;
    if (currentField && !dogData[currentField as keyof typeof dogData].trim()) {
      Alert.alert('Required Field', 'Please fill in this field to continue.');
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!dogData.name.trim()) {
      Alert.alert('Required', 'Please enter your dog\'s name.');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Save dog data to database
      console.log('Dog data:', dogData);
      
      // Mark user as onboarded
      await completeOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDogData = async (field: string, value: string) => {
    const newData = {...dogData, [field]: value};
    setDogData(newData);
    
    // Auto-save to database
    await saveDogDataToDb(newData);
  };

  const saveDogDataToDb = async (data: typeof dogData) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Save to profiles preferences field for now
      const {error} = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...data,
            onboarding_step: currentStep
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
        .select('preferences')
        .eq('id', user.id)
        .single();
      
      if (error || !data?.preferences) return;
      
      const savedData = data.preferences as any;
      if (savedData.name || savedData.breed || savedData.age || savedData.weight) {
        setDogData({
          name: savedData.name || '',
          breed: savedData.breed || '',
          age: savedData.age || '',
          weight: savedData.weight || '',
          trainingLevel: savedData.trainingLevel || 'beginner',
        });
        
        // Resume from saved step
        if (savedData.onboarding_step !== undefined) {
          setCurrentStep(Math.min(savedData.onboarding_step, steps.length));
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

  const renderStep = () => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          
          <TextInput
            style={styles.input}
            placeholder={step.placeholder}
            placeholderTextColor={theme.colors.textPlaceholder}
            value={dogData[step.field as keyof typeof dogData]}
            onChangeText={(value) => updateDogData(step.field, value)}
            keyboardType={step.keyboardType}
            autoFocus
          />
        </View>
      );
    }

    // Training level step
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Training Level</Text>
        <Text style={styles.stepSubtitle}>How experienced is your dog with training?</Text>
        
        <View style={styles.optionsContainer}>
          {trainingLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.optionItem,
                dogData.trainingLevel === level.id && styles.optionItemSelected,
              ]}
              onPress={() => updateDogData('trainingLevel', level.id)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  dogData.trainingLevel === level.id && styles.optionLabelSelected,
                ]}>
                  {level.label}
                </Text>
                <Text style={[
                  styles.optionDesc,
                  dogData.trainingLevel === level.id && styles.optionDescSelected,
                ]}>
                  {level.desc}
                </Text>
              </View>
              {dogData.trainingLevel === level.id && (
                <Icon name="check" size={20} color={theme.colors.white} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

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
                Let's get to know your furry friend
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    {width: `${((currentStep + 1) / (steps.length + 1)) * 100}%`}
                  ]} 
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {currentStep + 1} of {steps.length + 1}
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
              
              {currentStep < steps.length ? (
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

  // Options (Training Level)
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
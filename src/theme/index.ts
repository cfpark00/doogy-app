// Industry-standard React Native theme configuration
// Following patterns from React Native Paper, NativeBase, etc.

export const colors = {
  // Primary brand colors - Golden/Mustard theme
  primary: '#F8C25F',        // Main golden/mustard color
  primaryLight: '#F8C25F',   // Lighter golden
  primaryDark: '#99710A',    // Darker golden
  
  // Secondary accent colors
  secondary: '#FFFAE8',      // Cream/beige accent
  secondaryLight: '#FFFFFD',
  secondaryDark: '#E5D0B5',
  
  // Background colors
  background: '#F8C25F',     // Off-white/cream background
  surface: '#FFFAE8',        // Card/surface background
  surfaceLight: '#FFFFFD',
  
  // Text colors
  textPrimary: '#707070',    // Dark gray text
  textSecondary: '#FFFFFF',  // Medium gray text  
  textPlaceholder: '#DADADA', // Light gray placeholder
  textOnPrimary: '#FFFFFF',  // White text on primary color
  
  // UI specific colors
  cardBackground: '#FFFFFF',
  cardShadow: '#00000008',
  iconActive: '#D4A859',
  iconInactive: '#E5D0B5',
  inputBackground: '#FFFFFF',
  inputBorder: '#F5E6D3',
  
  // Status/semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E0E0E0',
  gray300: '#CCCCCC',
  gray400: '#999999',
  gray500: '#666666',
  gray600: '#4D4D4D',
  gray700: '#333333',
  gray800: '#1A1A1A',
  gray900: '#0D0D0D',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 20,
  round: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
} as const;

export const elevation = {
  sm: 2,
  md: 4,
  lg: 8,
} as const;

// Main theme object - follows industry standard patterns
export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  elevation,
} as const;

// Type exports for TypeScript support
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;

export default theme;
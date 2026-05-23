export const COLORS = {
  // Primary brand colors - Vibrant Gold/Yellow
  primary: '#FFB800',
  primaryLight: '#FFC933',
  primaryDark: '#E5A500',
  primaryGradient: ['#FFB800', '#FFC933'],
  
  // Icon colors for better contrast
  iconPrimary: '#D97706', // Deep Amber for icons on white
  iconSecondary: '#92400E', // Darker amber
  
  // Secondary colors - Deep Navy Blue
  secondary: '#1A1A2E',
  secondaryLight: '#2E2E3A',
  secondaryDark: '#0F0F1A',
  secondaryGradient: ['#1A1A2E', '#2E2E3A'],
  
  // Accent colors
  accent: '#FF6B6B',
  accentLight: '#FF8787',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  grayLight: '#9CA3AF',
  grayDark: '#374151',
  lightGray: '#F9FAFB',
  backgroundGray: '#F3F4F6',
  darkGray: '#1F2937',
  charcoal: '#374151',
  
  // Semantic colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Background colors
  background: '#FFF8E6',
  backgroundSecondary: '#FFFAF0',
  backgroundTertiary: '#FFF1CC',
  cardBackground: '#FFFAF0', // Warm cream instead of pure white
  cardBackgroundGlass: 'rgba(255, 250, 240, 0.9)', // Warm translucent
  
  // Border and shadow - Warm borders to match cream background
  border: '#FFE6A6', // Warm golden border
  borderLight: '#FFF1CC', // Light warm border
  borderDark: '#FFD978', // Darker warm border
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 20, // Harmonized to 20px
  xxxl: 20, // Harmonized to 20px
  full: 999,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Animation timings
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Glassmorphism effect - Warm glass to match cream theme
export const GLASS = {
  background: 'rgba(255, 250, 240, 0.85)', // Warm cream glass
  border: 'rgba(255, 235, 180, 0.35)', // Warm golden border
  backdrop: 'blur(20px)',
};


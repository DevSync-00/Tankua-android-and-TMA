import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchDestinationsFresh } from '../services/destinationCache';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import TripsScreen from '../screens/TripsScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Tab = createBottomTabNavigator();

// Custom Liquid Glass Tab Bar Component
const LiquidGlassTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBarContainer, { bottom: Math.max(insets.bottom, SPACING.md) }]}>
      <BlurView
        intensity={40}
        tint="light"
        style={styles.blurContainer}
      >
        <View style={styles.tabBarInner}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            let iconName;
            if (route.name === 'Home') {
              iconName = isFocused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = isFocused ? 'search' : 'search-outline';
            } else if (route.name === 'Trips') {
              iconName = isFocused ? 'bus' : 'bus-outline';
            } else if (route.name === 'Map' || route.name === 'Help') {
              iconName = isFocused ? 'map' : 'map-outline';
            } else if (route.name === 'Profile') {
              iconName = isFocused ? 'person' : 'person-outline';
            }

            const animatedStyle = useAnimatedStyle(() => {
              return {
                transform: [
                  { scale: withSpring(isFocused ? 1.15 : 1, { damping: 12, stiffness: 200 }) },
                ],
              };
            });

            const indicatorStyle = useAnimatedStyle(() => {
              return {
                opacity: withTiming(isFocused ? 1 : 0, { duration: 250 }),
                transform: [
                  { scale: withSpring(isFocused ? 1 : 0, { damping: 12, stiffness: 200 }) },
                ],
              };
            });

            const glowStyle = useAnimatedStyle(() => {
              return {
                opacity: withTiming(isFocused ? 0.3 : 0, { duration: 250 }),
              };
            });

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <Animated.View style={[styles.iconGlow, glowStyle]} />
                  <Animated.View style={animatedStyle}>
                    <Ionicons
                      name={iconName}
                      size={26}
                      color={isFocused ? COLORS.primary : COLORS.grayLight}
                    />
                  </Animated.View>
                  <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const MainTabNavigator = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Warm up destination cache on app boot
    fetchDestinationsFresh().catch((err) =>
      console.log('Notice: Warmup destination fetch notice:', err?.message || err)
    );
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: COLORS.backgroundSecondary }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarTransparent: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen 
        name="Trips" 
        component={TripsScreen}
        options={{ tabBarLabel: 'Trips' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    paddingTop: SPACING.sm,
  },
  blurContainer: {
    borderRadius: BORDER_RADIUS.xl + 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    // Increased opacity for better visibility while maintaining glass effect
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  tabBarInner: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  iconGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    color: COLORS.grayLight,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
});
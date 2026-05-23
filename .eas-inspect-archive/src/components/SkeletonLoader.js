import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { COLORS, BORDER_RADIUS } from '../config/theme';

const SkeletonLoader = ({ 
  width = '100%', 
  height = 200, 
  borderRadius = BORDER_RADIUS.lg,
  variant = 'card' // 'card', 'text', 'circle'
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-300, 300]
    );
    
    return {
      transform: [{ translateX }],
      opacity: interpolate(
        shimmer.value,
        [0, 0.5, 1],
        [0.3, 0.7, 0.3]
      ),
    };
  });

  if (variant === 'card') {
    return (
      <View style={[styles.cardContainer, { width, height, borderRadius }]}>
        <View style={styles.shimmerContainer}>
          <Animated.View style={[styles.shimmer, animatedStyle]} />
        </View>
        <View style={styles.cardContent}>
          <View style={[styles.skeletonBox, styles.imageBox]} />
          <View style={styles.textContainer}>
            <View style={[styles.skeletonBox, styles.titleBox]} />
            <View style={[styles.skeletonBox, styles.subtitleBox]} />
            <View style={styles.footerContainer}>
              <View style={[styles.skeletonBox, styles.ratingBox]} />
              <View style={[styles.skeletonBox, styles.distanceBox]} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'text') {
    return (
      <View style={[styles.textSkeleton, { width, height, borderRadius }]}>
        <Animated.View style={[styles.shimmer, animatedStyle]} />
      </View>
    );
  }

  if (variant === 'circle') {
    return (
      <View style={[styles.circleSkeleton, { width, height, borderRadius: width / 2 }]}>
        <Animated.View style={[styles.shimmer, animatedStyle]} />
      </View>
    );
  }

  return (
    <View style={[styles.defaultSkeleton, { width, height, borderRadius }]}>
      <Animated.View style={[styles.shimmer, animatedStyle]} />
    </View>
  );
};

// Grid card skeleton
export const SkeletonCard = ({ width, height = 280, borderRadius = BORDER_RADIUS.lg }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-300, 300]
    );
    return { 
      transform: [{ translateX }],
      opacity: interpolate(
        shimmer.value,
        [0, 0.5, 1],
        [0.3, 0.7, 0.3]
      ),
    };
  });

  return (
    <View style={[styles.cardContainer, { width, height, borderRadius }]}>
      <View style={styles.shimmerContainer}>
        <Animated.View style={[styles.shimmer, animatedStyle]} />
      </View>
      <View style={styles.cardContent}>
        <View style={[styles.skeletonBox, styles.imageBox]} />
        <View style={styles.textContainer}>
          <View style={[styles.skeletonBox, styles.titleBox]} />
          <View style={[styles.skeletonBox, styles.subtitleBox]} />
          <View style={styles.footerContainer}>
            <View style={[styles.skeletonBox, styles.ratingBox]} />
            <View style={[styles.skeletonBox, styles.distanceBox]} />
          </View>
        </View>
      </View>
    </View>
  );
};

// List card skeleton
export const SkeletonListCard = ({ width = '100%', height = 140 }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-300, 300]
    );
    return { 
      transform: [{ translateX }],
      opacity: interpolate(
        shimmer.value,
        [0, 0.5, 1],
        [0.3, 0.7, 0.3]
      ),
    };
  });

  return (
    <View style={[styles.listCardContainer, { width, height }]}>
      <View style={styles.shimmerContainer}>
        <Animated.View style={[styles.shimmer, animatedStyle]} />
      </View>
      <View style={styles.listContent}>
        <View style={[styles.skeletonBox, styles.listImageBox]} />
        <View style={styles.listTextContainer}>
          <View style={[styles.skeletonBox, styles.listTitleBox]} />
          <View style={[styles.skeletonBox, styles.listSubtitleBox]} />
          <View style={styles.listFooterContainer}>
            <View style={[styles.skeletonBox, styles.listRatingBox]} />
            <View style={[styles.skeletonBox, styles.listDistanceBox]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: 8,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmer: {
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  cardContent: {
    flex: 1,
  },
  imageBox: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.lightGray,
  },
  textContainer: {
    padding: 12,
  },
  titleBox: {
    width: '80%',
    height: 16,
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  subtitleBox: {
    width: '60%',
    height: 12,
    marginBottom: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBox: {
    width: 60,
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  distanceBox: {
    width: 50,
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  textSkeleton: {
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
    position: 'relative',
  },
  circleSkeleton: {
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
    position: 'relative',
  },
  defaultSkeleton: {
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
    position: 'relative',
  },
  listCardContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: 12,
  },
  listContent: {
    flexDirection: 'row',
    flex: 1,
  },
  listImageBox: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.lightGray,
  },
  listTextContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listTitleBox: {
    width: '70%',
    height: 16,
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  listSubtitleBox: {
    width: '90%',
    height: 12,
    marginBottom: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  listFooterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listRatingBox: {
    width: 60,
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  listDistanceBox: {
    width: 50,
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
});

export default SkeletonLoader;

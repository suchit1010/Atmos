import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Skeleton Loader Component
 * Displays shimmer animation while content is loading
 * Production-ready with multiple skeleton types
 */
export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = Radius.md,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-1, 1],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.bgInput,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ scaleX: translateX }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Card Skeleton - for project/listing card loading state
 */
export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <SkeletonLoader height={120} borderRadius={Radius.lg} style={{ marginBottom: Spacing.md }} />
      <SkeletonLoader width="70%" height={16} style={{ marginBottom: Spacing.xs }} />
      <SkeletonLoader width="100%" height={12} />
    </View>
  );
}

/**
 * Profile Skeleton - for dashboard stats loading
 */
export function ProfileSkeleton() {
  return (
    <View style={styles.profileSkeleton}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={{ marginBottom: Spacing.lg }}>
          <SkeletonLoader width="40%" height={14} style={{ marginBottom: Spacing.sm }} />
          <SkeletonLoader width="60%" height={20} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.bgInput,
  },
  shimmer: {
    flex: 1,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  cardSkeleton: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  profileSkeleton: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
});

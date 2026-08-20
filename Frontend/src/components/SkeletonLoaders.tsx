import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from './Theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

/** Base shimmer block — pulses with a smooth opacity wave */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = RADIUS.sm, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmer]);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.surfaceContainer, COLORS.surfaceContainerHigh],
  });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: bg }, style]}
    />
  );
};

/** Category card skeleton — 3-per-row grid */
export const CategorySkeleton = () => (
  <View style={styles.catSkeletonCard}>
    <Skeleton width={56} height={56} borderRadius={RADIUS.md} />
    <Skeleton width={80} height={14} borderRadius={4} style={{ marginTop: SPACING.md }} />
  </View>
);

/** Service/item row skeleton */
export const ItemSkeleton = () => (
  <View style={styles.itemSkeletonCard}>
    <Skeleton width={64} height={64} borderRadius={RADIUS.md} style={{ marginRight: SPACING.md }} />
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Skeleton width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width={60} height={14} borderRadius={4} />
    </View>
    <View style={{ width: 80, alignItems: 'center' }}>
      <Skeleton width={60} height={36} borderRadius={RADIUS.md} />
    </View>
  </View>
);

/** Order card skeleton */
export const OrderSkeleton = () => (
  <View style={styles.orderSkeletonCard}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <Skeleton width={120} height={16} borderRadius={4} />
      <Skeleton width={72} height={22} borderRadius={RADIUS.full} />
    </View>
    <Skeleton width="100%" height={1} borderRadius={1} style={{ marginBottom: 12 }} />
    <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <Skeleton width="40%" height={14} borderRadius={4} />
  </View>
);

/** Promo banner skeleton */
export const BannerSkeleton = () => (
  <Skeleton width={280} height={100} borderRadius={RADIUS.xl} style={{ marginRight: SPACING.md }} />
);

/** Profile header skeleton */
export const ProfileSkeleton = () => (
  <View style={styles.profileSkeletonWrap}>
    <Skeleton width={72} height={72} borderRadius={36} style={{ marginBottom: 12 }} />
    <Skeleton width={140} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
    <Skeleton width={100} height={14} borderRadius={4} />
  </View>
);

/** Admin stat card skeleton */
export const StatCardSkeleton = () => (
  <View style={styles.statSkeletonCard}>
    <Skeleton width={36} height={36} borderRadius={18} style={{ marginBottom: 10 }} />
    <Skeleton width={60} height={24} borderRadius={4} style={{ marginBottom: 6 }} />
    <Skeleton width={80} height={12} borderRadius={4} />
  </View>
);

const styles = StyleSheet.create({
  catSkeletonCard: {
    width: '31%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  itemSkeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  orderSkeletonCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  profileSkeletonWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  statSkeletonCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
});



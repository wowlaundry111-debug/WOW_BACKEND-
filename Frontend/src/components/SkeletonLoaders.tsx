import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import { COLORS, RADIUS, SPACING, NEO_SHADOW } from './Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedView = Animated.View as any;

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

/** Base shimmer block with smooth opacity pulse */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = RADIUS.sm, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#F3F4F6'],
  });

  return (
    <AnimatedView
      style={[{ width, height, borderRadius, backgroundColor: bg }, style]}
    />
  );
};

/** Category card skeleton — matches 2-column Neo-Brutalist grid */
export const CategorySkeleton = () => (
  <View style={styles.catSkeletonCard}>
    {/* Badge placeholder */}
    <Skeleton width={50} height={18} borderRadius={RADIUS.xs} style={{ alignSelf: 'flex-start', marginBottom: 8 }} />
    {/* Image illustration placeholder */}
    <Skeleton width={70} height={70} borderRadius={RADIUS.md} style={{ marginVertical: 6 }} />
    {/* Divider */}
    <View style={styles.skeletonDivider} />
    {/* Category name placeholder */}
    <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
  </View>
);

/** Item row skeleton for Shop / Cart screen */
export const ItemSkeleton = () => (
  <View style={styles.itemSkeletonCard}>
    <Skeleton width={68} height={68} borderRadius={RADIUS.md} style={{ marginRight: SPACING.md }} />
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Skeleton width="75%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="45%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
      <Skeleton width="30%" height={14} borderRadius={4} />
    </View>
    <View style={{ width: 72, alignItems: 'center' }}>
      <Skeleton width={64} height={32} borderRadius={RADIUS.md} />
    </View>
  </View>
);

/** Order card skeleton for Orders screen */
export const OrderSkeleton = () => (
  <View style={styles.orderSkeletonCard}>
    <View style={styles.skeletonHeaderRow}>
      <Skeleton width={110} height={18} borderRadius={RADIUS.xs} />
      <Skeleton width={80} height={20} borderRadius={RADIUS.xs} />
    </View>
    <View style={styles.skeletonDivider} />
    <Skeleton width="65%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <Skeleton width="45%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
    <View style={styles.skeletonFooterRow}>
      <Skeleton width={90} height={16} borderRadius={4} />
      <Skeleton width={75} height={28} borderRadius={RADIUS.md} />
    </View>
  </View>
);

/** Delivery task skeleton for Delivery Partner screens */
export const DeliveryTaskSkeleton = () => (
  <View style={styles.deliverySkeletonCard}>
    <View style={styles.skeletonHeaderRow}>
      <Skeleton width={100} height={20} borderRadius={RADIUS.xs} />
      <Skeleton width={60} height={20} borderRadius={RADIUS.xs} />
    </View>
    <View style={styles.skeletonDivider} />
    <Skeleton width="85%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
    <Skeleton width="60%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
    <Skeleton width="100%" height={40} borderRadius={RADIUS.md} />
  </View>
);

/** Banner carousel skeleton */
export const BannerSkeleton = () => (
  <View style={styles.bannerSkeletonCard}>
    <Skeleton width="100%" height={110} borderRadius={RADIUS.xl} />
  </View>
);

const styles = StyleSheet.create({
  catSkeletonCard: {
    width: (SCREEN_WIDTH - 32 - 12) / 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box4,
  },
  itemSkeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box4,
  },
  orderSkeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box4,
  },
  deliverySkeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box4,
  },
  bannerSkeletonCard: {
    width: SCREEN_WIDTH - 32,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    overflow: 'hidden',
    ...NEO_SHADOW.box4,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonDivider: {
    height: 1.5,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: 6,
  },
});

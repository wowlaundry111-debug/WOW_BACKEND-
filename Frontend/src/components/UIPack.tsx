/**
 * WOW Laundry — Core UI Component Pack
 * Industry-level components with micro-animations, glassmorphism, and MD3 precision.
 */
import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, GLASS, SHADOW, SPACING, RADIUS, TYPO, ORDER_STATUS } from './Theme';
import type { OrderStatus } from './Theme';

// ─── PressableScale — spring press animation wrapper ────────────────────────
interface PressableScaleProps {
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  scaleTo?: number;
  disabled?: boolean;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  onPress,
  style,
  children,
  scaleTo = 0.96,
  disabled,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: false,
      speed: 60,
      bounciness: 8,
    }).start();
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: false,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── GlassCard — frosted glass surface card with real backdrop blur ─────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  radius?: number;
  onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, radius = RADIUS.xxl, onPress }) => {
  const webBlurStyle: any = {
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  };

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        style={[styles.glassCard, { borderRadius: radius }, webBlurStyle, ...(style ? [style] : [])]}
      >
        <View style={{ flex: 1 }}>{children}</View>
      </PressableScale>
    );
  }
  return (
    <View style={[styles.glassCard, { borderRadius: radius }, webBlurStyle, ...(style ? [style] : [])]}>
      {children}
    </View>
  );
};

// ─── SurfaceCard — clean flat surface card ───────────────────────────────────
interface SurfaceCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  radius?: number;
  onPress?: () => void;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({ children, style, radius = RADIUS.xl, onPress }) => {
  const inner = (
    <View style={[styles.surfaceCard, { borderRadius: radius }, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return <PressableScale onPress={onPress}>{inner}</PressableScale>;
  }
  return inner;
};

// ─── Button — linear gradient CTA with modern micro-shadows ──────────────────
interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  style,
  fullWidth,
}) => {
  const SIZE_STYLES: Record<'sm' | 'md' | 'lg', ViewStyle> = {
    sm: { paddingHorizontal: 16, paddingVertical: 8 },
    md: { paddingHorizontal: 24, paddingVertical: 12 },
    lg: { paddingHorizontal: 24, paddingVertical: 14 },
  };

  const TEXT_SIZE_STYLES: Record<'sm' | 'md' | 'lg', TextStyle> = {
    sm: { fontSize: 13, fontWeight: '600' as const },
    md: { ...TYPO.labelLg },
    lg: { ...TYPO.labelLg, fontSize: 15 },
  };

  const sizeStyle = SIZE_STYLES[size];
  const textSizeStyle = TEXT_SIZE_STYLES[size];

  const fullWidthStyle: ViewStyle | undefined = fullWidth ? { width: '100%', justifyContent: 'center' } : undefined;

  const renderContent = (textColor: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
      {loading ? <ActivityIndicator size="small" color={textColor} /> : icon}
      <Text style={[styles.buttonText, textSizeStyle, { color: textColor }]}>{label}</Text>
    </View>
  );

  if (variant === 'primary') {
    const gradientColors = disabled ? ['#D1D5DB', '#9CA3AF'] : (GRADIENTS.primary as any);
    return (
      <PressableScale
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.buttonBase,
          sizeStyle,
          !disabled && {
            boxShadow: `0px 16px 32px -8px ${COLORS.primary}60, 0px 8px 16px -6px ${COLORS.primary}40`
          } as any,
          ...(fullWidthStyle ? [fullWidthStyle] : []),
          ...(style ? [style] : []),
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.full }]}
        />
        {renderContent(COLORS.onPrimary)}
      </PressableScale>
    );
  }

  // Outline, Ghost, Danger styling
  const VARIANT_STYLES: Record<'outline' | 'ghost' | 'danger', { container: ViewStyle; text: TextStyle }> = {
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.outlineVariant },
      text: { color: COLORS.onSurfaceVariant },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: COLORS.primary },
    },
    danger: {
      container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.error },
      text: { color: COLORS.error },
    },
  };

  const currentStyles = VARIANT_STYLES[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        sizeStyle,
        currentStyles.container,
        ...(fullWidthStyle ? [fullWidthStyle] : []),
        ...(style ? [style] : []),
      ]}
    >
      {renderContent(currentStyles.text.color as string)}
    </PressableScale>
  );
};

// ─── StatusBadge — order status pill ─────────────────────────────────────────
interface StatusBadgeProps {
  status: OrderStatus;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot }) => {
  const cfg = ORDER_STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      {showDot && (
        <View style={[styles.badgeDot, { backgroundColor: cfg.color }]} />
      )}
      <Text style={[TYPO.labelXs, { color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
        {cfg.label}
      </Text>
    </View>
  );
};

// ─── ToggleSwitch — custom branded switch ────────────────────────────────────
interface ToggleSwitchProps {
  value: boolean;
  onToggle: (val: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onToggle }) => (
  <Switch
    value={value}
    onValueChange={onToggle}
    trackColor={{ false: COLORS.surfaceVariant, true: COLORS.primary }}
    thumbColor={COLORS.onPrimary}
    ios_backgroundColor={COLORS.surfaceVariant}
  />
);

// ─── SectionHeader ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  label: string;
  caption?: string;
  action?: { label: string; onPress: () => void };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ label, caption, action }) => (
  <View style={styles.sectionHeader}>
    <View style={{ flex: 1 }}>
      {caption && (
        <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }]}>
          {caption}
        </Text>
      )}
      <Text style={[TYPO.headlineLgMob, { color: COLORS.onSurface }]}>{label}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress} style={styles.sectionAction}>
        <Text style={[TYPO.labelSm, { color: COLORS.primary }]}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider = () => (
  <View style={{ height: 1, backgroundColor: COLORS.surfaceContainerHighest }} />
);

// ─── MetricCard — bento stats card with modern orbital gradients ─────────────
interface MetricCardProps {
  title: string;
  value: string;
  sub?: string;
  variant?: 'primary' | 'secondary' | 'surface';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  sub,
  variant = 'surface',
  style,
  fullWidth,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const textColor = variant === 'surface' ? COLORS.onSurface : COLORS.onPrimary;
  const subColor = variant === 'surface' ? COLORS.outline : 'rgba(255,255,255,0.75)';

  const cardStyle = [
    styles.metricCard,
    isPrimary && SHADOW.glow(COLORS.primary),
    isSecondary && SHADOW.glow(COLORS.secondary),
    fullWidth && { flex: 1 },
    style,
  ];

  if (variant === 'surface') {
    return (
      <View style={[cardStyle, { backgroundColor: COLORS.surfaceContainer }]}>
        <Text style={[TYPO.labelLg, { color: subColor, marginBottom: 4, zIndex: 1 }]}>{title}</Text>
        <Text style={[TYPO.headlineLgMob, { color: textColor, fontWeight: '700', zIndex: 1 }]}>{value}</Text>
        {sub && <Text style={[TYPO.labelSm, { color: subColor, marginTop: 2, zIndex: 1 }]}>{sub}</Text>}
      </View>
    );
  }

  const gradientColors = isPrimary ? GRADIENTS.primary : GRADIENTS.secondary;

  return (
    <View style={cardStyle}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Premium glowing decorative circles */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <Text style={[TYPO.labelLg, { color: subColor, marginBottom: 4, zIndex: 1 }]}>{title}</Text>
      <Text style={[TYPO.headlineLgMob, { color: textColor, fontWeight: '700', zIndex: 1 }]}>{value}</Text>
      {sub && <Text style={[TYPO.labelSm, { color: subColor, marginTop: 2, zIndex: 1 }]}>{sub}</Text>}
    </View>
  );
};

// ─── SettingsRow — glass settings nav item ───────────────────────────────────
interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
}) => (
  <GlassCard onPress={onPress} radius={RADIUS.xxl} style={styles.settingsRow}>
    <View style={styles.settingsRowInner}>
      <View style={styles.settingsRowLeft}>
        <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{title}</Text>
          {subtitle && (
            <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginTop: 1 }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Text style={{ fontSize: 20, color: COLORS.outlineVariant }}>›</Text>
    </View>
  </GlassCard>
);

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: GLASS.background,
    borderWidth: 1,
    borderColor: GLASS.border,
    ...GLASS.shadow,
  },
  surfaceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0px 24px 48px -12px rgba(124, 58, 237, 0.08), 0px 12px 24px -8px rgba(124, 58, 237, 0.04)' as any,
  },
  buttonBase: {
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  buttonText: {
    ...TYPO.labelLg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  sectionAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  metricCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    minHeight: 120,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0px 32px 64px -16px rgba(124, 58, 237, 0.2)' as any,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glowCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  settingsRow: {
    padding: 0,
  },
  settingsRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * WOW Laundry — Neo-Brutalist Core UI Pack (Matching Website)
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
  TextInput,
  TextInputProps,
} from 'react-native';
import { COLORS, NEO_SHADOW, SPACING, RADIUS, TYPO, ORDER_STATUS } from './Theme';
import type { OrderStatus } from './Theme';

// ─── PressableScale — tactile spring press ─────────────────────────────────
interface PressableScaleProps {
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  scaleTo?: number;
  disabled?: boolean;
}

const AnimatedView: any = Animated.View;

export const PressableScale: React.FC<PressableScaleProps> = ({
  onPress,
  style,
  children,
  scaleTo = 0.97,
  disabled,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 60,
      bounciness: 6,
    }).start();
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scale]);

  return (
    <AnimatedView style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </AnimatedView>
  );
};

// ─── NeoCard — Solid Neo-Brutalist Card ─────────────────────────────────────
interface NeoCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  bg?: string;
  shadow?: keyof typeof NEO_SHADOW;
  radius?: number;
  onPress?: () => void;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  style,
  bg = COLORS.white,
  shadow = 'box4',
  radius = RADIUS.lg,
  onPress,
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor: bg,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: radius,
    ...NEO_SHADOW[shadow],
  };

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[cardStyle, style as any]}>
        {children}
      </PressableScale>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

// Alias for compatibility
export const GlassCard = NeoCard;
export const SurfaceCard = NeoCard;

// ─── NeoButton — High-Contrast Brutalist Button ─────────────────────────────
interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'black' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
  shadow?: keyof typeof NEO_SHADOW;
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
  shadow = 'box4',
}) => {
  const SIZE_STYLES: Record<'sm' | 'md' | 'lg', ViewStyle> = {
    sm: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
    md: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.lg },
    lg: { paddingHorizontal: 24, paddingVertical: 15, borderRadius: RADIUS.xl },
  };

  const TEXT_SIZE_STYLES: Record<'sm' | 'md' | 'lg', TextStyle> = {
    sm: { fontSize: 13, fontWeight: '800' as const, textTransform: 'uppercase', letterSpacing: 0.5 },
    md: { fontSize: 15, fontWeight: '800' as const, textTransform: 'uppercase', letterSpacing: 0.8 },
    lg: { fontSize: 17, fontWeight: '800' as const, textTransform: 'uppercase', letterSpacing: 1 },
  };

  const getVariantStyles = () => {
    if (disabled) {
      return {
        bg: '#E5E7EB',
        border: '#9CA3AF',
        text: '#6B7280',
        shadow: undefined,
      };
    }
    switch (variant) {
      case 'primary': // Electric Blue
        return { bg: COLORS.primary, border: COLORS.black, text: COLORS.white, shadow: NEO_SHADOW[shadow] };
      case 'secondary': // Neon Lime Green
        return { bg: COLORS.secondary, border: COLORS.black, text: COLORS.black, shadow: NEO_SHADOW[shadow] };
      case 'black': // Pitch Black
        return { bg: COLORS.black, border: COLORS.black, text: COLORS.white, shadow: NEO_SHADOW.boxLime4 };
      case 'danger':
        return { bg: COLORS.error, border: COLORS.black, text: COLORS.white, shadow: NEO_SHADOW[shadow] };
      case 'outline':
      default:
        return { bg: COLORS.white, border: COLORS.black, text: COLORS.black, shadow: NEO_SHADOW[shadow] };
    }
  };

  const config = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.buttonBase,
        SIZE_STYLES[size],
        { backgroundColor: config.bg, borderColor: config.border },
        config.shadow,
        fullWidth ? { width: '100%' } : undefined,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? <ActivityIndicator size="small" color={config.text} /> : icon}
        <Text style={[TEXT_SIZE_STYLES[size], { color: config.text, fontFamily: 'Outfit_800ExtraBold' }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── StatusBadge — Neo-Brutalist Order Badge ───────────────────────────────
interface StatusBadgeProps {
  status: OrderStatus;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot }) => {
  const cfg = ORDER_STATUS[status] || { label: status, color: '#000', bg: '#E5E7EB', border: '#000' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {showDot && (
        <View style={[styles.badgeDot, { backgroundColor: cfg.color }]} />
      )}
      <Text style={[styles.badgeText, { color: cfg.color }]}>
        {cfg.label}
      </Text>
    </View>
  );
};

// ─── QuantityStepper — Neo-Brutalist Counter (- / +) ───────────────────────
interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md',
}) => {
  const btnSize = size === 'sm' ? 28 : 34;
  return (
    <View style={[styles.stepperContainer, { height: btnSize + 6 }]}>
      <TouchableOpacity
        onPress={onDecrement}
        activeOpacity={0.7}
        style={[styles.stepperBtn, { width: btnSize, height: btnSize }]}
      >
        <Text style={styles.stepperBtnText}>-</Text>
      </TouchableOpacity>
      <Text style={[styles.stepperQtyText, size === 'sm' && { fontSize: 14 }]}>
        {quantity}
      </Text>
      <TouchableOpacity
        onPress={onIncrement}
        activeOpacity={0.7}
        style={[styles.stepperBtn, { width: btnSize, height: btnSize, backgroundColor: COLORS.secondary }]}
      >
        <Text style={[styles.stepperBtnText, { color: COLORS.black }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── NeoInput — Brutalist Form Field ───────────────────────────────────────
interface NeoInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const NeoInput: React.FC<NeoInputProps> = ({
  label,
  icon,
  rightAction,
  containerStyle,
  style,
  ...rest
}) => (
  <View style={[{ marginBottom: SPACING.md }, containerStyle]}>
    {label && (
      <Text style={styles.inputLabel}>{label}</Text>
    )}
    <View style={styles.inputWrapper}>
      {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
      <TextInput
        style={[styles.inputField, style]}
        placeholderTextColor="#6B7280"
        {...rest}
      />
      {rightAction}
    </View>
  </View>
);

// ─── ToggleSwitch ──────────────────────────────────────────────────────────
interface ToggleSwitchProps {
  value: boolean;
  onToggle: (val: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onToggle }) => (
  <Switch
    value={value}
    onValueChange={onToggle}
    trackColor={{ false: '#E5E7EB', true: COLORS.secondary }}
    thumbColor={COLORS.black}
    ios_backgroundColor="#E5E7EB"
  />
);

// ─── SectionHeader ─────────────────────────────────────────────────────────
interface SectionHeaderProps {
  label: string;
  caption?: string;
  action?: { label: string; onPress: () => void };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ label, caption, action }) => (
  <View style={styles.sectionHeader}>
    <View style={{ flex: 1 }}>
      {caption && (
        <Text style={styles.sectionCaption}>{caption}</Text>
      )}
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
    {action && (
      <TouchableOpacity
        onPress={action.onPress}
        style={styles.sectionActionBtn}
      >
        <Text style={styles.sectionActionText}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Divider ───────────────────────────────────────────────────────────────
export const Divider = ({ style }: { style?: ViewStyle }) => (
  <View style={[{ height: 2, backgroundColor: COLORS.black, marginVertical: SPACING.md }, style]} />
);

// ─── MetricCard ───────────────────────────────────────────────────────────
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
  const bg = variant === 'primary' ? COLORS.primary : variant === 'secondary' ? COLORS.secondary : COLORS.white;
  const textColor = variant === 'primary' ? COLORS.white : COLORS.black;

  return (
    <NeoCard bg={bg} style={[styles.metricCard, fullWidth && { flex: 1 }, style]}>
      <Text style={[styles.metricTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.metricValue, { color: textColor }]}>{value}</Text>
      {sub && <Text style={[styles.metricSub, { color: textColor }]}>{sub}</Text>}
    </NeoCard>
  );
};

// ─── Stylesheet ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  buttonBase: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    ...NEO_SHADOW.box2,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 2,
    ...NEO_SHADOW.box2,
  },
  stepperBtn: {
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    lineHeight: 18,
  },
  stepperQtyText: {
    minWidth: 28,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...NEO_SHADOW.box4,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    color: COLORS.black,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionCaption: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionActionBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  sectionActionText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  metricCard: {
    padding: SPACING.md,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});

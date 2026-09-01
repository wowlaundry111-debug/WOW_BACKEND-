// WOW Laundry — Neo-Brutalist Design System (Matching Website)
import type { ViewStyle, TextStyle } from 'react-native';
import type { OrderStatus } from '../types';

export type { Role, OrderStatus } from '../types';

// ─── Neo-Brutalist Brand Palette ──────────────────────────────────────────
export const COLORS = {
  primary:                '#0D8DE3', // Electric Blue
  onPrimary:              '#FFFFFF',
  secondary:              '#B0FF49', // Neon Lime Green
  onSecondary:            '#000000',
  
  accentLime:             '#B0FF49',
  accentBlue:             '#0D8DE3',
  black:                  '#000000',
  white:                  '#FFFFFF',
  
  primaryContainer:       '#E0F2FE',
  onPrimaryContainer:     '#0369A1',
  primaryFixed:           '#B2EBF2',
  primaryFixedDim:        '#80DEEA',
  onPrimaryFixed:         '#004D40',
  onPrimaryFixedVariant:  '#00838F',

  secondaryContainer:     '#F0FDF4',
  onSecondaryContainer:   '#15803D',
  secondaryFixed:         '#DCEDC8',
  secondaryFixedDim:      '#C5E1A5',
  onSecondaryFixed:       '#1B5E20',
  onSecondaryFixedVariant:'#558B2F',

  tertiary:               '#111827',
  onTertiary:             '#FFFFFF',
  tertiaryContainer:      '#F3F4F6',
  onTertiaryContainer:    '#1F2937',

  error:                  '#DC2626',
  onError:                '#FFFFFF',
  errorContainer:         '#FEE2E2',
  onErrorContainer:       '#7F1D1D',

  background:             '#FFFFFF',
  bgMint:                 '#F0FDF4',
  onBackground:           '#000000',
  surface:                '#FFFFFF',
  surfaceBright:          '#FFFFFF',
  surfaceDim:             '#F3F4F6',
  surfaceTint:            '#0D8DE3',

  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow:    '#F9FAFB',
  surfaceContainer:       '#F3F4F6',
  surfaceContainerHigh:   '#E5E7EB',
  surfaceContainerHighest:'#D1D5DB',

  onSurface:              '#000000',
  onSurfaceVariant:       '#374151',
  outline:                '#000000',
  outlineVariant:         '#E5E7EB',
  surfaceVariant:         '#F9FAFB',

  inverseSurface:         '#000000',
  inverseOnSurface:       '#FFFFFF',
  inversePrimary:         '#B0FF49',
};

// ─── Neo-Brutalist Hard Drop Shadows ──────────────────────────────────────
export const NEO_SHADOW = {
  box2: {
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  } as ViewStyle,
  box4: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  } as ViewStyle,
  box6: {
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  } as ViewStyle,
  box8: {
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  } as ViewStyle,
  boxLime4: {
    shadowColor: '#B0FF49',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  } as ViewStyle,
  boxLime6: {
    shadowColor: '#B0FF49',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  } as ViewStyle,
  boxBlue4: {
    shadowColor: '#0D8DE3',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  } as ViewStyle,
};

// Backward-compatible SHADOW export
export const SHADOW = {
  ambient: NEO_SHADOW.box4,
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  } as ViewStyle),
};

export const GLASS = {
  background: '#FFFFFF',
  border: '#000000',
  shadow: NEO_SHADOW.box4,
};

export const GRADIENTS = {
  primary:   ['#0D8DE3', '#38BDF8'] as const,
  secondary: ['#B0FF49', '#CCFF66'] as const,
  tertiary:  ['#111827', '#374151'] as const,
  error:     ['#DC2626', '#EF4444'] as const,
  surface:   ['#FFFFFF', '#FFFFFF'] as const,
  chartBar:  ['#0D8DE3', '#B0FF49'] as const,
};

export const SPACING = {
  base:   4,
  xs:     8,
  sm:     12,
  md:     16,
  lg:     24,
  xl:     32,
  mobile: 16,
  gutter: 12,
};

export const spacing = SPACING;

export const RADIUS = {
  xs:     6,
  sm:     10,
  md:     14,
  lg:     18,
  xl:     24,
  xxl:    32,
  full:   9999,
};

export const radius = RADIUS;

export const colors = COLORS;

export const TYPO = {
  displaySm:      { fontSize: 34, lineHeight: 42, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily: 'Outfit_800ExtraBold' },
  headlineLg:     { fontSize: 30, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily: 'Outfit_800ExtraBold' },
  headlineLgMob:  { fontSize: 26, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily: 'Outfit_800ExtraBold' },
  headlineMd:     { fontSize: 22, lineHeight: 30, fontWeight: '800' as const, letterSpacing: -0.3, fontFamily: 'Outfit_800ExtraBold' },
  headlineSm:     { fontSize: 19, lineHeight: 26, fontWeight: '800' as const, letterSpacing: -0.2, fontFamily: 'Outfit_700Bold' },
  titleLg:        { fontSize: 17, lineHeight: 23, fontWeight: '700' as const, letterSpacing: 0, fontFamily: 'Outfit_700Bold' },
  labelLg:        { fontSize: 15, lineHeight: 20, fontWeight: '700' as const, letterSpacing: 0.2, fontFamily: 'Outfit_700Bold' },
  labelMd:        { fontSize: 13, lineHeight: 18, fontWeight: '700' as const, letterSpacing: 0.3, fontFamily: 'Outfit_600SemiBold' },
  labelSm:        { fontSize: 12, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 0.5, fontFamily: 'Outfit_600SemiBold' },
  labelXs:        { fontSize: 10, lineHeight: 14, fontWeight: '800' as const, letterSpacing: 0.5, fontFamily: 'Outfit_700Bold' },
  bodyLg:         { fontSize: 16, lineHeight: 24, fontWeight: '500' as const, letterSpacing: 0.1, fontFamily: 'Outfit_500Medium' },
  bodyMd:         { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 0.2, fontFamily: 'Outfit_500Medium' },
};

export const typo = TYPO;

// ─── Order Status Config Matching Website ─────────────────────────────────
export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  PLACED:           { label: 'Pending',           color: '#000000', bg: '#FACC15', border: '#000000' },
  ACCEPTED:         { label: 'Accepted',          color: '#FFFFFF', bg: '#0D8DE3', border: '#000000' },
  PICKUP_ASSIGNED:  { label: 'Out for Pickup',    color: '#000000', bg: '#C084FC', border: '#000000' },
  PICKED_UP:        { label: 'Picked Up',         color: '#000000', bg: '#2DD4BF', border: '#000000' },
  WASHING:          { label: 'In Processing',     color: '#000000', bg: '#F472B6', border: '#000000' },
  IRONING:          { label: 'Pressing',          color: '#000000', bg: '#FB923C', border: '#000000' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: '#000000', bg: '#FB923C', border: '#000000' },
  DELIVERED:        { label: 'Delivered',         color: '#000000', bg: '#B0FF49', border: '#000000' },
};

export const ADMIN_TABS = [
  { key: 'global',    label: 'Global' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'catalog',   label: 'Catalog' },
  { key: 'orders',    label: 'Orders' },
  { key: 'shop',      label: 'Shop' },
] as const;

export type AdminTab = typeof ADMIN_TABS[number]['key'];

// WOW Laundry — Design System
// Exact Material Design 3 color palette extracted from Stitch mockups.
// Font: Plus Jakarta Sans (matches Stitch screens)

import type { ViewStyle, TextStyle } from 'react-native';
import type { OrderStatus } from '../types';

// Re-export canonical types so screens can import from either Theme or types directly
export type { Role, OrderStatus } from '../types';


// ─── MD3 Color Tokens (Zepto/Blinkit High Contrast Vibe) ───────────────────
export const COLORS = {
  primary:                '#00A8E8', // Vibrant Cyan
  onPrimary:              '#FFFFFF',
  primaryContainer:       '#E0F7FA',
  onPrimaryContainer:     '#006064',
  primaryFixed:           '#B2EBF2',
  primaryFixedDim:        '#80DEEA',
  onPrimaryFixed:         '#004D40',
  onPrimaryFixedVariant:  '#00838F',

  secondary:              '#8CC63F', // Lime Green
  onSecondary:            '#FFFFFF',
  secondaryContainer:     '#F1F8E9',
  onSecondaryContainer:   '#33691E',
  secondaryFixed:         '#DCEDC8',
  secondaryFixedDim:      '#C5E1A5',
  onSecondaryFixed:       '#1B5E20',
  onSecondaryFixedVariant:'#558B2F',

  tertiary:               '#111827',
  onTertiary:             '#FFFFFF',
  tertiaryContainer:      '#F3F4F6',
  onTertiaryContainer:    '#1F2937',
  tertiaryFixed:          '#F9FAFB',
  tertiaryFixedDim:       '#E5E7EB',
  onTertiaryFixed:        '#030712',
  onTertiaryFixedVariant: '#374151',

  error:                  '#DC2626',
  onError:                '#FFFFFF',
  errorContainer:         '#FEE2E2',
  onErrorContainer:       '#7F1D1D',

  background:             '#F3F4F6', // Lighter grey for contrast
  onBackground:           '#111827',
  surface:                '#FFFFFF', // Pure white cards
  surfaceBright:          '#FFFFFF',
  surfaceDim:             '#E5E7EB',
  surfaceTint:            '#00A8E8',

  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow:    '#F9FAFB',
  surfaceContainer:       '#F3F4F6',
  surfaceContainerHigh:   '#E5E7EB',
  surfaceContainerHighest:'#D1D5DB',

  onSurface:              '#111827',
  onSurfaceVariant:       '#4B5563',
  outline:                '#D1D5DB',
  outlineVariant:         '#E5E7EB',
  surfaceVariant:         '#F3F4F6',

  inverseSurface:         '#1F2937',
  inverseOnSurface:       '#F9FAFB',
  inversePrimary:         '#80DEEA',
};

// ─── Glowing HSL Gradients (world-class modern palette) ──────────────────────
export const GRADIENTS = {
  primary:   ['#00A8E8', '#4DD0E1'] as const,   // Cyan Glow
  secondary: ['#8CC63F', '#AED581'] as const,   // Lime Glow
  tertiary:  ['#4B5563', '#9CA3AF'] as const,   // Charcoal Metallic
  error:     ['#DC2626', '#F87171'] as const,   // Electric Red
  surface:   ['#FFFFFF', '#F3F4F6'] as const,   // Frosted Pearl
  chartBar:  ['#00A8E8', '#80DEEA'] as const,   // Chart Bar Fill
};

// ─── Glass Card Style (Web-compatible Backdrop-Blur CSS spec) ────────────────
export const GLASS = {
  background: 'rgba(255, 255, 255, 0.65)',
  border: 'rgba(255, 255, 255, 0.40)',
  shadow: {
    boxShadow: '0px 8px 24px rgba(96, 74, 192, 0.05)',
  } as object,
};

// ─── Ambient Shadow (glowing micro-shadowing) ───────────────────────────────
export const SHADOW = {
  ambient: {
    boxShadow: '0px 6px 20px rgba(0, 168, 232, 0.08)',
  } as object,
  glow: (color: string) => ({
    boxShadow: `0px 8px 18px ${color}38`,
  } as object),
};

// ─── Spacing Tokens ──────────────────────────────────────────────────────────
export const SPACING = {
  base:   4,
  xs:     8,
  sm:     12,
  md:     16,
  lg:     24,
  xl:     32,
  mobile: 16,   // Dense padding for quick-commerce apps
  gutter: 12,   // Tighter gaps
};

// ─── Border Radius Tokens ────────────────────────────────────────────────────
export const RADIUS = {
  sm:     12,
  md:     16,
  lg:     24,
  xl:     32,
  xxl:    40,
  full:   9999,
};

// ─── Typography Scale (Outfit layout) ─────────────────────────────
export const TYPO = {
  displaySm:      { fontSize: 36, lineHeight: 44, fontWeight: '800' as const, letterSpacing: -1, fontFamily: 'Outfit_800ExtraBold' },
  headlineLg:     { fontSize: 32, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily: 'Outfit_800ExtraBold' },
  headlineLgMob:  { fontSize: 28, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily: 'Outfit_800ExtraBold' },
  headlineMd:     { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.5, fontFamily: 'Outfit_700Bold' },
  headlineSm:     { fontSize: 20, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.2, fontFamily: 'Outfit_700Bold' },
  titleLg:        { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: 0, fontFamily: 'Outfit_600SemiBold' },
  labelLg:        { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.2, fontFamily: 'Outfit_600SemiBold' },
  labelMd:        { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0.2, fontFamily: 'Outfit_500Medium' },
  labelSm:        { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.5, fontFamily: 'Outfit_500Medium' },
  labelXs:        { fontSize: 10, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0, fontFamily: 'Outfit_600SemiBold' },
  bodyLg:         { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, letterSpacing: 0.1, fontFamily: 'Outfit_400Regular' },
  bodyMd:         { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, letterSpacing: 0.2, fontFamily: 'Outfit_400Regular' },
};

// ─── Order Status Config ─────────────────────────────────────────────────────
export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PLACED:           { label: 'Order Placed',       color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  ACCEPTED:         { label: 'Accepted',            color: COLORS.primary, bg: 'rgba(96,74,192,0.08)' },
  PICKUP_ASSIGNED:  { label: 'Driver Assigned',     color: COLORS.secondary, bg: 'rgba(8,104,120,0.08)' },
  PICKED_UP:        { label: 'Picked Up',           color: '#06B6D4', bg: 'rgba(6,182,212,0.08)' },
  WASHING:          { label: 'In Wash Cycle',       color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  IRONING:          { label: 'Steam Pressing',      color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',    color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  DELIVERED:        { label: 'Delivered',           color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
};

// ─── Bottom Nav Tabs per Role ────────────────────────────────────────────────
export const ADMIN_TABS = [
  { key: 'global',    label: 'Global' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'catalog',   label: 'Catalog' },
  { key: 'orders',    label: 'Orders' },
  { key: 'shop',      label: 'Shop' },
] as const;

export type AdminTab = typeof ADMIN_TABS[number]['key'];

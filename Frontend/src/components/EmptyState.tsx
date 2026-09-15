import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPO } from './Theme';

interface EmptyStateProps {
  icon: any;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, subtitle }) => {
  return (
    <View style={styles.root}>
      <View style={styles.iconCircle}>
        <Icon size={48} color={COLORS.outline} />
      </View>
      <Text style={[TYPO.headlineSm, { color: COLORS.onSurfaceVariant, marginTop: SPACING.lg, textAlign: 'center', fontWeight: '700' }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginTop: SPACING.xs, textAlign: 'center', paddingHorizontal: SPACING.xl }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

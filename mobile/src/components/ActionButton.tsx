import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize } from '../theme';

interface Props {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  variant?: 'filled' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function ActionButton({
  label,
  icon,
  onPress,
  color = colors.primary,
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}: Props) {
  const sizeStyles = {
    sm: { paddingH: spacing.sm, paddingV: spacing.xs + 2, font: fontSize.xs, iconSize: 14 },
    md: { paddingH: spacing.lg, paddingV: spacing.md, font: fontSize.sm, iconSize: 16 },
    lg: { paddingH: spacing.xl, paddingV: spacing.lg, font: fontSize.md, iconSize: 18 },
  }[size];

  const isFilled = variant === 'filled';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          paddingHorizontal: sizeStyles.paddingH,
          paddingVertical: sizeStyles.paddingV,
          backgroundColor: isFilled ? color : 'transparent',
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? color : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && { flex: 1 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFilled ? '#fff' : color} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={isFilled ? '#fff' : color}
            />
          )}
          <Text
            style={[
              styles.label,
              {
                fontSize: sizeStyles.font,
                color: isFilled ? '#fff' : color,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.md,
  },
  label: {
    fontWeight: '600',
  },
});

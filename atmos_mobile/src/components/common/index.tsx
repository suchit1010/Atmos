import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow, getGradeColor } from '../../theme';

// ─── Button ───────────────────────────────────────────
interface ButtonProps {
  label:     string;
  onPress:   () => void;
  variant?:  'primary' | 'secondary' | 'ghost' | 'danger';
  size?:     'sm' | 'md' | 'lg';
  loading?:  boolean;
  disabled?: boolean;
  style?:    ViewStyle;
  icon?:     React.ReactNode;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, style, icon,
}: ButtonProps) {
  const heights = { sm: 38, md: 48, lg: 56 };
  const textSizes = { sm: Typography.labelSm, md: Typography.labelMd, lg: Typography.labelLg };
  const h = heights[size];
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [{ opacity: pressed || isDisabled ? 0.7 : 1 }, style]}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, { height: h, borderRadius: h / 2 }, Shadow.green]}
        >
          {loading
            ? <ActivityIndicator color="#040C06" size="small" />
            : <>
                {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                <Text style={[textSizes[size], { color: '#040C06', fontWeight: '700' }]}>
                  {label}
                </Text>
              </>
          }
        </LinearGradient>
      </Pressable>
    );
  }

  const variantStyle: ViewStyle = {
    secondary: { backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primaryGlow },
    ghost:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
    danger:    { backgroundColor: Colors.errorDim,  borderWidth: 1, borderColor: Colors.error },
  }[variant] || {};

  const textColor = {
    secondary: Colors.primary,
    ghost:     Colors.textMuted,
    danger:    Colors.error,
  }[variant] || Colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn, variantStyle, { height: h, borderRadius: h / 2, opacity: pressed || isDisabled ? 0.6 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text style={[textSizes[size], { color: textColor, fontWeight: '600' }]}>{label}</Text>
          </>
      }
    </Pressable>
  );
}

// ─── Card ─────────────────────────────────────────────
interface CardProps {
  children:    React.ReactNode;
  style?:      ViewStyle;
  padding?:    number;
  onPress?:    () => void;
  glowGreen?:  boolean;
}

export function Card({ children, style, padding = Spacing.lg, onPress, glowGreen }: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     glowGreen ? Colors.borderBright : Colors.border,
    padding,
    ...(glowGreen ? Shadow.green : Shadow.sm),
    ...style,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.8 : 1 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ─── Input ────────────────────────────────────────────
interface InputProps {
  label?:       string;
  value:        string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  multiline?:   boolean;
  maxLength?:   number;
  right?:       React.ReactNode;
  error?:       string;
  style?:       ViewStyle;
}

export function Input({
  label, value, onChangeText, placeholder, keyboardType,
  secureTextEntry, multiline, maxLength, right, error, style,
}: InputProps) {
  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && (
        <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputContainer,
        error ? { borderColor: Colors.error } : {},
      ]}>
        <TextInput
          style={[styles.input, multiline ? { height: 100, textAlignVertical: 'top' } : {}]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textDim}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          maxLength={maxLength}
        />
        {right && <View style={{ marginLeft: Spacing.sm }}>{right}</View>}
      </View>
      {error && (
        <Text style={[Typography.bodyXs, { color: Colors.error, marginTop: 4 }]}>{error}</Text>
      )}
    </View>
  );
}

// ─── Grade Badge ──────────────────────────────────────
export function GradeBadge({ grade, size = 'md' }: { grade: string; size?: 'sm' | 'md' | 'lg' }) {
  const { color, bg } = getGradeColor(grade);
  const sizes = { sm: { px: 8, py: 3, text: 10 }, md: { px: 10, py: 4, text: 12 }, lg: { px: 14, py: 6, text: 14 } };
  const s = sizes[size];

  return (
    <View style={{
      backgroundColor: bg, borderRadius: Radius.sm,
      paddingHorizontal: s.px, paddingVertical: s.py,
      borderWidth: 1, borderColor: color + '40',
    }}>
      <Text style={[Typography.labelXs, { color, fontSize: s.text, fontWeight: '700' }]}>
        {grade}
      </Text>
    </View>
  );
}

// ─── Status Badge ─────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    draft:       { color: Colors.textMuted, bg: Colors.white06,      label: 'Draft' },
    submitted:   { color: Colors.info,      bg: Colors.infoDim,      label: 'Submitted' },
    analyzing:   { color: Colors.warning,   bg: Colors.warningDim,   label: 'Analyzing' },
    ai_complete: { color: Colors.satellite, bg: Colors.satelliteDim, label: 'AI Done' },
    zk_generated:{ color: Colors.zkPurple,  bg: Colors.zkDim,        label: 'ZK Proven' },
    verified:    { color: Colors.primary,   bg: Colors.primaryDim,   label: 'Verified' },
    listed:      { color: Colors.primary,   bg: Colors.primaryDim,   label: 'Listed' },
    sold:        { color: Colors.gradeS,    bg: Colors.gradeSBg,     label: 'Sold' },
    rejected:    { color: Colors.error,     bg: Colors.errorDim,     label: 'Rejected' },
  };
  const cfg = map[status] || { color: Colors.textMuted, bg: Colors.white06, label: status };
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={[Typography.labelXs, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
      <Text style={[Typography.labelMd, { color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[Typography.labelSm, { color: Colors.primary }]}>{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md }, style]} />;
}

// ─── Chip ─────────────────────────────────────────────
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: Spacing.md,
        paddingVertical:   Spacing.xs,
        borderRadius:      Radius.full,
        backgroundColor:   active ? Colors.primaryDim : Colors.bgInput,
        borderWidth:       1,
        borderColor:       active ? Colors.primary : Colors.border,
        marginRight:       Spacing.xs,
      }}
    >
      <Text style={[Typography.labelSm, { color: active ? Colors.primary : Colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  inputContainer: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bgInput,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex:     1,
    height:   50,
    ...Typography.bodyMd,
    color:    Colors.text,
  },
});

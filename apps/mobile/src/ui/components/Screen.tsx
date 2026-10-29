import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { layout } from '@/ui/tokens';
import { useTheme } from '@/ui/useTheme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  ambient?: boolean;
  keyboard?: boolean;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  style,
  contentStyle,
  ambient = true,
  keyboard = false,
}: ScreenProps) {
  const { theme, themeName } = useTheme();
  const showAmbient = ambient && themeName !== 'contrast';

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        padded && { paddingHorizontal: layout.gutter },
        styles.scrollContent,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        padded && { paddingHorizontal: layout.gutter },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: theme.bg }, style]}
    >
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {showAmbient ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={[
              styles.wash,
              {
                backgroundColor: theme.accent,
                opacity: theme.mode === 'dark' ? 0.045 : 0.02,
                top: -190,
                right: -140,
              },
            ]}
          />
          <View
            style={[
              styles.wash,
              {
                backgroundColor: theme.info,
                bottom: -220,
                left: -160,
                opacity: theme.mode === 'dark' ? 0.025 : 0.012,
              },
            ]}
          />
        </View>
      ) : null}
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  wash: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    opacity: 0.045,
  },
});

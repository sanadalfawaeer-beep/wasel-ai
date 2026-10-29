import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useTheme } from '@/ui/useTheme';
import { IconButton } from './IconButton';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { theme, fs, isRTL } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          onPress={onClose}
          accessible={false}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, space.lg),
            },
          ]}
        >
          <View
            style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <Text
              maxFontSizeMultiplier={1.6}
              style={[
                styles.title,
                {
                  color: theme.text,
                  fontSize: fs(22),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {title}
            </Text>
            <IconButton
              label="Close"
              onPress={onClose}
              size={44}
              variant="ghost"
              icon={(color) => <X size={22} color={color} />}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  title: { fontFamily: fontFamily.semibold, flex: 1 },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
});

import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/ui/useTheme';

export function BrandMark({ size = 32 }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden>
      <Path
        d="M5 25 V17 Q5 11 11 11 H20 Q26 11 26 5"
        stroke={theme.accent}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={26} cy={5.5} r={3.2} fill={theme.text} />
      <Circle cx={5} cy={25.5} r={2.2} fill={theme.accent} />
    </Svg>
  );
}

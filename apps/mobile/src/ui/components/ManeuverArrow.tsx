import Svg, { Circle, Path } from 'react-native-svg';
import type { CueKind } from '@/types';

interface ManeuverArrowProps {
  kind: CueKind;
  size?: number;
  color: string;
}

function isLeft(kind: CueKind): boolean {
  return kind.includes('LEFT');
}

function isRight(kind: CueKind): boolean {
  return kind.includes('RIGHT');
}

export function ManeuverArrow({ kind, size = 112, color }: ManeuverArrowProps) {
  if (kind === 'ARRIVE') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
        <Circle cx={50} cy={50} r={33} stroke={color} strokeWidth={8} fill="none" />
        <Path
          d="M33 51 L45 63 L68 37"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (kind.startsWith('UTURN')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
        <Path
          d="M30 88 V56 Q30 30 56 30 Q82 30 82 56 V66"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M66 52 L82 68 L98 52"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (isLeft(kind)) {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
        <Path
          d="M68 88 V58 Q68 36 46 36 H28"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M42 20 L24 36 L42 52"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (isRight(kind)) {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
        <Path
          d="M32 88 V58 Q32 36 54 36 H72"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M58 20 L76 36 L58 52"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden>
      <Path
        d="M50 88 V22"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M32 40 L50 22 L68 40"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

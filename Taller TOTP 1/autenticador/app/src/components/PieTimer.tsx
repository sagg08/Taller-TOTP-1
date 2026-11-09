import { Circle, Svg } from "react-native-svg";
import { palette } from "../styles/palette";

export function PieTimer({ remaining }: { remaining: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remaining / 30));
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r={radius} fill={palette.white} stroke="#CBD5E1" strokeWidth="8" />
      <Circle cx="40" cy="40" r={radius} fill="none" stroke={palette.gold} strokeWidth="8"
        strokeDasharray={`${circumference * progress} ${circumference}`} strokeLinecap="round"
        transform="rotate(-90 40 40)" />
    </Svg>
  );
}

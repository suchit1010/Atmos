import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, ClipPath, G } from 'react-native-svg';

interface AtmosLogoProps {
  size?: number;
  color?: string;
  /** If true renders on a dark green gradient bg (splash screen) */
  withBackground?: boolean;
}

/**
 * ATMOS Protocol — Flower of Life sacred geometry mark.
 * Seven overlapping circles clipped to an outer boundary ring,
 * matching the silver logo on the green background in the brand assets.
 */
export function AtmosLogo({ size = 40, color = '#22C55E', withBackground = false }: AtmosLogoProps) {
  // All geometry normalised to 100×100 viewBox, scaled by `size`
  // Outer ring radius: 46
  // Inner circle radius: 23.4  (= 46 * sin60° ≈ half of outer)
  // The 6 petal circle centres are at distance 23.4 from centre (200,200 in 400-space → 50,50 in 100-space)
  const cx = 50;
  const cy = 50;
  const outerR = 46;
  const innerR = 23.4;

  // 6 petal positions at angles 90°, 30°, 330°, 270°, 210°, 150°
  const angles = [90, 30, 330, 270, 210, 150];
  const petals = angles.map(a => {
    const rad = (a * Math.PI) / 180;
    return { px: cx + innerR * Math.cos(rad), py: cy - innerR * Math.sin(rad) };
  });

  const strokeW = 1.4;
  const strokeColor = withBackground ? '#ffffff' : color;
  const outerStrokeW = 1.8;

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        <Defs>
          <ClipPath id="atmosClip">
            <Circle cx={cx} cy={cy} r={outerR - 0.5} />
          </ClipPath>
        </Defs>

        {/* Outer boundary ring */}
        <Circle
          cx={cx} cy={cy} r={outerR}
          fill="none" stroke={strokeColor} strokeWidth={outerStrokeW}
        />

        {/* Centre circle */}
        <Circle
          cx={cx} cy={cy} r={innerR}
          fill="none" stroke={strokeColor} strokeWidth={strokeW}
          clipPath="url(#atmosClip)"
        />

        {/* 6 petal circles */}
        {petals.map((p, i) => (
          <Circle
            key={i}
            cx={p.px} cy={p.py} r={innerR}
            fill="none" stroke={strokeColor} strokeWidth={strokeW}
            clipPath="url(#atmosClip)"
          />
        ))}
      </Svg>
    </View>
  );
}

/**
 * Full lockup: logo mark + wordmark stacked or side-by-side.
 */
export function AtmosWordmark({ size = 40, horizontal = false }: { size?: number; horizontal?: boolean }) {
  const { View, Text } = require('react-native');
  const nameSize  = Math.round(size * 0.55);
  const subSize   = Math.round(size * 0.22);

  if (horizontal) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AtmosLogo size={size} />
        <View>
          <Text style={{ fontSize: nameSize, fontWeight: '700', color: '#22C55E', letterSpacing: -0.5 }}>
            ATMOS
          </Text>
          <Text style={{ fontSize: subSize, fontWeight: '400', color: '#6B9B74', letterSpacing: 3 }}>
            PROTOCOL
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <AtmosLogo size={size} />
      <Text style={{ fontSize: nameSize, fontWeight: '700', color: '#22C55E', letterSpacing: -0.5, marginTop: 10 }}>
        ATMOS
      </Text>
      <Text style={{ fontSize: subSize, fontWeight: '400', color: '#6B9B74', letterSpacing: 3, marginTop: 2 }}>
        PROTOCOL
      </Text>
    </View>
  );
}

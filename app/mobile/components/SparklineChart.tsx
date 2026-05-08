import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline, Defs, LinearGradient, Stop, Polygon } from "react-native-svg";

interface SparklineChartProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
  positive?: boolean;
}

export function SparklineChart({
  data,
  width,
  height,
  color,
  positive = true,
}: SparklineChartProps) {
  if (!data || data.length < 2) return <View style={{ width, height }} />;

  const lineColor = color ?? (positive ? "#0DFF6E" : "#FF4444");
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padH = 4;
  const padV = 4;

  const points = data.map((v, i) => {
    const x = padH + (i / (data.length - 1)) * (width - padH * 2);
    const y = padV + ((max - v) / range) * (height - padV * 2);
    return `${x},${y}`;
  });

  const lastX = padH + ((data.length - 1) / (data.length - 1)) * (width - padH * 2);
  const polyPoints = [
    `${padH},${height}`,
    ...points,
    `${lastX},${height}`,
  ].join(" ");

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Polygon points={polyPoints} fill="url(#grad)" />
      <Polyline
        points={points.join(" ")}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({});

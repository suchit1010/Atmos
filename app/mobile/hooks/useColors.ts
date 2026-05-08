import colors from "@/constants/colors";

type ColorPalette = typeof colors.light & { radius: number };

export function useColors(): ColorPalette {
  return { ...colors.dark, radius: colors.radius };
}

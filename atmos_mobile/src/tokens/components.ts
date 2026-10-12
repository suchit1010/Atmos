/**
 * ATMOS Component Tokens
 * Component-specific overrides and specs
 */

export const ComponentTokens = {
  button: {
    height: { sm: 32, md: 44, lg: 52 },
    paddingX: { sm: 12, md: 16, lg: 24 },
    radius: 10,
    font: { sm: 13, md: 15, lg: 16 },
    fontWeight: '600',
  },
  input: {
    height: 48,
    paddingX: 14,
    paddingY: 12,
    radius: 10,
    fontSize: 15,
    labelSize: 12,
    labelWeight: '500',
    errorSize: 12,
  },
  card: {
    padding: { sm: 12, md: 16, lg: 20 },
    radius: 16,
    gap: 12,
  },
  bottomSheet: {
    handleHeight: 4,
    handleWidth: 36,
    handleRadius: 2,
    headerHeight: 56,
    minPeekHeight: 80,
  },
  modal: {
    radius: 24,
    padding: 24,
    overlayOpacity: 0.85,
  },
  toast: {
    height: 52,
    padding: 14,
    radius: 12,
    duration: 3500,
  },
  tab: {
    height: 52,
    iconSize: 22,
    labelSize: 10,
    gap: 4,
  },
  otp: {
    boxSize: 56,
    boxGap: 12,
    fontSize: 24,
    borderWidth: 2,
  },
} as const;

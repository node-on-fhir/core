// imports/ui/theme/authOverrides.js
//
// MUI theme overrides for the auth surfaces ONLY (landing doors, AuthCard,
// WelcomeStep) — the one-door onboarding design handoff, 2026-11-01. Applied
// via AuthThemeScope (nested ThemeProvider); the global CustomThemeProvider
// palette is untouched. Material-3-leaning tokens on top of the dark theme.

export const authPalette = {
  bone: '#D9D2BF',          // primary fill (matches the fingerprint ring)
  boneHover: '#E6E0CF',
  ink: '#141413',           // text on bone
  surface0: '#141414',      // page
  surface1: '#1E1E1E',      // card
  surface2: '#262626',      // inputs, tiles
  outline: '#3A3832',
  textPrimary: '#ECE7DB',
  textSecondary: '#A8A295',
  textDisabled: '#6F6A60',  // 3.3:1 on surface1 — legal line at 14px+ only
  success: '#9FD6B8',
};

export const authOverrides = {
  shape: { borderRadius: 14 },
  palette: {
    primary: { main: authPalette.bone, contrastText: authPalette.ink },
    success: { main: authPalette.success },
    background: { default: authPalette.surface0, paper: authPalette.surface1 },
    text: {
      primary: authPalette.textPrimary,
      secondary: authPalette.textSecondary,
      disabled: authPalette.textDisabled,
    },
    divider: '#2E2E2E',
  },
  typography: {
    button: { textTransform: 'none', fontWeight: 600, fontSize: 17, letterSpacing: 0.2 },
    h4: { fontSize: 36, lineHeight: '42px', fontWeight: 600, letterSpacing: -0.3 },
    h5: { fontSize: 26, lineHeight: '32px', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'large' },
      styleOverrides: {
        root: { minHeight: 56, borderRadius: 14, paddingInline: 22 },
        sizeLarge: { minHeight: 60 },
        containedPrimary: { '&:hover': { backgroundColor: authPalette.boneHover } },
        outlined: {
          borderWidth: 1.5,
          borderColor: authPalette.outline,
          color: authPalette.textPrimary,
          '&:hover': { borderWidth: 1.5, backgroundColor: 'rgba(217,210,191,0.06)' },
        },
        text: { minHeight: 48, color: '#B9B3A5' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: authPalette.surface2,
          borderRadius: 14,
          minHeight: 60,
          fontSize: 18,
          '& fieldset': { borderColor: authPalette.outline, borderWidth: 1.5 },
          '&:hover fieldset': { borderColor: '#5A574F' },
          '&.Mui-focused fieldset': { borderColor: authPalette.bone, borderWidth: 1.5 },
        },
        input: { paddingBlock: 18 },
      },
    },
    MuiInputLabel: { defaultProps: { shrink: true } },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: 12, marginInline: 2 } } },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 20 },
        outlined: { borderColor: '#2E2E2E' },
      },
    },
    MuiChip: { styleOverrides: { root: { height: 28, fontWeight: 600, letterSpacing: 0.4 } } },
    MuiLinearProgress: {
      styleOverrides: { root: { height: 5, borderRadius: 3, backgroundColor: '#2E2E2E' } },
    },
  },
};

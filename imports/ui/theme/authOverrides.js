// imports/ui/theme/authOverrides.js
//
// MUI theme overrides for the auth surfaces ONLY (landing doors, AuthCard,
// WelcomeStep) — the one-door onboarding design handoff, 2026-11-01. Applied
// via AuthThemeScope (nested ThemeProvider); the global CustomThemeProvider
// palette is untouched. Material-3-leaning tokens on top of the dark theme.

// Two mode variants of the same bone family. The handoff specified the dark
// set; the light set is derived so the auth surfaces render correctly when
// the app is in light mode (same bone primary + ink, warm paper surfaces).
export const authPaletteDark = {
  bone: '#D9D2BF',          // primary fill (matches the fingerprint ring)
  boneHover: '#E6E0CF',
  ink: '#141413',           // text on bone
  surface0: '#141414',      // page
  surface1: '#1E1E1E',      // card
  surface2: '#2A2A27',      // inputs, tiles — lifted above surface1 so
                            // outlined tiles READ as tiles on the dark page
  outline: '#4A4740',       // strong enough to delineate on #141414
  textPrimary: '#ECE7DB',
  textSecondary: '#A8A295',
  textDisabled: '#6F6A60',  // 3.3:1 on surface1 — legal line at 14px+ only
  success: '#9FD6B8',
  divider: '#2E2E2E',
};

export const authPaletteLight = {
  bone: '#D9D2BF',
  boneHover: '#CEC6AE',     // hover darkens on light backgrounds
  ink: '#141413',
  surface0: '#FAF8F3',      // page
  surface1: '#FFFFFF',      // card
  surface2: '#F2EFE7',      // inputs, tiles — warm offset from white
  outline: '#D9D4C5',
  textPrimary: '#2B2923',
  textSecondary: '#6E6A5F',
  textDisabled: '#A09B8E',
  success: '#2E7D5B',       // dark enough for text contrast on light
  divider: '#E6E2D6',
};

// Back-compat: the dark set is the canonical handoff palette.
export const authPalette = authPaletteDark;

export function buildAuthOverrides(mode) {
  const p = mode === 'dark' ? authPaletteDark : authPaletteLight;
  const isDark = mode === 'dark';

  return {
    shape: { borderRadius: 14 },
    palette: {
      mode: mode,
      primary: { main: p.bone, contrastText: p.ink },
      success: { main: p.success },
      background: { default: p.surface0, paper: p.surface1 },
      text: {
        primary: p.textPrimary,
        secondary: p.textSecondary,
        disabled: p.textDisabled,
      },
      divider: p.divider,
    },
    typography: {
      button: { textTransform: 'none', fontWeight: 600, fontSize: 14, letterSpacing: 0.2 },
      h4: { fontSize: 27, lineHeight: '33px', fontWeight: 600, letterSpacing: -0.3 },
      h5: { fontSize: 19, lineHeight: '25px', fontWeight: 600 },
      body1: { fontSize: 15 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true, size: 'large' },
        styleOverrides: {
          root: { minHeight: 56, borderRadius: 14, paddingInline: 22 },
          sizeLarge: { minHeight: 60 },
          containedPrimary: { '&:hover': { backgroundColor: p.boneHover } },
          outlined: {
            borderWidth: 1.5,
            borderColor: p.outline,
            color: p.textPrimary,
            '&:hover': {
              borderWidth: 1.5,
              backgroundColor: isDark ? 'rgba(217,210,191,0.06)' : 'rgba(43,41,35,0.04)',
            },
          },
          text: { minHeight: 48, color: isDark ? '#B9B3A5' : '#7C7769' },
        },
      },
      MuiOutlinedInput: {
        // Labels are globally shrink (defaultProps below), but TextField only
        // notches the outline when IT sees the shrink prop — force the notch
        // so the border breaks around the label instead of striking through.
        defaultProps: { notched: true },
        styleOverrides: {
          root: {
            backgroundColor: p.surface2,
            borderRadius: 14,
            minHeight: 56,
            fontSize: 16,
            '& fieldset': { borderColor: p.outline, borderWidth: 1.5 },
            '&:hover fieldset': { borderColor: isDark ? '#5A574F' : '#B8B2A0' },
            '&.Mui-focused fieldset': { borderColor: isDark ? p.bone : '#8A8265', borderWidth: 1.5 },
          },
          input: { paddingBlock: 16 },
        },
      },
      MuiInputLabel: {
        defaultProps: { shrink: true },
        // Keep the label above the hover/focus border highlight
        styleOverrides: { root: { zIndex: 1, pointerEvents: 'none' } },
      },
      MuiFormHelperText: { styleOverrides: { root: { fontSize: 12, marginInline: 2 } } },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 20 },
          outlined: { borderColor: p.divider },
        },
      },
      MuiChip: { styleOverrides: { root: { height: 28, fontWeight: 600, letterSpacing: 0.4 } } },
      MuiLinearProgress: {
        styleOverrides: { root: { height: 5, borderRadius: 3, backgroundColor: p.divider } },
      },
    },
  };
}

// Back-compat: the static dark overrides (original handoff shape).
export const authOverrides = buildAuthOverrides('dark');

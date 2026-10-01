// imports/ui/theme/pageModeTheme.js
//
// Build the "content ink" theme for ambiance pages: same brand accents +
// typography as the app theme, but with the mode-dependent tokens
// (text/background/divider) flipped to the forced mode. The app chrome
// (header/footer/dialogs) keeps the real mode — only zone page content
// consumes this. Promoted from DirectoryConsole's inline override.
// Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import { createTheme } from '@mui/material/styles';

export function buildPageModeTheme(appTheme, forcedMode) {
  if (!forcedMode || !appTheme || forcedMode === appTheme.palette.mode) { return appTheme; }
  return createTheme({
    palette: {
      mode: forcedMode,
      primary: appTheme.palette.primary,
      secondary: appTheme.palette.secondary,
      error: appTheme.palette.error,
      warning: appTheme.palette.warning,
      info: appTheme.palette.info,
      success: appTheme.palette.success
    },
    typography: appTheme.typography
  });
}

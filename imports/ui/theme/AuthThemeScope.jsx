// imports/ui/theme/AuthThemeScope.jsx
//
// Nested ThemeProvider scoping the one-door-auth design tokens
// (authOverrides.js) to the auth surfaces only — landing doors, AuthCard,
// WelcomeStep. The outer CustomThemeProvider theme is deep-merged under the
// overrides, so global settings (fonts, density) still flow through and the
// rest of the app is untouched.

import React, { useMemo } from 'react';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import { authOverrides } from './authOverrides';

export function AuthThemeScope({ children }) {
  const outerTheme = useTheme();

  const authTheme = useMemo(function() {
    return createTheme(deepmerge(outerTheme, authOverrides));
  }, [outerTheme]);

  return (
    <ThemeProvider theme={authTheme}>
      {children}
    </ThemeProvider>
  );
}

export default AuthThemeScope;

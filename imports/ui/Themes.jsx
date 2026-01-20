// theme.js
import { createTheme } from '@mui/material/styles';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

const themeSettings = get(Meteor, 'settings.public.theme', {});

const commonSettings = {
  typography: {
    // Define common typography settings here
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  // Add any other common settings you want across both themes
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    default: {
      main: get(Meteor, "settings.public.theme.palette.textColor", "rgb(249, 206, 106)")
    },
    standard: {
      main: get(Meteor, "settings.public.theme.palette.appBarTextColor", "#000000")
    },
    primary: {
      main: get(Meteor, "settings.public.theme.palette.primaryColor", "rgb(253, 184, 19)")
    },
    secondary: {
      main: get(Meteor, "settings.public.theme.palette.secondaryColor", "#fdb813")
    },
    background: {
      default: get(Meteor, "settings.public.theme.palette.canvasColor", "#f6f6f6"),
    },
    appbar: {
      main: get(Meteor, "settings.public.theme.palette.appBarColor", "#fdb813"),
      contrastText: get(Meteor, "settings.public.theme.palette.appBarTextColor", "#ffffff")
    }

    // Add other customizations from Meteor settings here
  },
  // Other configurations, typography, etc.
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    default: {
      main: get(Meteor, "settings.public.theme.palette.textColorDark", "rgb(195, 143, 21)")
    },
    standard: {
      main: get(Meteor, "settings.public.theme.palette.appBarTextColorDark", "#ffffff")
    },
    primary: {
      main: get(Meteor, "settings.public.theme.palette.primaryColor", "rgb(195, 143, 21)"),
    },
    secondary: {
      main: get(Meteor, "settings.public.theme.palette.secondaryColor", "#fdb813")
    },
    background: {
      default: '#333333', // Replace with your dark background color
    },
    appbar: {
      main: get(Meteor, "settings.public.theme.palette.appBarColorDark", "#fdb813"),
      contrastText: get(Meteor, "settings.public.theme.palette.appBarTextColorDark", "#ffffff")
    }
    // Add other customizations for dark mode here
  },
  // Other configurations, typography, etc.
});

export default { lightTheme, darkTheme };
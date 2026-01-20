// // ThemeContext.js
// import React, { createContext, useContext, useState, useMemo } from 'react';
// import { lightTheme, darkTheme } from './Themes';

// const ThemeContext = createContext();

// export const useThemeContext = () => useContext(ThemeContext);

// export const CustomThemeProvider = ({ children }) => {
//   const [mode, setMode] = useState('light');

//   const toggleTheme = () => {
//     setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
//   };

//   const value = useMemo(
//     () => ({
//       mode,
//       toggleTheme,
//       theme: mode === 'light' ? lightTheme : darkTheme,
//     }),
//     [mode]
//   );

//   return (
//     <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
//   );
// };


import React, { useState, Fragment, useMemo } from 'react';

import "ace-builds";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";

import { Info } from './Index'
import { useNavigate } from "react-router-dom";

import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import PaletteIcon from '@mui/icons-material/Palette';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { history, useTheme } from './App';
import { alpha } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Wheel from '@uiw/react-color-wheel';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { hsvaToHex } from '@uiw/color-convert';


export function ThemingPage(){
  const navigate = useNavigate();
  const { theme: themeMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isPreviewingTheme, setIsPreviewingTheme] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerField, setColorPickerField] = useState('');
  const [tempColor, setTempColor] = useState({ h: 214, s: 43, v: 90, a: 1 });
  const [previewThemeMode, setPreviewThemeMode] = useState('light');
  
  // State for settings - ensure we have theme structure
  const [settings, setSettings] = useState(() => {
    const meteorSettings = JSON.parse(JSON.stringify(get(Meteor, 'settings', {})));
    
    // Ensure the theme structure exists
    if (!meteorSettings.public) {
      meteorSettings.public = {};
    }
    if (!meteorSettings.public.theme) {
      meteorSettings.public.theme = {};
    }
    if (!meteorSettings.public.theme.palette) {
      meteorSettings.public.theme.palette = {};
    }
    
    return meteorSettings;
  });
  
  // Get preview mode from state
  const isDark = previewThemeMode === 'dark';
  
  // Helper function to validate and provide fallback for color values
  const validateColor = (color, fallback) => {
    if (!color || color.trim() === '') return fallback;
    
    // Check if it's a valid hex color (3 or 6 digits)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (color.startsWith('#') && !hexRegex.test(color)) {
      // If it starts with # but isn't valid yet, use fallback
      return fallback;
    }
    
    // Check if it's a valid rgb/rgba color
    const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
    if (color.startsWith('rgb') && !rgbRegex.test(color)) {
      // If it starts with rgb but isn't valid yet, use fallback
      return fallback;
    }
    
    return color;
  };

  // Create preview theme with pending changes - completely independent from main theme
  const previewTheme = useMemo(() => {
    // Get all colors from local settings with proper defaults for empty values
    const primaryColor = validateColor(get(settings, 'public.theme.palette.primaryColor'), 'rgb(108, 183, 110)');
    const secondaryColor = validateColor(get(settings, 'public.theme.palette.secondaryColor'), '#fdb813');
    const errorColor = validateColor(get(settings, 'public.theme.palette.errorColor'), 'rgb(128,20,60)');
    const successColor = validateColor(get(settings, 'public.theme.palette.successColor'), '#4caf50');
    const warningColor = validateColor(get(settings, 'public.theme.palette.warningColor'), '#ff9800');
    const infoColor = validateColor(get(settings, 'public.theme.palette.infoColor'), '#2196f3');
    
    // Get AppBar colors with proper defaults
    // Light mode: defaults to primary color if not specified
    const appBarColorLight = validateColor(get(settings, 'public.theme.palette.appBarColor'), primaryColor);
    const appBarTextColorLight = validateColor(get(settings, 'public.theme.palette.appBarTextColor'), '#ffffff');
    
    // Dark mode: defaults to light mode values if not specified
    const appBarColorDark = validateColor(get(settings, 'public.theme.palette.appBarColorDark'), appBarColorLight);
    const appBarTextColorDark = validateColor(get(settings, 'public.theme.palette.appBarTextColorDark'), appBarTextColorLight);
    
    // Select the appropriate colors based on preview mode
    const appBarColor = isDark ? appBarColorDark : appBarColorLight;
    const appBarTextColor = isDark ? appBarTextColorDark : appBarTextColorLight;
    
    // Get background colors with proper defaults
    const backgroundPageColorLight = get(settings, 'public.theme.palette.backgroundPageColor') || '';
    const backgroundPageColorDark = get(settings, 'public.theme.palette.backgroundPageColorDark') || backgroundPageColorLight;
    const backgroundPageColor = backgroundPageColorDark && isDark ? 
      validateColor(backgroundPageColorDark, '#121212') : 
      validateColor(backgroundPageColorLight, '#fafafa');
    
    // Get paper colors with proper defaults
    const paperColorLight = validateColor(get(settings, 'public.theme.palette.paperColor'), '#ffffff');
    const paperColorDark = validateColor(get(settings, 'public.theme.palette.paperColorDark'), '#424242');
    const paperColor = isDark ? paperColorDark : paperColorLight;
    
    const themeConfig = {
      palette: {
        mode: previewThemeMode,
        primary: {
          main: primaryColor
        },
        secondary: {
          main: secondaryColor
        },
        error: {
          main: errorColor
        },
        success: {
          main: successColor
        },
        warning: {
          main: warningColor
        },
        info: {
          main: infoColor
        },
        appbar: {
          main: appBarColor,
          contrastText: appBarTextColor
        }
      }
    };
    
    // Add background configuration
    themeConfig.palette.background = {
      default: backgroundPageColor || (previewThemeMode === 'dark' ? '#121212' : '#fafafa'),
      paper: paperColor
    };
    
    return createTheme(themeConfig);
  }, [previewThemeMode, isDark, settings]);
  
  // Helper function to update nested settings
  const updateSetting = (path, value) => {
    console.log('updateSetting called with:', path, value);
    const newSettings = JSON.parse(JSON.stringify(settings));
    const pathParts = path.split('.');
    let current = newSettings;
    
    // Ensure all nested paths exist
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (part === "__proto__" || part === "constructor" || part === "prototype") {
        console.error("Prototype pollution attempt blocked:", part);
        return;
      }
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart === "__proto__" || lastPart === "constructor" || lastPart === "prototype") {
      console.error("Prototype pollution attempt blocked:", lastPart);
      return;
    }
    current[lastPart] = value;
    console.log('New settings:', newSettings);
    setSettings(newSettings);
    
    // NOTE: We do NOT update Meteor.settings here anymore
    // That only happens when user clicks "Preview Theme" or "Load Theme Into Settings"
  };

  // Open color picker for a specific field
  const openColorPicker = (fieldPath, currentValue) => {
    setColorPickerField(fieldPath);
    // Try to parse the current color value
    // For now, we'll just use the default color
    setTempColor({ h: 214, s: 43, v: 90, a: 1 });
    setColorPickerOpen(true);
  };
  
  // Apply the selected color
  const applySelectedColor = () => {
    const hexColor = hsvaToHex(tempColor);
    console.log('Applying color:', hexColor, 'to field:', colorPickerField);
    updateSetting(colorPickerField, hexColor);
    setColorPickerOpen(false);
  };
  
  // Simple color field component
  const ColorField = ({ label, fieldPath, helperText, placeholder }) => {
    const value = get(settings, fieldPath, '');
    return (
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(e) => updateSetting(fieldPath, e.target.value)}
        variant="outlined"
        size="small"
        helperText={helperText}
        placeholder={placeholder}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => openColorPicker(fieldPath, value)}
                size="small"
                aria-label="Palette"
              >
                <PaletteIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    );
  };
  

  return (
    <Box
      id="ThemingPage"
      sx={{
        padding: '20px',
        minHeight: '100vh',
        backgroundColor: muiTheme.palette.background.default,
        color: muiTheme.palette.text.primary
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Theme Settings</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Apply theme changes
              console.log('Loading theme into settings...');
              console.log('Current theme settings:', get(settings, 'public.theme'));
              
              // Update entire Meteor.settings.public.theme object
              if (Meteor.settings && Meteor.settings.public) {
                // Create or update the theme object
                if (!Meteor.settings.public.theme) {
                  Meteor.settings.public.theme = {};
                }
                
                // Copy all theme settings from our state
                const themeSettings = get(settings, 'public.theme', {});
                Object.assign(Meteor.settings.public.theme, themeSettings);
                
                console.log('Updated Meteor.settings.public.theme:', Meteor.settings.public.theme);
              }
              
              // Show success message
              setShowSuccessMessage(true);
              
              // Check if theme mode is different and toggle if needed
              const settingsMode = get(settings, 'public.theme.mode', themeMode);
              if (settingsMode !== themeMode) {
                toggleTheme();
              }
              
              // Clear preview state since we're now loading the settings
              Session.set('isPreviewingTheme', false);
              Session.set('themeBackup', null);
              setIsPreviewingTheme(false);
              
              // Trigger theme refresh in CustomThemeProvider
              Session.set('themeRefreshRequest', true);
              
              // The theme changes should be visible immediately
            }}
          >
            Load Theme Into Settings
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left Column - Theme Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Theme Configuration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Default Theme Mode</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Default Theme Mode</InputLabel>
                  <Select
                    value={get(settings, 'public.theme.mode', themeMode) || 'light'}
                    onChange={(e) => {
                      // Only update local settings, don't toggle the actual theme
                      updateSetting('public.theme.mode', e.target.value);
                    }}
                    label="Default Theme Mode"
                  >
                    <MenuItem value="light">Light Mode</MenuItem>
                    <MenuItem value="dark">Dark Mode</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Color Palette</Typography>
              </Grid>
              
              {/* Left column - Primary and Secondary */}
              <Grid item xs={6}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ColorField
                      label="Primary Color"
                      fieldPath="public.theme.palette.primaryColor"
                      helperText="Main brand color"
                      placeholder="rgb(108, 183, 110)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ColorField
                      label="Secondary Color"
                      fieldPath="public.theme.palette.secondaryColor"
                      helperText="Accent color"
                      placeholder="#fdb813"
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              {/* Right column - Status colors */}
              <Grid item xs={6}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ColorField
                      label="Success Color"
                      fieldPath="public.theme.palette.successColor"
                      helperText="Success state color"
                      placeholder="#4caf50"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ColorField
                      label="Info Color"
                      fieldPath="public.theme.palette.infoColor"
                      helperText="Info state color"
                      placeholder="#2196f3"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ColorField
                      label="Warning Color"
                      fieldPath="public.theme.palette.warningColor"
                      helperText="Warning state color"
                      placeholder="#ff9800"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <ColorField
                      label="Error Color"
                      fieldPath="public.theme.palette.errorColor"
                      helperText="Error state color"
                      placeholder="rgb(128,20,60)"
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Background Colors</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="Background Page Color"
                  fieldPath="public.theme.palette.backgroundPageColor"
                  helperText="Light mode"
                  placeholder="#fafafa"
                />
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="Background Page Color (Dark)"
                  fieldPath="public.theme.palette.backgroundPageColorDark"
                  helperText="Dark mode"
                  placeholder={get(settings, 'public.theme.palette.backgroundPageColor', '') || '#121212'}
                />
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="Paper Color"
                  fieldPath="public.theme.palette.paperColor"
                  helperText="Light mode"
                  placeholder="#ffffff"
                />
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="Paper Color (Dark)"
                  fieldPath="public.theme.palette.paperColorDark"
                  helperText="Dark mode"
                  placeholder={get(settings, 'public.theme.palette.paperColor', '') || '#424242'}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>App Bar Colors</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="App Bar Color"
                  fieldPath="public.theme.palette.appBarColor"
                  helperText="Light mode (defaults to primary)"
                  placeholder={get(settings, 'public.theme.palette.primaryColor', 'rgb(108, 183, 110)')}
                />
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="App Bar Color (Dark)"
                  fieldPath="public.theme.palette.appBarColorDark"
                  helperText="Dark mode"
                  placeholder={get(settings, 'public.theme.palette.appBarColor', get(settings, 'public.theme.palette.primaryColor', 'rgb(108, 183, 110)'))}
                />
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="App Bar Text Color"
                  fieldPath="public.theme.palette.appBarTextColor"
                  helperText="Light mode text color"
                  placeholder="#ffffff"
                />
              </Grid>
              
              <Grid item xs={6}>
                <ColorField
                  label="App Bar Text Color (Dark)"
                  fieldPath="public.theme.palette.appBarTextColorDark"
                  helperText="Dark mode text color"
                  placeholder={get(settings, 'public.theme.palette.appBarTextColor', '#ffffff')}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Additional Settings</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Nivo Theme</InputLabel>
                  <Select
                    value={get(settings, 'public.theme.palette.nivoTheme', 'red_grey')}
                    onChange={(e) => updateSetting('public.theme.palette.nivoTheme', e.target.value)}
                    label="Nivo Theme"
                  >
                    <MenuItem value="red_grey">Red Grey</MenuItem>
                    <MenuItem value="blues">Blues</MenuItem>
                    <MenuItem value="greens">Greens</MenuItem>
                    <MenuItem value="purples">Purples</MenuItem>
                    <MenuItem value="oranges">Oranges</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Background Image Path"
                  value={get(settings, 'public.theme.backgroundImagePath', '')}
                  onChange={(e) => updateSetting('public.theme.backgroundImagePath', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Video Background</InputLabel>
                  <Select
                    value={get(settings, 'public.theme.showVideoBackground', false) ? 'enabled' : 'disabled'}
                    onChange={(e) => updateSetting('public.theme.showVideoBackground', e.target.value === 'enabled')}
                    label="Video Background"
                  >
                    <MenuItem value="disabled">Disabled</MenuItem>
                    <MenuItem value="enabled">Enabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Video"
                  value={get(settings, 'public.theme.defaultVideo', '')}
                  onChange={(e) => updateSetting('public.theme.defaultVideo', e.target.value)}
                  variant="outlined"
                  size="small"
                  disabled={!get(settings, 'public.theme.showVideoBackground', false)}
                />
              </Grid>
              
            </Grid>
          </Paper>
        </Grid>
        
        {/* Right Column - Theme Preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            backgroundColor: previewTheme.palette.background?.default || (previewThemeMode === 'dark' ? '#121212' : '#fafafa')
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit' }}>Theme Preview</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit' }}>Theme Mode</InputLabel>
                <Select
                  value={previewThemeMode}
                  onChange={(e) => setPreviewThemeMode(e.target.value)}
                  label="Theme Mode"
                  sx={{ 
                    color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: previewThemeMode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                    },
                    '& .MuiSvgIcon-root': {
                      color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ThemeProvider theme={previewTheme}>
              <Grid container spacing={3}>
                {/* App Bar Preview */}
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>App Bar Preview</Typography>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: previewTheme.palette.appbar?.main || previewTheme.palette.primary.main,
                      color: previewTheme.palette.appbar?.contrastText || previewTheme.palette.primary.contrastText,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="h6" sx={{ color: 'inherit' }}>Application Title</Typography>
                      <Box>
                        <Button size="small" sx={{ color: 'inherit' }}>Menu</Button>
                        <Button size="small" sx={{ color: 'inherit' }}>Profile</Button>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Alert Examples */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Status Colors</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Alert severity="error">Error Alert - Uses the Error Color</Alert>
                    <Alert severity="warning">Warning Alert - Uses the Warning Color</Alert>
                    <Alert severity="info">Info Alert - Uses the Info Color</Alert>
                    <Alert severity="success">Success Alert - Uses the Success Color</Alert>
                  </Box>
                </Grid>
              
                {/* Component Examples */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Component Examples</Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Paper Component</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Paper components automatically adjust to theme mode.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="primary" size="small">Action</Button>
                      <Button variant="outlined" size="small">Cancel</Button>
                    </Box>
                  </Paper>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Card Component</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Cards also adapt to the current theme mode.
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Button variant="contained" color="secondary" size="small">Secondary</Button>
                        <Button variant="outlined" color="secondary" size="small">Outlined</Button>
                        <Button variant="text" color="secondary" size="small">Text</Button>
                      </Box>
                      <Alert severity="success" variant="outlined">
                        Success message
                      </Alert>
                    </CardContent>
                  </Card>
                  
                  {/* Settings Preview with AceEditor */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Settings Preview</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Current theme configuration in JSON format:
                      </Typography>
                      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <AceEditor
                          mode="json"
                          theme={previewThemeMode === 'dark' ? "monokai" : "github"}
                          name="settings-preview"
                          value={JSON.stringify(get(settings, 'public.theme', {}), null, 2)}
                          width="100%"
                          height="200px"
                          readOnly={true}
                          showPrintMargin={false}
                          showGutter={true}
                          highlightActiveLine={false}
                          setOptions={{
                            showLineNumbers: true,
                            tabSize: 2,
                            useWorker: false
                          }}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </ThemeProvider>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Theme settings loaded successfully!
        </Alert>
      </Snackbar>
      
      {/* Color Picker Dialog */}
      <Dialog 
        open={colorPickerOpen} 
        onClose={() => setColorPickerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Choose Color</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 2 }}>
            <Wheel 
              color={tempColor} 
              onChange={(color) => setTempColor({ ...tempColor, ...color.hsva })} 
              width={300}
              height={300}
            />
            <ShadeSlider
              hsva={tempColor}
              style={{ width: '300px' }}
              onChange={(newShade) => {
                setTempColor({ ...tempColor, ...newShade });
              }}
            />
            <Box sx={{ 
              width: '100%', 
              p: 2, 
              backgroundColor: hsvaToHex(tempColor),
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center'
            }}>
              <Typography variant="body2" sx={{ 
                color: tempColor.v > 50 ? '#000' : '#fff' 
              }}>
                {hsvaToHex(tempColor)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorPickerOpen(false)}>Cancel</Button>
          <Button onClick={applySelectedColor} variant="contained" color="primary">
            Choose Color
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThemingPage 
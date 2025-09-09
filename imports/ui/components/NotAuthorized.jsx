// imports/ui/components/NotAuthorized.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

import { 
  Box, 
  Container, 
  Typography, 
  Button,
  Link,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';

import FingerprintIcon from '@mui/icons-material/Fingerprint';
import LockIcon from '@mui/icons-material/Lock';

export default function NotAuthorized(props) {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Define responsive breakpoints
  const upMd = useMediaQuery(theme.breakpoints.up('md')); // >= 960px
  const upLg = useMediaQuery('(min-width:1920px)'); // >= 1920px

  const handleSignIn = function() {
    navigate('/signin');
  };

  // Safely get values from settings
  const appTitle = get(Meteor, 'settings.public.title', 'NodeOnFHIR');
  const appDomain = get(Meteor, 'settings.public.domain', 'nodeonfhir.localhost');
  const appVersion = get(Meteor, 'settings.public.version');
  
  // Handle version which might be an object with major/minor/patch
  let versionString = '1.0.0';
  if (typeof appVersion === 'string') {
    versionString = appVersion;
  } else if (appVersion && typeof appVersion === 'object') {
    versionString = `${appVersion.major || 1}.${appVersion.minor || 0}.${appVersion.patch || 0}`;
  }

  const lockIconSize = !upMd ? 120 : 180;
  const lockIconInnerSize = !upMd ? 60 : 80;

  // Portrait layout (single column vertical stack) - small screens
  if (!upMd) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {/* Top section with lock icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            padding: 6,
          }}
        >
          <Box
            sx={theme => ({
              width: lockIconSize,
              height: lockIconSize,
              borderRadius: '50%',
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.2)}`,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: lockIconSize - 20,
                height: lockIconSize - 20,
                borderRadius: '50%',
                backgroundColor: theme.palette.background.paper,
              }
            })}
          >
            <FingerprintIcon 
              sx={{ 
                fontSize: lockIconInnerSize, 
                color: 'primary.main',
                zIndex: 1,
              }} 
            />
          </Box>
        </Box>

        {/* Bottom section with content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: 4,
            paddingTop: 8,
            backgroundColor: 'background.default',
          }}
        >
          <Container maxWidth="sm">
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: 3,
              }}
            >
              Choose an account
            </Typography>

            <Box
              sx={{
                backgroundColor: 'background.paper',
                borderRadius: 2,
                padding: 3,
                marginBottom: 3,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  border: theme => `1px solid ${theme.palette.primary.main}`,
                  boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
              }}
              onClick={handleSignIn}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  {appTitle.slice(0, 2).toUpperCase()}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {appTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {appDomain}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={function() { navigate('/signin') }}
                sx={{ mb: 1 }}
              >
                Sign in to another account
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={function() { navigate('/signup') }}
              >
                Create a new account
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', marginTop: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Version {versionString} — © 2025 {appTitle}. All rights reserved.
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Protected by NodeOnFHIR Security
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  // Landscape layout (2-panel horizontal) - medium screens
  if (!upLg) {
    return (
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          position: 'relative',
        }}
      >
        {/* Left panel - Empty */}
        <Box
          sx={{
            flex: '0 0 20%',
            backgroundColor: 'action.hover',
          }}
        />

        {/* White ribbon strips on border */}
        <Box
          sx={{
            position: 'absolute',
            left: 'calc(20% - 40px)',
            top: 0,
            width: 40,
            height: '100%',
            backgroundColor: 'background.paper',
            borderLeft: '1.5px solid',
            borderRight: '1.5px solid',
            borderColor: 'divider',
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '20%',
            top: 0,
            width: 40,
            height: '100%',
            backgroundColor: 'background.paper',
            borderLeft: '1.5px solid',
            borderRight: '1.5px solid',
            borderColor: 'divider',
            zIndex: 1,
          }}
        />

        {/* Lock icon positioned at the seam between left and middle panels */}
        <Box
          sx={{
            position: 'absolute',
            left: 'calc(20% + 4px)',
            top: '200px',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
          }}
        >
          <Box
            sx={theme => ({
              width: 200,
              height: 200,
              marginTop: '-80px',
              borderRadius: '50%',
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: '50%',
                backgroundColor: theme.palette.background.paper,
              }
            })}
          >
            <FingerprintIcon 
              sx={{ 
                fontSize: 90, 
                color: 'primary.main',
                zIndex: 1,
              }} 
            />
          </Box>
        </Box>

        {/* Middle panel - Account selection (expanded to fill remaining space) */}
        <Box
          sx={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'action.hover',
            padding: 4,
            borderLeft: '8px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ maxWidth: 320, width: '100%' }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Choose an account
            </Typography>

            <Box
              sx={{
                backgroundColor: 'background.paper',
                borderRadius: 2,
                padding: 3,
                marginBottom: 4,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  border: theme => `1px solid ${theme.palette.primary.main}`,
                  boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
              }}
              onClick={handleSignIn}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  {appTitle.slice(0, 2).toUpperCase()}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {appTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {appDomain}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={function() { navigate('/signin') }}
                sx={{ mb: 1 }}
              >
                Sign in to another account
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={function() { navigate('/signup') }}
              >
                Create a new account
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', marginTop: 8 }}>
              <Typography variant="caption" color="text.secondary">
                Version {versionString} — © 2025 {appTitle}.
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                All rights reserved.
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Protected by NodeOnFHIR Security
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Widescreen layout (3-panel) - large screens
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        position: 'relative',
      }}
    >
      {/* Left panel - Empty */}
      <Box
        sx={{
          flex: '0 0 20%',
          backgroundColor: 'action.hover',
        }}
      />

      {/* White ribbon strips on border */}
      <Box
        sx={{
          position: 'absolute',
          left: 'calc(20% - 40px)',
          top: 0,
          width: 40,
          height: '100%',
          backgroundColor: 'background.paper',
          borderLeft: '1.5px solid',
          borderRight: '1.5px solid',
          borderColor: 'divider',
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: '20%',
          top: 0,
          width: 40,
          height: '100%',
          backgroundColor: 'background.paper',
          borderLeft: '1.5px solid',
          borderRight: '1.5px solid',
          borderColor: 'divider',
          zIndex: 1,
        }}
      />

      {/* Lock icon positioned at the seam between left and middle panels */}
      <Box
        sx={{
          position: 'absolute',
          left: 'calc(20% + 4px)',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 3,
        }}
      >
        <Box
          sx={theme => ({
            width: 200,
            height: 200,
            marginTop: '-80px',
            borderRadius: '50%',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 170,
              height: 170,
              borderRadius: '50%',
              backgroundColor: theme.palette.background.paper,
            }
          })}
        >
          <FingerprintIcon 
            sx={{ 
              fontSize: 90, 
              color: 'primary.main',
              zIndex: 1,
            }} 
          />
        </Box>
      </Box>

      {/* Middle panel - Account selection */}
      <Box
        sx={{
          flex: '0 0 45%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          padding: 4,
          borderLeft: '8px solid',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ maxWidth: 320, width: '100%' }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            Choose an account
          </Typography>

          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 2,
              padding: 3,
              marginBottom: 4,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              '&:hover': {
                border: theme => `1px solid ${theme.palette.primary.main}`,
                boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
              },
            }}
            onClick={handleSignIn}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  backgroundColor: '#ff6b35',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {appTitle.slice(0, 2).toUpperCase()}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {appDomain}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              onClick={function() { navigate('/signin') }}
              sx={{ mb: 1 }}
            >
              Sign in to another account
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              onClick={function() { navigate('/signup') }}
            >
              Create a new account
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', marginTop: 8 }}>
            <Typography variant="caption" color="text.secondary">
              Version {versionString} — © 2025 {appTitle}.
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              All rights reserved.
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Protected by NodeOnFHIR Security
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right panel - Promotional content */}
      <Box
        sx={{
          flex: '0 0 35%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              marginBottom: 3,
            }}
          >
            HIPAA security starts with authenticated access
          </Typography>
          
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 3,
              padding: 4,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              marginTop: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
                  NodeOnFHIR Security
                </Typography>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                  NodeOnFHIR provides HIPAA-compliant security for healthcare data and FHIR resources. 
                  Our platform ensures patient data privacy while enabling secure interoperability 
                  between healthcare systems.
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph>
                  With built-in consent management, SMART on FHIR support, and comprehensive audit 
                  logging, NodeOnFHIR helps healthcare organizations maintain compliance while 
                  delivering modern digital health solutions.
                </Typography>

                <Button
                  variant="text"
                  color="primary"
                  sx={{ 
                    textTransform: 'none',
                    padding: 0,
                    marginTop: 2,
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    }
                  }}
                  onClick={function() { window.open('https://github.com/node-on-fhir/honeycomb/tree/main/packages/hipaa-compliance', '_blank') }}
                >
                  Learn more about NodeOnFHIR Security →
                </Button>
              </Box>
              
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  borderRadius: 3,
                  backgroundColor: theme => theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.15) 
                    : alpha(theme.palette.primary.main, 0.05),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LockIcon sx={{ fontSize: 80, color: 'primary.main' }} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
// imports/ui/extensible/NoAuthorizationPage.jsx
//
// Default full-page fallback rendered by AuthGuard for routes declaring
// `requireAuth: true` when no user is signed in. Brand packages can replace
// this app-wide via components: { NoAuthorizationPage: ... } on their
// workflow default export (see extensions/API.md).
//
// Formerly imports/ui/components/NotAuthorized.jsx — the old path re-exports
// this component as a deprecated alias. Keep id="notAuthorizedPage" — ONC
// Nightwatch suites select on it.

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { appendReturnTo } = WorkflowNavigation;
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

import {
  Box,
  Container,
  Typography,
  Button,
  Link,
  useTheme as useMuiTheme,
  useMediaQuery,
  alpha
} from '@mui/material';

import FingerprintIcon from '@mui/icons-material/Fingerprint';
import LockIcon from '@mui/icons-material/Lock';

// Inspirational quotes for healthcare; extend via Meteor.settings.public.inspirationalQuotes
const defaultInspirationalQuotes = [
  {
    text: "Wherever the art of medicine is loved, there is also a love of humanity.",
    author: "Hippocrates"
  },
  {
    text: "The best way to find yourself is to lose yourself in the service of others.",
    author: "Mahatma Gandhi"
  },
  {
    text: "To cure sometimes, to relieve often, to comfort always.",
    author: "Edward Trudeau"
  },
  {
    text: "The good physician treats the disease; the great physician treats the patient who has the disease.",
    author: "William Osler"
  },
  {
    text: "Medicine is not only a science; it is also an art. It does not consist of compounding pills and plasters; it deals with the very processes of life.",
    author: "Paracelsus"
  },
  {
    text: "The secret of patient care is caring for the patient.",
    author: "Francis Peabody"
  },
  {
    text: "It is more important to know what sort of person has a disease than to know what sort of disease a person has.",
    author: "Hippocrates"
  },
  {
    text: "In nothing do men more nearly approach the gods than in giving health to men.",
    author: "Cicero"
  }
];

export default function NoAuthorizationPage(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useMuiTheme();

  // Route preservation: AuthGuard passes the blocked route as `requestedPath`
  // (pathname+search); when rendered standalone (or by a legacy JSX-element
  // override that can't take props) fall back to reading the live location —
  // the guard renders in place, so they agree. Threaded onto the sign-in /
  // sign-up navigations as ?returnTo=<encoded internal path> and consumed by
  // Login/Register pages after successful auth.
  const selfPath = location.pathname === '/' ? null : location.pathname + location.search;
  const requestedPath = get(props, 'requestedPath') || selfPath;
  const signInPath = appendReturnTo('/signin', requestedPath);
  const signUpPath = appendReturnTo('/signup', requestedPath);

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#2a2a2a' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const bgColor = isDark ? '#1e1e1e' : '#f5f5f5';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const rightPanelBgColor = isDark ? '#121212' : undefined;

  // Only show the HIPAA promo card when the hipaa-compliance workflow package is loaded
  // (registered on the Package registry by the workflow loaders — .claude/rules/fhir/package-registry.md);
  // otherwise the right panel shows rotating inspirational quotes
  const hipaaPackageInstalled = Boolean(globalThis.Package && globalThis.Package['@node-on-fhir/hipaa-compliance']);

  // Defaults plus any additional sayings from settings
  const settingsQuotes = get(Meteor, 'settings.public.inspirationalQuotes', []);
  const inspirationalQuotes = defaultInspirationalQuotes.concat(
    Array.isArray(settingsQuotes) ? settingsQuotes.filter(quote => quote && quote.text) : []
  );

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Toggle between inspirational quotes (default) and the HIPAA security message
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Rotate through quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % inspirationalQuotes.length);
    }, 15000); // Change quote every 15 seconds

    return () => clearInterval(interval);
  }, [inspirationalQuotes.length]);

  const currentQuote = inspirationalQuotes[currentQuoteIndex % inspirationalQuotes.length];

  // Define responsive breakpoints
  const upMd = useMediaQuery(muiTheme.breakpoints.up('md')); // >= 960px
  const upLg = useMediaQuery('(min-width:1920px)'); // >= 1920px

  const handleSignIn = function() {
    navigate(signInPath);
  };

  const handleSignUp = function() {
    navigate(signUpPath);
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
        id="notAuthorizedPage"
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
                backgroundColor: cardBgColor,
                borderRadius: 2,
                padding: 3,
                marginBottom: 3,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: borderColor,
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
                  <Typography variant="body1" sx={{ fontWeight: 500, color: cardTextColor }}>
                    {appTitle}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                  }}>
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
                onClick={handleSignIn}
                sx={{ mb: 1 }}
              >
                Sign in to another account
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={handleSignUp}
              >
                Create a new account
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', marginTop: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Version {versionString} — © 2025 {appTitle}. All rights reserved.
              </Typography>
              {hipaaPackageInstalled && (
                <>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Protected by NodeOnFHIR Security
                  </Typography>
                </>
              )}
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
        id="notAuthorizedPage"
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
                backgroundColor: cardBgColor,
                borderRadius: 2,
                padding: 3,
                marginBottom: 4,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: borderColor,
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
                  <Typography variant="body1" sx={{ fontWeight: 500, color: cardTextColor }}>
                    {appTitle}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                  }}>
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
                onClick={handleSignIn}
                sx={{ mb: 1 }}
              >
                Sign in to another account
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={handleSignUp}
              >
                Create a new account
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', marginTop: 8 }}>
              <Typography variant="caption" sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }}>
                Version {versionString} — © 2025 {appTitle}.
              </Typography>
              <br />
              <Typography variant="caption" sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }}>
                All rights reserved.
              </Typography>
              {hipaaPackageInstalled && (
                <>
                  <br />
                  <Typography variant="caption" sx={{
                    mt: 1,
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                  }}>
                    Protected by NodeOnFHIR Security
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Widescreen layout (3-panel) - large screens
  return (
    <Box
      id="notAuthorizedPage"
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: bgColor,
        position: 'relative',
      }}
    >
      {/* Left panel - Empty */}
      <Box
        sx={{
          flex: '0 0 20%',
          backgroundColor: bgColor,
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
          backgroundColor: cardBgColor,
          borderLeft: '1.5px solid',
          borderRight: '1.5px solid',
          borderColor: borderColor,
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
          backgroundColor: cardBgColor,
          borderLeft: '1.5px solid',
          borderRight: '1.5px solid',
          borderColor: borderColor,
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
            background: isDark
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
              backgroundColor: cardBgColor,
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
          backgroundColor: bgColor,
          padding: 4,
          borderLeft: '8px solid',
          borderRight: '1px solid',
          borderColor: borderColor,
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
              color: cardTextColor
            }}
          >
            Choose an account
          </Typography>

          <Box
            sx={{
              backgroundColor: cardBgColor,
              borderRadius: 2,
              padding: 3,
              marginBottom: 4,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: borderColor,
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
                <Typography variant="body1" sx={{ fontWeight: 500, color: cardTextColor }}>
                  {appTitle}
                </Typography>
                <Typography variant="body2" sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                }}>
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
              onClick={handleSignIn}
              sx={{ mb: 1 }}
            >
              Sign in to another account
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              onClick={handleSignUp}
            >
              Create a new account
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', marginTop: 8 }}>
            <Typography variant="caption" sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }}>
              Version {versionString} — © 2025 {appTitle}.
            </Typography>
            <br />
            <Typography variant="caption" sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }}>
              All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right panel - inspirational quotes by default; the security toggle swaps in the HIPAA message */}
      <Box
        sx={{
          flex: '0 0 35%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          backgroundColor: rightPanelBgColor,
          backgroundImage: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
        }}
      >
        <Container maxWidth="md">
          {hipaaPackageInstalled && showSecurityInfo ? (
            <>
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
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontStyle: 'italic',
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  textAlign: 'center',
                  maxWidth: 500,
                  mb: 2,
                  fontWeight: 300,
                  lineHeight: 1.6,
                  transition: 'opacity 0.5s ease-in-out',
                  opacity: 1
                }}
              >
                "{currentQuote.text}"
              </Typography>
              {currentQuote.author && (
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    textAlign: 'center',
                    transition: 'opacity 0.5s ease-in-out',
                    opacity: 1
                  }}
                >
                  — {currentQuote.author}
                </Typography>
              )}
            </Box>
          )}
        </Container>
      </Box>

      {/* Security info toggle - lower right, only when hipaa-compliance is loaded */}
      {hipaaPackageInstalled && (
        <Button
          variant="outlined"
          size="small"
          onClick={function() { setShowSecurityInfo(!showSecurityInfo) }}
          sx={{
            position: 'fixed',
            bottom: 88, // clear the 64px footer toolbar
            right: 24,
            textTransform: 'none',
            fontSize: '0.75rem',
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            borderColor: borderColor,
            zIndex: 1,
          }}
        >
          {showSecurityInfo ? 'Back to inspirational quotes' : 'Learn more about Node on FHIR security'}
        </Button>
      )}
    </Box>
  );
}
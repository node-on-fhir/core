// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/pages/StructuredDataCaptureLandingPage.jsx

import { Meteor } from 'meteor/meteor';

export default function StructuredDataCaptureLandingPage() {
  console.log('StructuredDataCaptureLandingPage rendering...');
  
  // Get React from Meteor global scope
  const React = Meteor.React || window.React;
  console.log('React available:', !!React);
  
  if (!React) {
    console.error('React not found in Meteor.React or window.React');
    return null;
  }
  
  // Get router hook from React Router
  const ReactRouterDOM = window.ReactRouterDOM || window.ReactRouter || {};
  const { useNavigate } = ReactRouterDOM;
  let navigate = null;
  
  // Try to get navigate function
  try {
    if (useNavigate && typeof useNavigate === 'function') {
      navigate = useNavigate();
    }
  } catch (e) {
    console.log('Could not get navigate from useNavigate hook:', e.message);
  }
  
  // Fallback navigation methods
  if (!navigate && typeof window.navigate === 'function') {
    navigate = window.navigate;
  } else if (!navigate && window.Session && window.Session.set) {
    navigate = (path) => {
      window.Session.set('navigateTo', path);
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
  }
  
  console.log('Navigate function available:', !!navigate, typeof navigate);
  
  // Get Material-UI components from Meteor global
  const mui = Meteor.mui || window.MaterialUI;
  console.log('Material-UI available:', !!mui);
  
  if (!mui) {
    console.error('Material-UI not found in Meteor.mui or window.MaterialUI');
    // Render basic HTML fallback
    return React.createElement('div', { 
      style: { 
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }
    },
      React.createElement('h1', null, 'Structured Data Capture'),
      React.createElement('p', null, 'Loading Material-UI components...')
    );
  }
  
  const { 
    Box, 
    Container, 
    Typography, 
    Card, 
    CardContent, 
    CardActionArea,
    Grid,
    Icon,
    Paper,
    useTheme,
    alpha,
    Divider
  } = mui;
  
  const theme = useTheme ? useTheme() : { 
    palette: {
      mode: 'light',
      primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
      secondary: { main: '#dc004e', dark: '#9a0036' },
      success: { main: '#2e7d32', dark: '#1b5e20' },
      info: { main: '#0288d1' },
      warning: { main: '#ed6c02' },
      error: { main: '#d32f2f' },
      grey: { 50: '#fafafa' },
      text: { primary: '#000', secondary: '#666' },
      background: { default: '#fff' }
    },
    shadows: Array(25).fill('none')
  };

  // Main tools section
  const mainTools = [
    {
      title: 'Questionnaire Builder',
      description: 'Create and design custom forms and questionnaires',
      emoji: '🛠️',
      path: '/questionnaire-builder',
      color: theme.palette.primary.main
    },
    {
      title: 'Questionnaire Library',
      description: 'Browse and manage your collection of forms',
      emoji: '📚',
      path: '/questionnaire-library',
      color: theme.palette.secondary.main
    },
    {
      title: 'Response Analytics',
      description: 'Analyze and visualize form responses and data',
      emoji: '📊',
      path: '/response-analytics',
      color: theme.palette.success.main
    }
  ];

  // Clinical assessment forms
  const clinicalForms = [
    {
      title: 'PHQ-9 Screening',
      description: 'Depression screening questionnaire',
      emoji: '🧠',
      path: '/structured-data-capture?form=phq9',
      color: theme.palette.info.main
    },
    {
      title: 'Intake Forms',
      description: 'New patient intake questionnaires',
      emoji: '📋',
      path: '/structured-data-capture?form=intake',
      color: theme.palette.warning.main
    },
    {
      title: 'Consent Forms',
      description: 'Patient consent and authorization forms',
      emoji: '✍️',
      path: '/structured-data-capture?form=consent',
      color: theme.palette.error.main
    }
  ];

  // If MUI components aren't fully loaded, show a basic layout
  if (!Box || !Container || !Typography || !Card || !Grid) {
    console.log('Some MUI components missing, rendering basic layout');
    return React.createElement('div', { 
      style: { 
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }
    },
      React.createElement('div', { 
        style: { 
          maxWidth: '1200px',
          margin: '0 auto'
        }
      },
        React.createElement('div', {
          style: {
            backgroundColor: '#1976d2',
            padding: '32px',
            borderRadius: '8px',
            marginBottom: '32px',
            color: 'white'
          }
        },
          React.createElement('h1', { 
            style: { 
              margin: '0 0 16px 0',
              fontSize: '2.5rem'
            }
          }, '📝 Structured Data Capture'),
          React.createElement('p', { 
            style: { 
              margin: 0,
              fontSize: '1.1rem',
              opacity: 0.95
            }
          }, 'Create, manage, and analyze clinical forms and questionnaires')
        ),
        React.createElement('h2', { style: { marginBottom: '24px' } }, 'Form Management Tools'),
        React.createElement('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }
        },
          mainTools.map((item) => 
            React.createElement('div', {
              key: item.path,
              style: {
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textAlign: 'center'
              },
              onClick: () => {
                if (navigate && typeof navigate === 'function') {
                  console.log('Navigating to:', item.path);
                  navigate(item.path);
                } else {
                  console.log('Falling back to window.location.href:', item.path);
                  window.location.href = item.path;
                }
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            },
              React.createElement('div', {
                style: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: item.color + '20',
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '32px'
                }
              }, item.emoji),
              React.createElement('h3', {
                style: {
                  margin: '0 0 8px 0',
                  fontSize: '1.25rem',
                  color: '#333'
                }
              }, item.title),
              React.createElement('p', {
                style: {
                  margin: 0,
                  fontSize: '0.9rem',
                  color: '#666'
                }
              }, item.description)
            )
          )
        ),
        React.createElement('h2', { style: { marginBottom: '24px' } }, 'Clinical Assessment Forms'),
        React.createElement('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }
        },
          clinicalForms.map((item) => 
            React.createElement('div', {
              key: item.path,
              style: {
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textAlign: 'center'
              },
              onClick: () => {
                if (navigate && typeof navigate === 'function') {
                  console.log('Navigating to:', item.path);
                  navigate(item.path);
                } else {
                  console.log('Falling back to window.location.href:', item.path);
                  window.location.href = item.path;
                }
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            },
              React.createElement('div', {
                style: {
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: item.color + '20',
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '24px'
                }
              }, item.emoji),
              React.createElement('h4', {
                style: {
                  margin: '0 0 6px 0',
                  fontSize: '1.1rem',
                  color: '#333'
                }
              }, item.title),
              React.createElement('p', {
                style: {
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#666'
                }
              }, item.description)
            )
          )
        )
      )
    );
  }

  // Full MUI rendering
  console.log('Rendering with full MUI components');
  return React.createElement(Box, { 
    sx: { 
      minHeight: '100vh',
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50]
        : theme.palette.background.default,
      py: 4
    }
  },
    React.createElement(Container, { maxWidth: "lg" },
      // Header
      React.createElement(Paper, { 
        elevation: 0, 
        sx: { 
          p: 4, 
          mb: 4, 
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 2
        }
      },
        React.createElement(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 2 } },
          React.createElement(Typography, { variant: "h3", component: "h1" }, 
            '📝 Structured Data Capture'
          )
        ),
        React.createElement(Typography, { variant: "h6", sx: { opacity: 0.95 } },
          'Create, manage, and analyze clinical forms and questionnaires'
        )
      ),

      // Main Tools Section
      React.createElement(Typography, { 
        variant: "h5", 
        sx: { mb: 3, fontWeight: 500 }
      }, 'Form Management Tools'),
      
      React.createElement(Grid, { container: true, spacing: 3, sx: { mb: 5 } },
        mainTools.map((item) => 
          React.createElement(Grid, { item: true, xs: 12, sm: 6, md: 4, key: item.path },
            React.createElement(Card, { 
              sx: { 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }
            },
              React.createElement(CardActionArea, { 
                onClick: () => {
                  if (navigate && typeof navigate === 'function') {
                    console.log('Navigating to:', item.path);
                    navigate(item.path);
                  } else {
                    console.log('Falling back to window.location.href:', item.path);
                    window.location.href = item.path;
                  }
                },
                sx: { height: '100%' }
              },
                React.createElement(CardContent, { 
                  sx: { 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 4,
                    height: '100%'
                  }
                },
                  React.createElement(Box, { 
                    sx: { 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: alpha ? alpha(item.color, 0.1) : item.color + '20',
                      color: item.color,
                      mb: 2,
                      fontSize: '48px'
                    }
                  },
                    item.emoji
                  ),
                  React.createElement(Typography, { 
                    variant: "h6", 
                    component: "h2", 
                    gutterBottom: true,
                    sx: { fontWeight: 600 }
                  },
                    item.title
                  ),
                  React.createElement(Typography, { 
                    variant: "body2", 
                    color: "text.secondary",
                    sx: { mt: 'auto' }
                  },
                    item.description
                  )
                )
              )
            )
          )
        )
      ),

      // Divider
      React.createElement(Divider, { sx: { my: 4 } }),

      // Clinical Forms Section
      React.createElement(Typography, { 
        variant: "h5", 
        sx: { mb: 3, fontWeight: 500 }
      }, 'Clinical Assessment Forms'),
      
      React.createElement(Grid, { container: true, spacing: 3 },
        clinicalForms.map((item) => 
          React.createElement(Grid, { item: true, xs: 12, sm: 6, md: 4, key: item.path },
            React.createElement(Card, { 
              sx: { 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6]
                }
              }
            },
              React.createElement(CardActionArea, { 
                onClick: () => {
                  if (navigate && typeof navigate === 'function') {
                    console.log('Navigating to:', item.path);
                    navigate(item.path);
                  } else {
                    console.log('Falling back to window.location.href:', item.path);
                    window.location.href = item.path;
                  }
                },
                sx: { height: '100%' }
              },
                React.createElement(CardContent, { 
                  sx: { 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                    height: '100%'
                  }
                },
                  React.createElement(Box, { 
                    sx: { 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: alpha ? alpha(item.color, 0.1) : item.color + '20',
                      color: item.color,
                      mb: 2,
                      fontSize: '32px'
                    }
                  },
                    item.emoji
                  ),
                  React.createElement(Typography, { 
                    variant: "subtitle1", 
                    component: "h3", 
                    gutterBottom: true,
                    sx: { fontWeight: 600 }
                  },
                    item.title
                  ),
                  React.createElement(Typography, { 
                    variant: "body2", 
                    color: "text.secondary"
                  },
                    item.description
                  )
                )
              )
            )
          )
        )
      ),

      // Footer Info
      React.createElement(Box, { sx: { mt: 6, textAlign: 'center' } },
        React.createElement(Typography, { variant: "body2", color: "text.secondary" },
          'Select a tool above to create forms, browse the library, or analyze responses'
        )
      )
    )
  );
}
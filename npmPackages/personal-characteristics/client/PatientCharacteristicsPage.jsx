// packages/patient-characteristics/client/PatientCharacteristicsPage.jsx

import React, { useState } from 'react';
import { get } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box, Container, Card, CardHeader, CardContent,
  Typography, IconButton, Collapse, ToggleButtonGroup, ToggleButton,
  TextField, Select, MenuItem, FormControl
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import GridOnIcon from '@mui/icons-material/GridOn';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { PHENOTYPE_DOMAINS } from '../lib/phenotypeData.js';

// Resolve Honeycomb theme hook at startup
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

// Count traits across all panels in a domain
function countTraits(domainObj) {
  let count = 0;
  domainObj.panels.forEach(function(panel) {
    count += panel.traits.length;
  });
  return count;
}

// Return the appropriate TextField props for a given valueType
function getInputProps(valueType) {
  if (valueType === 'numeric') {
    return { type: 'number' };
  }
  if (valueType === 'narrative or repeating coded entries') {
    return { multiline: true, rows: 2 };
  }
  return {};
}

export default function PatientCharacteristicsPage() {
  const selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, []);

  if (!selectedPatient) {
    const NoPatientSelectedCard = Meteor.NoPatientSelectedCard;
    if (NoPatientSelectedCard) {
      return <NoPatientSelectedCard />;
    }
    return null;
  }

  // Theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  // Expand/collapse state — first domain starts expanded
  const [expandedDomains, setExpandedDomains] = useState(new Set(['Stable phenotype']));

  function toggleDomain(domain) {
    setExpandedDomains(function(prev) {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }

  // Lock/unlock state
  const [isLocked, setIsLocked] = useState(true);

  // Trait values keyed by localCode
  const [traitValues, setTraitValues] = useState({});

  function handleTraitChange(localCode, value) {
    setTraitValues(function(prev) {
      return Object.assign({}, prev, { [localCode]: value });
    });
  }

  // Visualization mode
  const [vizMode, setVizMode] = useState('dermatomes');
  const [sex, setSex] = useState('Male');
  const [view, setView] = useState('Front');

  function handleVizModeChange(event, newMode) {
    if (newMode !== null) {
      setVizMode(newMode);
    }
  }

  // Dermatome image path
  const darkSuffix = isDark ? '_Dark' : '';
  // Served by the workflow parser from assets/ → public/workflows/personal-characteristics/
  // (npm migration; replaces the Atmosphere /packages/clinical_patient-characteristics/ path)
  const dermatomeUrl = '/workflows/personal-characteristics/Dermatomes_'
    + sex + '_Outline_' + view + darkSuffix + '.png';

  // Unlocked card tint
  const unlockedBgColor = isDark ? '#252525' : '#fafafa';

  return (
    <Container maxWidth="xl" disableGutters sx={{ px: 3, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ color: cardTextColor, flexGrow: 1 }}>
          Phenotype Domains
        </Typography>
        <IconButton
          onClick={function() { setIsLocked(!isLocked); }}
          sx={{ color: cardTextColor }}
          title={isLocked ? 'Unlock fields for editing' : 'Lock fields'}
        >
          {isLocked ? <LockIcon /> : <LockOpenIcon />}
        </IconButton>
      </Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3,
        alignItems: 'start'
      }}>
        {/* ===================== LEFT COLUMN: Phenotype Domain Cards ===================== */}
        <Box>
          {PHENOTYPE_DOMAINS.map(function(domainObj) {
            const isExpanded = expandedDomains.has(domainObj.domain);
            const traitCount = countTraits(domainObj);

            return (
              <Card
                key={domainObj.domain}
                sx={{
                  mb: 2,
                  bgcolor: isLocked ? cardBgColor : unlockedBgColor,
                  color: cardTextColor,
                  border: '1px solid ' + borderColor,
                  '& .MuiTextField-root': {
                    '& .MuiInputLabel-root': { color: secondaryTextColor },
                    '& .MuiInputBase-root': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                    }
                  },
                  '& .MuiSelect-select': { color: cardTextColor },
                  '& .MuiSelect-icon': { color: cardTextColor }
                }}
              >
                <CardHeader
                  title={domainObj.domain}
                  subheader={traitCount + ' traits'}
                  action={
                    <IconButton onClick={function() { toggleDomain(domainObj.domain); }} sx={{ color: cardTextColor }}>
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  }
                  onClick={function() { toggleDomain(domainObj.domain); }}
                  sx={{
                    cursor: 'pointer',
                    '& .MuiCardHeader-title': { color: cardTextColor, fontSize: '1.1rem' },
                    '& .MuiCardHeader-subheader': { color: secondaryTextColor }
                  }}
                />

                <Collapse in={isExpanded}>
                  <CardContent sx={{ pt: 0 }}>
                    {domainObj.panels.map(function(panel) {
                      return (
                        <Box key={panel.panel} sx={{ mb: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ color: secondaryTextColor, mb: 0.5, fontWeight: 600 }}
                          >
                            {panel.panel}
                          </Typography>

                          {panel.traits.map(function(t) {
                            const currentValue = get(traitValues, t.localCode, '');

                            return (
                              <Box
                                key={t.localCode}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  py: 0.75,
                                  px: 1.5,
                                  borderBottom: '1px solid ' + borderColor
                                }}
                              >
                                {/* Left side: Trait name + description */}
                                <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: cardTextColor }}>
                                    {t.trait}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                                    {t.description}
                                  </Typography>
                                </Box>

                                {/* Right side: Value display or input */}
                                <Box sx={{ width: '40%', flexShrink: 0, textAlign: 'right' }}>
                                  {isLocked ? (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: currentValue ? cardTextColor : secondaryTextColor,
                                        pt: 0.5
                                      }}
                                    >
                                      {currentValue || '—'}
                                    </Typography>
                                  ) : t.localCode === 'dominant-hand' ? (
                                    <FormControl size="small" fullWidth>
                                      <Select
                                        value={currentValue}
                                        onChange={function(e) { handleTraitChange(t.localCode, e.target.value); }}
                                        displayEmpty
                                        sx={{
                                          color: cardTextColor,
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                                          }
                                        }}
                                      >
                                        <MenuItem value="" disabled>Select hand</MenuItem>
                                        <MenuItem value="Left">Left</MenuItem>
                                        <MenuItem value="Right">Right</MenuItem>
                                        <MenuItem value="Ambidextrous">Ambidextrous</MenuItem>
                                      </Select>
                                    </FormControl>
                                  ) : (
                                    <TextField
                                      size="small"
                                      variant="outlined"
                                      value={currentValue}
                                      onChange={function(e) { handleTraitChange(t.localCode, e.target.value); }}
                                      placeholder={t.trait}
                                      fullWidth
                                      {...getInputProps(t.valueType)}
                                    />
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      );
                    })}
                  </CardContent>
                </Collapse>
              </Card>
            );
          })}
        </Box>

        {/* ===================== RIGHT COLUMN: Visualization ===================== */}
        <Box>
          {/* 3D Anatomy mode */}
          {vizMode === 'anatomy' && (
            <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              border: '1px solid ' + borderColor,
              minHeight: 'calc(100vh - 120px)'
            }}>
              <CardHeader
                title="3D Anatomy"
                action={
                  <ToggleButtonGroup
                    value={vizMode}
                    exclusive
                    onChange={handleVizModeChange}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: secondaryTextColor,
                        borderColor: borderColor,
                        '&.Mui-selected': {
                          color: isDark ? '#90caf9' : '#1976d2',
                          bgcolor: isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="anatomy">
                      <ViewInArIcon sx={{ mr: 0.5 }} /> 3D Anatomy
                    </ToggleButton>
                    <ToggleButton value="dermatomes">
                      <GridOnIcon sx={{ mr: 0.5 }} /> Dermatomes
                    </ToggleButton>
                  </ToggleButtonGroup>
                }
                sx={{
                  '& .MuiCardHeader-title': { color: cardTextColor, fontSize: '1rem' }
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <iframe
                  src="https://www.zygotebody.com/#nav=-7.08,109.75,52.47,0,0,0,0&sel=p:;h:;s:;c:0;o:0&layers=0,1,0,0,0,0,0,0,0,0,0,0,0"
                  title="Zygote Body 3D Anatomy"
                  style={{
                    width: '100%',
                    height: 'calc(100vh - 200px)',
                    border: 'none',
                    display: 'block'
                  }}
                  allowFullScreen
                />
              </CardContent>
            </Card>
          )}

          {/* Dermatome mode */}
          {vizMode === 'dermatomes' && (
            <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              border: '1px solid ' + borderColor,
              minHeight: 'calc(100vh - 120px)'
            }}>
              <CardHeader
                title="Dermatome Map"
                action={
                  <ToggleButtonGroup
                    value={vizMode}
                    exclusive
                    onChange={handleVizModeChange}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: secondaryTextColor,
                        borderColor: borderColor,
                        '&.Mui-selected': {
                          color: isDark ? '#90caf9' : '#1976d2',
                          bgcolor: isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="anatomy">
                      <ViewInArIcon sx={{ mr: 0.5 }} /> 3D Anatomy
                    </ToggleButton>
                    <ToggleButton value="dermatomes">
                      <GridOnIcon sx={{ mr: 0.5 }} /> Dermatomes
                    </ToggleButton>
                  </ToggleButtonGroup>
                }
                sx={{
                  '& .MuiCardHeader-title': { color: cardTextColor, fontSize: '1rem' }
                }}
              />
              <CardContent>
                {/* Sex toggle */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <ToggleButtonGroup
                    value={sex}
                    exclusive
                    onChange={function(e, val) { if (val) setSex(val); }}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: secondaryTextColor,
                        borderColor: borderColor,
                        '&.Mui-selected': {
                          color: isDark ? '#90caf9' : '#1976d2',
                          bgcolor: isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="Male"><MaleIcon sx={{ mr: 0.5 }} /> Male</ToggleButton>
                    <ToggleButton value="Female"><FemaleIcon sx={{ mr: 0.5 }} /> Female</ToggleButton>
                  </ToggleButtonGroup>

                  <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={function(e, val) { if (val) setView(val); }}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: secondaryTextColor,
                        borderColor: borderColor,
                        '&.Mui-selected': {
                          color: isDark ? '#90caf9' : '#1976d2',
                          bgcolor: isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="Front">Front</ToggleButton>
                    <ToggleButton value="Back">Back</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Dermatome image */}
                <img
                  src={dermatomeUrl}
                  alt={sex + ' dermatome map (' + view + ')'}
                  style={{
                    width: '100%',
                    objectFit: 'contain'
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Container>
  );
}

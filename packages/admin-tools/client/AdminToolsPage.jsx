// packages/admin-tools/client/AdminToolsPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

let useNavigate;
let useAppTheme;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
  useAppTheme = Meteor.useTheme;
});

import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Card,
  CardHeader,
  Chip,
  Container,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ArchiveIcon from '@mui/icons-material/Archive';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import SecurityIcon from '@mui/icons-material/Security';

const adminTools = [
  {
    title: 'Sessions',
    path: '/sessions',
    description: 'View and manage Meteor sessions',
    icon: PeopleIcon
  },
  {
    title: 'Database Admin',
    path: '/database-admin',
    description: 'Database administration and collection browser',
    icon: StorageIcon
  },
  {
    title: 'Delete Patient',
    path: '/delete-patient',
    description: 'Cascade delete a patient and all linked FHIR resources',
    icon: PersonRemoveIcon
  },
  {
    title: 'Archive Patient',
    path: '/archive-patient',
    description: 'Archive and remove a patient and all linked FHIR resources',
    icon: ArchiveIcon
  },
  {
    title: 'Rename Patient',
    path: '/rename-patient',
    description: 'Rename a patient and update all linked FHIR resource display names',
    icon: DriveFileRenameOutlineIcon
  },
  {
    title: 'Anonymize Patient',
    path: '/anonymize-patient',
    description: 'HIPAA Safe Harbor de-identification of a patient and all linked resources',
    icon: SecurityIcon
  }
];

function AdminToolsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientParam, setPatientParam] = useState(null);

  // On mount, read ?patient= from URL
  useEffect(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientValue = urlParams.get('patient');
    if (patientValue) {
      setPatientParam(patientValue);
    }
  }, []);

  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  const adminAccent = {
    bg: isDark ? 'rgba(244, 67, 54, 0.25)' : 'rgba(211, 47, 47, 0.12)',
    border: isDark ? 'rgba(244, 67, 54, 0.8)' : 'rgba(211, 47, 47, 0.6)',
    icon: isDark ? 'rgb(244, 67, 54)' : 'rgb(211, 47, 47)'
  };

  const filteredTools = adminTools.filter(function(tool) {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.path.toLowerCase().includes(query)
    );
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'text.primary' }}>
          Admin Tools
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Administrative utilities for managing patients, sessions, and database operations
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search admin tools..."
          value={searchQuery}
          onChange={function(e) { setSearchQuery(e.target.value); }}
          sx={{
            mt: 2,
            '& .MuiInputBase-root': { color: cardTextColor },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
            },
            '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: secondaryTextColor }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        {searchQuery && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Found {filteredTools.length} result{filteredTools.length !== 1 ? 's' : ''} for "{searchQuery}"
          </Typography>
        )}
      </Box>

      {patientParam && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
            color: cardTextColor,
            '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
            '& .MuiAlertTitle-root': { color: cardTextColor }
          }}
        >
          <AlertTitle>Patient Context</AlertTitle>
          Patient ID: <strong>{patientParam}</strong> — selecting a tool below will pre-load this patient.
        </Alert>
      )}

      {filteredTools.map(function(tool) {
        const IconComponent = tool.icon;
        return (
          <Card
            key={tool.path}
            onClick={function() {
              if (patientParam) {
                navigate(tool.path + '?patientId=' + patientParam);
              } else {
                navigate(tool.path);
              }
            }}
            sx={{
              cursor: 'pointer',
              mb: 1.5,
              borderRadius: 2,
              borderLeft: '4px solid',
              borderLeftColor: adminAccent.border,
              bgcolor: cardBgColor,
              color: cardTextColor,
              borderColor: borderColor,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 4,
                backgroundColor: hoverBgColor,
                transform: 'translateX(2px)'
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: adminAccent.bg, width: 40, height: 40 }}>
                  <IconComponent sx={{ color: adminAccent.icon, fontSize: 22 }} />
                </Avatar>
              }
              title={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {tool.title}
                </Typography>
              }
              subheader={tool.description}
              sx={{
                '& .MuiCardHeader-subheader': { color: secondaryTextColor }
              }}
              action={
                <Chip
                  label={tool.path}
                  size="small"
                  variant="outlined"
                  sx={{
                    mt: 1, mr: 1,
                    fontFamily: 'monospace', fontSize: '0.7rem',
                    color: secondaryTextColor,
                    borderColor: borderColor
                  }}
                />
              }
            />
          </Card>
        );
      })}

      {searchQuery && filteredTools.length === 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No admin tools found for "{searchQuery}"
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default AdminToolsPage;

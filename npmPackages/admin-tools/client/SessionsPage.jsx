// packages/admin-tools/client/SessionsPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  Tooltip
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Get Honeycomb theme hook
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

function SessionsPage() {
  const [searchFilter, setSearchFilter] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Get Honeycomb theme state
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const codeBgColor = isDark ? '#2a2a2a' : '#f5f5f5';

  // Common Session keys used in Honeycomb
  const commonSessionKeys = [
    'selectedPatient',
    'selectedPatientId',
    'selectedPractitioner',
    'selectedPractitionerId',
    'currentUser',
    'appWidth',
    'appHeight',
    'lastUpdated',
    'mainPanelIsCard',
    'drawerIsOpen',
    'selectedAiPersona',
    'accountsRecordId',
    'primaryColor'
  ];

  // Get session values reactively
  const sessionData = useTracker(function() {
    // Force re-run when refresh counter changes
    const _ = refreshCounter;

    const data = [];
    commonSessionKeys.forEach(function(key) {
      const value = Session.get(key);
      if (value !== undefined) {
        data.push({
          key: key,
          value: value,
          type: typeof value
        });
      }
    });

    return data;
  }, [refreshCounter]);

  // Filter session data
  const filteredData = sessionData.filter(function(item) {
    if (!searchFilter) return true;
    return item.key.toLowerCase().includes(searchFilter.toLowerCase());
  });

  function handleRefresh() {
    setRefreshCounter(function(prev) {
      return prev + 1;
    });
  }

  function handleClearSession(key) {
    Session.set(key, null);
    handleRefresh();
  }

  function handleCopyValue(value) {
    const textValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(textValue);
  }

  function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(value);
  }

  function getTypeChip(type) {
    const colorMap = {
      'string': 'primary',
      'number': 'secondary',
      'boolean': 'success',
      'object': 'warning',
      'undefined': 'default'
    };
    return (
      <Chip
        label={type}
        size="small"
        color={colorMap[type] || 'default'}
        sx={{ minWidth: 70 }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Session Variables Card */}
      <Card sx={{
        boxShadow: 3,
        bgcolor: cardBgColor,
        color: cardTextColor,
        // Nested selectors for MUI children
        '& .MuiTableCell-root': {
          color: cardTextColor,
          borderColor: borderColor
        },
        '& .MuiTextField-root': {
          '& .MuiInputLabel-root': { color: secondaryTextColor },
          '& .MuiInputBase-root': { color: cardTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
          }
        },
        '& .MuiIconButton-root': { color: cardTextColor },
        '& .MuiButton-outlined': {
          borderColor: isDark ? 'rgba(244, 67, 54, 0.5)' : undefined
        }
      }}>
        <CardHeader
          title="Session Variables"
          subheader="View and manage Meteor Session variables"
          sx={{
            bgcolor: 'primary.main',
            '& .MuiCardHeader-title': { color: '#ffffff' },
            '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
          }}
          action={
            <IconButton onClick={handleRefresh} sx={{ color: '#ffffff' }}>
              <RefreshIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Search Session Keys"
              variant="outlined"
              value={searchFilter}
              onChange={function(e) { setSearchFilter(e.target.value); }}
              placeholder="Filter by key name..."
            />
          </Box>

          {filteredData.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                color: cardTextColor,
                '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' }
              }}
            >
              No session variables found matching your filter.
            </Alert>
          ) : (
            <TableContainer>
              <Table id="sessionsTable">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Key</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map(function(item) {
                    return (
                      <TableRow
                        key={item.key}
                        sx={{ '&:hover': { backgroundColor: hoverBgColor } }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {item.key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getTypeChip(item.type)}
                        </TableCell>
                        <TableCell>
                          <Box
                            component="pre"
                            sx={{
                              m: 0,
                              p: 1,
                              backgroundColor: codeBgColor,
                              color: cardTextColor,
                              borderRadius: 1,
                              maxHeight: 150,
                              overflow: 'auto',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              border: `1px solid ${borderColor}`
                            }}
                          >
                            {formatValue(item.value)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Copy value">
                              <IconButton
                                size="small"
                                onClick={function() { handleCopyValue(item.value); }}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Clear value">
                              <IconButton
                                size="small"
                                onClick={function() { handleClearSession(item.key); }}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: secondaryTextColor }}>
              Showing {filteredData.length} of {sessionData.length} session variables
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={function() {
                commonSessionKeys.forEach(function(key) {
                  Session.set(key, null);
                });
                handleRefresh();
              }}
            >
              Clear All Sessions
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Session Info Card */}
      <Card sx={{
        mt: 3,
        boxShadow: 3,
        bgcolor: cardBgColor,
        color: cardTextColor
      }}>
        <CardHeader
          title="Session Info"
          sx={{
            bgcolor: 'secondary.main',
            '& .MuiCardHeader-title': { color: '#ffffff' }
          }}
        />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>
                Connection Status
              </Typography>
              <Chip
                label={Meteor.status().connected ? 'Connected' : 'Disconnected'}
                color={Meteor.status().connected ? 'success' : 'error'}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>
                User ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: cardTextColor }}>
                {Meteor.userId() || 'Not logged in'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default SessionsPage;

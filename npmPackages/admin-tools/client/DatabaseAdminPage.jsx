// packages/admin-tools/client/DatabaseAdminPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import StorageIcon from '@mui/icons-material/Storage';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningIcon from '@mui/icons-material/Warning';

import { scanCollectionAdminMethods, mergeWithCollectionStats } from '../lib/AdminMethodsScanner';

// Get Honeycomb theme hook
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

function DatabaseAdminPage() {
  const [searchFilter, setSearchFilter] = useState('');
  const [collectionStats, setCollectionStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingMethod, setExecutingMethod] = useState(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    dangerous: false,
    onConfirm: null
  });

  // Snackbar state for feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Get Honeycomb theme state
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const dangerBgColor = isDark ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.1)';

  // Load collection stats on mount
  useEffect(function() {
    loadCollectionStats();
  }, []);

  function loadCollectionStats() {
    setLoading(true);
    Meteor.call('adminTools.getCollectionStats', function(error, result) {
      setLoading(false);
      if (error) {
        console.error('Error loading collection stats:', error);
        showSnackbar('Error loading collections: ' + error.message, 'error');
      } else {
        // Merge with scanned admin methods from packages
        const enrichedStats = mergeWithCollectionStats(result || []);
        setCollectionStats(enrichedStats);
      }
    });
  }

  function showSnackbar(message, severity) {
    setSnackbar({ open: true, message: message, severity: severity || 'info' });
  }

  function handleCloseSnackbar() {
    setSnackbar({ ...snackbar, open: false });
  }

  function openConfirmDialog(title, message, dangerous, onConfirm) {
    setConfirmDialog({
      open: true,
      title: title,
      message: message,
      dangerous: dangerous,
      onConfirm: onConfirm
    });
  }

  function closeConfirmDialog() {
    setConfirmDialog({ ...confirmDialog, open: false });
  }

  function handleExecuteMethod(collectionName, method) {
    const executeAction = function() {
      setExecutingMethod(collectionName + '.' + method.name);
      closeConfirmDialog();

      Meteor.call('adminTools.executeMethod', method.methodName, {}, function(error, result) {
        setExecutingMethod(null);
        if (error) {
          console.error('Error executing method:', error);
          showSnackbar('Error: ' + error.message, 'error');
        } else {
          showSnackbar(method.label + ' completed successfully', 'success');
          // Refresh stats after action
          loadCollectionStats();
        }
      });
    };

    if (method.confirmRequired || method.dangerous) {
      openConfirmDialog(
        'Confirm: ' + method.label,
        method.description || 'Are you sure you want to execute this action on ' + collectionName + '?',
        method.dangerous,
        executeAction
      );
    } else {
      executeAction();
    }
  }

  function handleDropCollection(collectionName, count) {
    openConfirmDialog(
      'Drop Collection: ' + collectionName,
      'This will permanently delete all ' + count.toLocaleString() + ' documents from ' + collectionName + '. This action cannot be undone.',
      true,
      function() {
        setExecutingMethod(collectionName + '.drop');
        closeConfirmDialog();

        Meteor.call('adminTools.dropCollection', collectionName, function(error, result) {
          setExecutingMethod(null);
          if (error) {
            console.error('Error dropping collection:', error);
            showSnackbar('Error: ' + error.message, 'error');
          } else {
            showSnackbar('Dropped ' + result.documentsRemoved + ' documents from ' + collectionName, 'success');
            loadCollectionStats();
          }
        });
      }
    );
  }

  function handleInitializeCollection(collectionName) {
    openConfirmDialog(
      'Initialize: ' + collectionName,
      'This will attempt to initialize ' + collectionName + ' with sample data. Existing data will not be affected.',
      false,
      function() {
        setExecutingMethod(collectionName + '.initialize');
        closeConfirmDialog();

        Meteor.call('adminTools.initializeCollection', collectionName, function(error, result) {
          setExecutingMethod(null);
          if (error) {
            console.error('Error initializing collection:', error);
            showSnackbar('Error: ' + error.message, 'error');
          } else if (result.success) {
            showSnackbar('Initialized ' + collectionName + ' successfully', 'success');
            loadCollectionStats();
          } else {
            showSnackbar(result.message || 'No initializer found', 'warning');
          }
        });
      }
    );
  }

  // Filter collections
  const filteredStats = collectionStats.filter(function(item) {
    if (!searchFilter) return true;
    return item.name.toLowerCase().includes(searchFilter.toLowerCase());
  });

  // Calculate totals
  const totalDocuments = collectionStats.reduce(function(sum, item) {
    return sum + (item.count || 0);
  }, 0);

  // Count collections with admin methods
  const collectionsWithMethods = collectionStats.filter(function(item) {
    return item.adminMethods && item.adminMethods.length > 0;
  }).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Database Administration Card */}
      <Card sx={{
        boxShadow: 3,
        bgcolor: cardBgColor,
        color: cardTextColor,
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
        '& .MuiChip-colorDefault': {
          color: cardTextColor,
          borderColor: borderColor
        }
      }}>
        <CardHeader
          title="Database Administration"
          subheader="Run administrative operations on collections"
          sx={{
            bgcolor: 'primary.main',
            '& .MuiCardHeader-title': { color: '#ffffff' },
            '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
          }}
          action={
            <IconButton onClick={loadCollectionStats} sx={{ color: '#ffffff' }}>
              <RefreshIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Search Collections"
              variant="outlined"
              value={searchFilter}
              onChange={function(e) { setSearchFilter(e.target.value); }}
              placeholder="Filter by collection name..."
            />
            <Box sx={{ minWidth: 220, textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                Collections: {collectionStats.length} ({collectionsWithMethods} with methods)
              </Typography>
              <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                Total Documents: {totalDocuments.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredStats.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                color: cardTextColor,
                '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' }
              }}
            >
              No collections found matching your filter.
            </Alert>
          ) : (
            <TableContainer>
              <Table id="databaseAdminTable">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Collection</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', width: 100 }}>Count</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 200 }}>Package</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 250 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStats.map(function(item) {
                    const isExecuting = executingMethod && executingMethod.startsWith(item.name);
                    const hasCustomMethods = item.adminMethods && item.adminMethods.length > 0;

                    return (
                      <TableRow
                        key={item.name}
                        sx={{ '&:hover': { backgroundColor: hoverBgColor } }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StorageIcon sx={{ color: secondaryTextColor }} fontSize="small" />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {item.name}
                            </Typography>
                            {item.isFhir && (
                              <Chip label="FHIR" size="small" color="success" variant="outlined" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Chip
                            label={item.count.toLocaleString()}
                            size="small"
                            color={item.count > 0 ? 'primary' : 'default'}
                            variant={item.count > 0 ? 'filled' : 'outlined'}
                            sx={item.count === 0 ? { color: cardTextColor, borderColor: borderColor } : {}}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              color: secondaryTextColor,
                              fontFamily: 'monospace',
                              fontSize: '0.7rem'
                            }}
                          >
                            {item.packageName || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {isExecuting ? (
                              <CircularProgress size={24} />
                            ) : (
                              <>
                                {/* Render custom methods from packages */}
                                {hasCustomMethods && item.adminMethods.map(function(method) {
                                  return (
                                    <Button
                                      key={method.name}
                                      size="small"
                                      variant={method.dangerous ? 'outlined' : 'contained'}
                                      color={method.dangerous ? 'error' : 'primary'}
                                      onClick={function() { handleExecuteMethod(item.name, method); }}
                                      startIcon={method.dangerous ? <WarningIcon /> : <PlayArrowIcon />}
                                      sx={{ textTransform: 'none', minWidth: 'auto' }}
                                    >
                                      {method.label}
                                    </Button>
                                  );
                                })}

                                {/* Default actions for all collections */}
                                {!hasCustomMethods && (
                                  <>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="primary"
                                      onClick={function() { handleInitializeCollection(item.name); }}
                                      startIcon={<PlayArrowIcon />}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      Init
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={function() { handleDropCollection(item.name, item.count); }}
                                      startIcon={<DeleteForeverIcon />}
                                      disabled={item.count === 0}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      Drop
                                    </Button>
                                  </>
                                )}

                                {/* Always show Drop for collections with custom methods too */}
                                {hasCustomMethods && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={function() { handleDropCollection(item.name, item.count); }}
                                    startIcon={<DeleteForeverIcon />}
                                    disabled={item.count === 0}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Drop
                                  </Button>
                                )}
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Database Info Card */}
      <Card sx={{
        mt: 3,
        boxShadow: 3,
        bgcolor: cardBgColor,
        color: cardTextColor
      }}>
        <CardHeader
          title="Database Info"
          sx={{
            bgcolor: 'secondary.main',
            '& .MuiCardHeader-title': { color: '#ffffff' }
          }}
        />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>
                Total Collections
              </Typography>
              <Typography variant="h5" sx={{ color: cardTextColor }}>
                {collectionStats.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>
                Total Documents
              </Typography>
              <Typography variant="h5" sx={{ color: cardTextColor }}>
                {totalDocuments.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>
                FHIR Resources
              </Typography>
              <Typography variant="h5" sx={{ color: cardTextColor }}>
                {collectionStats.filter(function(c) { return c.isFhir; }).length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>
                With Admin Methods
              </Typography>
              <Typography variant="h5" sx={{ color: cardTextColor }}>
                {collectionsWithMethods}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        PaperProps={{
          sx: {
            bgcolor: cardBgColor,
            color: cardTextColor
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: confirmDialog.dangerous ? 'error.main' : cardTextColor
        }}>
          {confirmDialog.dangerous && <WarningIcon color="error" />}
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: secondaryTextColor }}>
            {confirmDialog.message}
          </DialogContentText>
          {confirmDialog.dangerous && (
            <Alert
              severity="warning"
              sx={{
                mt: 2,
                bgcolor: dangerBgColor,
                color: cardTextColor,
                '& .MuiAlert-icon': { color: '#ff9800' }
              }}
            >
              This is a destructive action and cannot be undone.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} sx={{ color: secondaryTextColor }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            color={confirmDialog.dangerous ? 'error' : 'primary'}
            variant="contained"
            autoFocus
          >
            {confirmDialog.dangerous ? 'Yes, Delete' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            bgcolor: isDark
              ? (snackbar.severity === 'success' ? 'rgba(46, 125, 50, 0.9)'
                : snackbar.severity === 'error' ? 'rgba(211, 47, 47, 0.9)'
                : snackbar.severity === 'warning' ? 'rgba(237, 108, 2, 0.9)'
                : 'rgba(33, 150, 243, 0.9)')
              : undefined,
            color: isDark ? '#ffffff' : undefined
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default DatabaseAdminPage;

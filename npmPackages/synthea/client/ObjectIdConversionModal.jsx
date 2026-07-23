// /packages/synthea/client/ObjectIdConversionModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  Collapse,
  Card,
  CardContent
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Pending,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  ExpandLess,
  Storage,
  Transform,
  Warning
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';

// Synthea collections list
const SYNTHEA_COLLECTIONS = [
  'AllergyIntolerances',
  'CarePlans',
  'CareTeams',
  'Claims',
  'CodeSystems',
  'Conditions',
  'Devices',
  'DiagnosticReports',
  'DocumentReferences',
  'Encounters',
  'ExplanationOfBenefits',
  'ImagingStudies',
  'Immunizations',
  'Locations',
  'MedicationAdministrations',
  'MedicationRequests',
  'Medications',
  'Observations',
  'Organizations',
  'Patients',
  'Practitioners',
  'Procedures',
  'Provenances',
  'SupplyDeliveries'
];

const ObjectIdConversionModal = ({ open, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [createBackup, setCreateBackup] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState(SYNTHEA_COLLECTIONS);
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);

  const handleStart = async () => {
    setIsRunning(true);
    setError(null);
    setResults({});
    setTotalProgress(0);

    try {
      const result = await Meteor.rpc('synthea.convertObjectIds', {
        collections: selectedCollections,
        dryRun: isDryRun,
        createBackup: createBackup
      });
      setIsRunning(false);
      setResults(result.results || {});
      // Calculate final progress
      const completedCollections = Object.keys(result.results || {}).length;
      const totalCollections = selectedCollections.length;
      setTotalProgress((completedCollections / totalCollections) * 100);
    } catch (err) {
      setIsRunning(false);
      setError(err.message);
    }
  };

  const handleStop = async () => {
    try {
      await Meteor.rpc('synthea.stopObjectIdConversion');
      setIsRunning(false);
    } catch (err) {
      // no-op: original only acted on success
    }
  };

  const handleCollectionToggle = (collection) => {
    if (selectedCollections.includes(collection)) {
      setSelectedCollections(selectedCollections.filter(c => c !== collection));
    } else {
      setSelectedCollections([...selectedCollections, collection]);
    }
  };

  const getCollectionStatus = (collection) => {
    const result = results[collection];
    if (!result) return 'pending';
    if (result.error) return 'error';
    if (result.converted > 0) return 'success';
    return 'complete';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'complete':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'running':
        return <Transform color="primary" />;
      default:
        return <Pending color="disabled" />;
    }
  };

  const getTotalStats = () => {
    let totalProcessed = 0;
    let totalConverted = 0;
    let totalErrors = 0;

    Object.values(results).forEach(result => {
      if (result.processed) totalProcessed += result.processed;
      if (result.converted) totalConverted += result.converted;
      if (result.errors) totalErrors += result.errors;
    });

    return { totalProcessed, totalConverted, totalErrors };
  };

  const { totalProcessed, totalConverted, totalErrors } = getTotalStats();

  return (
    <Dialog 
      open={open} 
      onClose={!isRunning ? onClose : undefined}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isRunning}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Convert MongoDB ObjectIDs to Strings</Typography>
          {isRunning && (
            <Chip 
              icon={<Transform />} 
              label="Conversion in Progress" 
              color="primary" 
              size="small"
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Important</AlertTitle>
          This operation will modify your database. Make sure you have a backup before proceeding.
        </Alert>

        {/* Configuration Options */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Configuration Options
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isDryRun}
                  onChange={(e) => setIsDryRun(e.target.checked)}
                  disabled={isRunning}
                />
              }
              label={
                <Box>
                  <Typography>Dry Run Mode</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Test the conversion without making changes
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={createBackup}
                  onChange={(e) => setCreateBackup(e.target.checked)}
                  disabled={isRunning || isDryRun}
                />
              }
              label={
                <Box>
                  <Typography>Create Backups</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Backup collections before conversion
                  </Typography>
                </Box>
              }
            />
          </CardContent>
        </Card>

        {/* Progress Bar */}
        {isRunning && (
          <Box sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2">Overall Progress</Typography>
              <Typography variant="body2">{Math.round(totalProgress)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={totalProgress} />
          </Box>
        )}

        {/* Summary Stats */}
        {(totalProcessed > 0 || isRunning) && (
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Chip label={`Processed: ${totalProcessed}`} size="small" />
            <Chip label={`Converted: ${totalConverted}`} size="small" color="success" />
            {totalErrors > 0 && (
              <Chip label={`Errors: ${totalErrors}`} size="small" color="error" />
            )}
          </Box>
        )}

        {/* Collection Selection */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" gutterBottom>
              Collections to Process
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setShowDetails(!showDetails)}
              disabled={isRunning}
            >
              {showDetails ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={showDetails}>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
              {SYNTHEA_COLLECTIONS.map((collection) => (
                <FormControlLabel
                  key={collection}
                  control={
                    <Checkbox
                      checked={selectedCollections.includes(collection)}
                      onChange={() => handleCollectionToggle(collection)}
                      disabled={isRunning}
                      size="small"
                    />
                  }
                  label={collection}
                  sx={{ display: 'block', mb: 0.5 }}
                />
              ))}
            </Box>
          </Collapse>
        </Box>

        {/* Results List */}
        <List sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {selectedCollections.map((collection) => {
            const result = results[collection];
            const status = getCollectionStatus(collection);
            
            return (
              <ListItem key={collection} divider>
                <ListItemIcon>
                  {getStatusIcon(status)}
                </ListItemIcon>
                <ListItemText 
                  primary={collection}
                  secondary={
                    result ? (
                      <Typography variant="caption">
                        {result.error ? `Error: ${result.error}` :
                         `Processed: ${result.processed || 0}, Converted: ${result.converted || 0}${result.backup ? ', Backup created' : ''}`}
                      </Typography>
                    ) : (
                      'Pending'
                    )
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={isRunning}
        >
          Close
        </Button>
        {!isRunning ? (
          <Button
            variant="contained"
            onClick={handleStart}
            startIcon={<PlayArrow />}
            disabled={selectedCollections.length === 0}
          >
            {isDryRun ? 'Start Dry Run' : 'Start Conversion'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={handleStop}
            startIcon={<Stop />}
          >
            Stop
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ObjectIdConversionModal;
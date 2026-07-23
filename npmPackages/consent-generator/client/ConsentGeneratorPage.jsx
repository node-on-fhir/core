// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/consent-generator/client/ConsentGeneratorPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';

export function ConsentGeneratorPage(props) {
  // State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentConsents, setRecentConsents] = useState([]);
  
  // Form fields
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [practitionerId, setPractitionerId] = useState('');
  const [practitionerName, setPractitionerName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [batchCount, setBatchCount] = useState(1);

  // Load templates on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await Meteor.rpc('consents.listTemplates');
        setTemplates(result || []);
        if (result && result.length > 0) {
          setSelectedTemplate(result[0].id);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setError('Failed to load templates');
      }
    })();

    loadRecentConsents();
  }, []);

  // Load recent consents
  const loadRecentConsents = async () => {
    try {
      const result = await Meteor.rpc('consents.list');
      setRecentConsents(result || []);
    } catch (error) {
      console.error('Error loading consents:', error);
    }
  };

  // Generate consent
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');

    const options = {
      template: selectedTemplate,
      patientId: patientId || undefined,
      patientName: patientName || undefined,
      practitionerId: practitionerId || undefined,
      practitionerName: practitionerName || undefined,
      organizationId: organizationId || undefined,
      organizationName: organizationName || undefined
    };

    if (batchCount > 1) {
      try {
        const result = await Meteor.rpc('consents.generateBatch', {
          options: {
            template: selectedTemplate,
            count: batchCount,
            baseOptions: options
          }
        });
        setGenerating(false);
        setSuccess(`Generated ${result.generated} consent records`);
        loadRecentConsents();
      } catch (error) {
        setGenerating(false);
        setError(error.message);
      }
    } else {
      try {
        await Meteor.rpc('consents.generate', { options: options });
        setGenerating(false);
        setSuccess('Consent generated successfully');
        loadRecentConsents();
      } catch (error) {
        setGenerating(false);
        setError(error.message);
      }
    }
  };

  // Delete consent
  const handleDelete = async (consentId) => {
    try {
      await Meteor.rpc('consents.remove', { consentId: consentId });
      setSuccess('Consent removed');
      loadRecentConsents();
    } catch (error) {
      setError(error.message);
    }
  };

  // Clear all consents
  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete ALL consent records? This cannot be undone!')) {
      try {
        const result = await Meteor.rpc('consents.clearAll');
        setSuccess(`Cleared ${result.consentsRemoved} consents and ${result.aclsRemoved} ACL records`);
        loadRecentConsents();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  // Initialize defaults
  const handleInitializeDefaults = async () => {
    try {
      const result = await Meteor.rpc('consents.initializeDefaults');
      setSuccess(result.message);
      loadRecentConsents();
    } catch (error) {
      setError(error.message);
    }
  };

  const selectedTemplateInfo = templates.find(t => t.id === selectedTemplate);

  return (
    <Container maxWidth="lg" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Consent Generator
          </Typography>
          <Alert severity="warning">
            This is a development tool. Remove this package before deploying to production!
          </Alert>
        </Grid>

        {/* Generator Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Generate Consent Records"
              action={
                <Button 
                  startIcon={<RefreshIcon />}
                  onClick={loadRecentConsents}
                >
                  Refresh
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {/* Template Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      label="Template"
                    >
                      {templates.map(template => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedTemplateInfo && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                      {selectedTemplateInfo.description}
                    </Typography>
                  )}
                </Grid>

                {/* Optional Fields */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Patient ID"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    helperText="Leave blank for auto-generated"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Patient Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Practitioner ID"
                    value={practitionerId}
                    onChange={(e) => setPractitionerId(e.target.value)}
                    helperText="For provider consents"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Practitioner Name"
                    value={practitionerName}
                    onChange={(e) => setPractitionerName(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Organization ID"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Organization Name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </Grid>

                {/* Batch Generation */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number to Generate"
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 100 }}
                    helperText="Generate multiple consents at once (max 100)"
                  />
                </Grid>
              </Grid>

              {/* Messages */}
              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerate}
                disabled={generating || !selectedTemplate}
                startIcon={generating ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {generating ? 'Generating...' : 'Generate'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleInitializeDefaults}
              >
                Initialize Defaults
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Recent Consents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={`Recent Consents (${recentConsents.length})`}
              subheader="Most recent 100 consents"
            />
            <CardContent style={{ maxHeight: '600px', overflow: 'auto' }}>
              {recentConsents.length === 0 ? (
                <Typography color="textSecondary" align="center">
                  No consents found. Generate some to get started!
                </Typography>
              ) : (
                <List>
                  {recentConsents.map((consent, index) => (
                    <React.Fragment key={consent.id || consent._id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {consent.id}
                              </Typography>
                              <Chip 
                                label={consent.status} 
                                size="small"
                                color={consent.status === 'active' ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Category: {get(consent, 'category[0].coding[0].display', 'Unknown')}
                              </Typography>
                              {consent.patient && (
                                <Typography variant="caption" display="block">
                                  Patient: {get(consent, 'patient.display', consent.patient.reference)}
                                </Typography>
                              )}
                              <Typography variant="caption" display="block">
                                Role: {get(consent, 'provision.actor[0].role.coding[0].code', 'Unknown')}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Resources: {get(consent, 'provision.class', []).length} types
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(consent.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API Endpoints
            </Typography>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`GET  /consent-generator/api                - API status and help
POST /consent-generator/api/generate       - Generate single consent
POST /consent-generator/api/batch          - Generate multiple consents
POST /consent-generator/api/initialize     - Initialize default consents

Example:
curl -X POST http://localhost:3000/consent-generator/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{"template": "patient-access", "patientId": "123"}'`}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

ConsentGeneratorPage.displayName = 'ConsentGeneratorPage';
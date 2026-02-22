// /imports/ui-fhir/measures/MeasureDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Grid
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function MeasureDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to Measures
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Measures', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('measures.all');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [measure, setMeasure] = useState({
    resourceType: "Measure",
    identifier: [{
      system: "http://example.org/measure-identifiers",
      value: ""
    }],
    version: "1.0.0",
    name: "",
    title: "",
    status: "draft",
    experimental: false,
    date: moment().format('YYYY-MM-DD'),
    publisher: "",
    description: "",
    purpose: "",
    usage: "",
    copyright: "",
    approvalDate: "",
    lastReviewDate: "",
    effectivePeriod: {
      start: "",
      end: ""
    },
    author: [{
      name: "",
      reference: ""
    }],
    scoring: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/measure-scoring",
        code: "proportion",
        display: "Proportion"
      }]
    },
    improvementNotation: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/measure-improvement-notation",
        code: "increase",
        display: "Increased score indicates improvement"
      }]
    },
    guidance: "",
    rateAggregation: "",
    clinicalRecommendationStatement: "",
    disclaimer: "",
    riskAdjustment: "",
    rationale: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set author on component mount for new measures
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new measures
      setIsEditing(true);
      
      // Set author to current user
      let authorName = '';
      let authorReference = '';
      
      if (currentUser) {
        authorName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        authorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setMeasure(prev => ({
        ...prev,
        publisher: authorName,
        author: [{
          name: authorName,
          reference: authorReference
        }]
      }));
    } else {
      // Viewing existing measure - start in read-only mode
      setIsEditing(false);
    }
  }, [id, currentUser]);

  // Load measure if editing existing
  useEffect(function() {
    if (id && id !== 'new' && isSubscriptionReady) {
      const existingMeasure = Measures.findOne({_id: id});
      if (existingMeasure) {
        setMeasure(existingMeasure);
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMeasure = { ...measure };
    set(updatedMeasure, path, value);
    setMeasure(updatedMeasure);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      const dataToSave = {
        identifier: get(measure, 'identifier[0].value', ''),
        version: get(measure, 'version', ''),
        name: get(measure, 'name', ''),
        title: get(measure, 'title', ''),
        status: get(measure, 'status', ''),
        description: get(measure, 'description', ''),
        purpose: get(measure, 'purpose', ''),
        usage: get(measure, 'usage', ''),
        copyright: get(measure, 'copyright', ''),
        approvalDate: get(measure, 'approvalDate', ''),
        lastReviewDate: get(measure, 'lastReviewDate', ''),
        effectivePeriodStart: get(measure, 'effectivePeriod.start', ''),
        effectivePeriodEnd: get(measure, 'effectivePeriod.end', ''),
        guidance: get(measure, 'guidance', ''),
        improvementNotation: get(measure, 'improvementNotation.coding[0].code', ''),
        rateAggregation: get(measure, 'rateAggregation', ''),
        clinicalRecommendationStatement: get(measure, 'clinicalRecommendationStatement', ''),
        disclaimer: get(measure, 'disclaimer', ''),
        riskAdjustment: get(measure, 'riskAdjustment', ''),
        rationale: get(measure, 'rationale', '')
      };

      if (id && id !== 'new') {
        // Update existing measure
        await Meteor.callAsync('updateMeasure', id, dataToSave);
        console.log('Measure updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new measure
        const newId = await Meteor.callAsync('createMeasure', dataToSave);
        console.log('Measure created with ID:', newId);
        // Navigate back to measures list for new measures
        navigate('/measures');
      }
    } catch (err) {
      console.error('Error saving measure:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this measure?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeMeasure', id);
        navigate('/measures');
      } catch (err) {
        console.error('Error deleting measure:', err);
        setError(err.message);
        setLoading(false);
      }
    }
  }

  return (
    <Container id="measureDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Measure' : 'New Measure'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* Barcode display for existing measures */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="identifierInput"
                fullWidth
                label="Identifier"
                value={get(measure, 'identifier[0].value', '')}
                onChange={(e) => handleChange('identifier[0].value', e.target.value)}
                disabled={!isEditing}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="versionInput"
                fullWidth
                label="Version"
                value={get(measure, 'version', '')}
                onChange={(e) => handleChange('version', e.target.value)}
                disabled={!isEditing}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="nameInput"
                fullWidth
                label="Name (Computer Friendly)"
                value={get(measure, 'name', '')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="titleInput"
                fullWidth
                label="Title (Human Friendly)"
                value={get(measure, 'title', '')}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={!isEditing}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  id="statusSelect"
                  labelId="status-label"
                  value={get(measure, 'status', 'draft')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="improvement-notation-label">Improvement Notation</InputLabel>
                <Select
                  id="improvementNotationSelect"
                  labelId="improvement-notation-label"
                  value={get(measure, 'improvementNotation.coding[0].code', 'increase')}
                  onChange={(e) => {
                    const notations = {
                      'increase': 'Increased score indicates improvement',
                      'decrease': 'Decreased score indicates improvement'
                    };
                    handleChange('improvementNotation.coding[0].code', e.target.value);
                    handleChange('improvementNotation.coding[0].display', notations[e.target.value]);
                  }}
                  disabled={!isEditing}
                  label="Improvement Notation"
                >
                  <MenuItem value="increase">Increase</MenuItem>
                  <MenuItem value="decrease">Decrease</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Descriptions */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Descriptions</Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="descriptionTextarea"
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={get(measure, 'description', '')}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="purposeTextarea"
                fullWidth
                multiline
                rows={3}
                label="Purpose"
                value={get(measure, 'purpose', '')}
                onChange={(e) => handleChange('purpose', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="usageTextarea"
                fullWidth
                multiline
                rows={2}
                label="Usage"
                value={get(measure, 'usage', '')}
                onChange={(e) => handleChange('usage', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Dates</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="effectivePeriodStartInput"
                fullWidth
                label="Effective Period Start"
                type="date"
                value={get(measure, 'effectivePeriod.start', '')}
                onChange={(e) => handleChange('effectivePeriod.start', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="effectivePeriodEndInput"
                fullWidth
                label="Effective Period End"
                type="date"
                value={get(measure, 'effectivePeriod.end', '')}
                onChange={(e) => handleChange('effectivePeriod.end', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="lastReviewDateInput"
                fullWidth
                label="Last Review Date"
                type="date"
                value={get(measure, 'lastReviewDate', '')}
                onChange={(e) => handleChange('lastReviewDate', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="approvalDateInput"
                fullWidth
                label="Approval Date"
                type="date"
                value={get(measure, 'approvalDate', '')}
                onChange={(e) => handleChange('approvalDate', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Additional Fields */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Additional Information</Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="copyrightTextarea"
                fullWidth
                multiline
                rows={2}
                label="Copyright"
                value={get(measure, 'copyright', '')}
                onChange={(e) => handleChange('copyright', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="guidanceTextarea"
                fullWidth
                multiline
                rows={3}
                label="Guidance"
                value={get(measure, 'guidance', '')}
                onChange={(e) => handleChange('guidance', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="rateAggregationInput"
                fullWidth
                label="Rate Aggregation"
                value={get(measure, 'rateAggregation', '')}
                onChange={(e) => handleChange('rateAggregation', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="clinicalRecommendationStatementTextarea"
                fullWidth
                multiline
                rows={3}
                label="Clinical Recommendation Statement"
                value={get(measure, 'clinicalRecommendationStatement', '')}
                onChange={(e) => handleChange('clinicalRecommendationStatement', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="disclaimerTextarea"
                fullWidth
                multiline
                rows={2}
                label="Disclaimer"
                value={get(measure, 'disclaimer', '')}
                onChange={(e) => handleChange('disclaimer', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="riskAdjustmentTextarea"
                fullWidth
                multiline
                rows={2}
                label="Risk Adjustment"
                value={get(measure, 'riskAdjustment', '')}
                onChange={(e) => handleChange('riskAdjustment', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="rationaleTextarea"
                fullWidth
                multiline
                rows={3}
                label="Rationale"
                value={get(measure, 'rationale', '')}
                onChange={(e) => handleChange('rationale', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <>
              <Button onClick={() => navigate('/measures')}>
                Back
              </Button>
              {(id && id !== 'new') && (
                <>
                  <Button onClick={handleDelete} color="error">
                    Delete
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => {
                if (id && id !== 'new') {
                  setIsEditing(false);
                } else {
                  navigate('/measures');
                }
              }}>
                Cancel
              </Button>
              <Button 
                id="saveMeasureButton"
                variant="contained" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default MeasureDetail;
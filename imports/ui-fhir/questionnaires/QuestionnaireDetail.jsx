// /imports/ui-fhir/questionnaires/QuestionnaireDetail.jsx

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
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Alert,
  Grid,
  Dialog
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import the collection directly - avoids timing issues
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';

function QuestionnaireDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to questionnaires data
  const subscriptionReady = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      return Meteor.subscribe('autopublish.Questionnaires', {}, {});
    } else {
      return Meteor.subscribe('questionnaires.all');
    }
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [questionnaire, setQuestionnaire] = useState({
    resourceType: "Questionnaire",
    title: "",
    name: "",
    publisher: "",
    status: "active",
    version: "1.0.0",
    description: "",
    purpose: "",
    approvalDate: "",
    lastReviewDate: "",
    effectivePeriod: {
      start: "",
      end: ""
    },
    subjectType: ["Patient"],
    code: [{
      system: "http://loinc.org",
      code: "",
      display: ""
    }],
    contact: [],
    copyright: "",
    date: moment().format('YYYY-MM-DD'),
    experimental: false,
    item: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Set initial state on component mount
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new questionnaires
      setIsEditing(true);
      
      // Set publisher to current user's organization or name
      let publisherName = '';
      
      if (currentUser) {
        publisherName = get(currentUser, 'profile.organization', '') ||
                       get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
      }
      
      setQuestionnaire(prev => ({
        ...prev,
        publisher: publisherName
      }));
    } else {
      // Viewing existing questionnaire - start in read-only mode
      setIsEditing(false);
    }
  }, [id, currentUser]);

  // Load questionnaire if editing
  useEffect(function() {
    async function loadQuestionnaire() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          console.log('QuestionnaireDetail: Loading questionnaire with ID:', id);
          const result = await Meteor.callAsync('questionnaires.get', id);
          if (result) {
            console.log('QuestionnaireDetail: Loaded questionnaire:', result);
            setQuestionnaire(result);
            
            // Extract notes if present in the questionnaire
            if (result.extension) {
              const notesExtension = result.extension.find(ext => ext.url === 'http://example.org/fhir/StructureDefinition/questionnaire-notes');
              if (notesExtension && notesExtension.valueString) {
                setNotes(notesExtension.valueString);
              }
            }
            
            setError(null); // Clear any previous errors
          }
        } catch (err) {
          console.error('QuestionnaireDetail: Error loading questionnaire:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadQuestionnaire();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    setQuestionnaire(prevQuestionnaire => {
      const updatedQuestionnaire = JSON.parse(JSON.stringify(prevQuestionnaire)); // Deep clone
      set(updatedQuestionnaire, path, value);
      console.log('Updated questionnaire:', updatedQuestionnaire);
      return updatedQuestionnaire;
    });
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      // Add notes as an extension if present
      let questionnaireToSave = { ...questionnaire };
      if (notes && notes.trim()) {
        if (!questionnaireToSave.extension) {
          questionnaireToSave.extension = [];
        }
        // Remove any existing notes extension
        questionnaireToSave.extension = questionnaireToSave.extension.filter(ext => ext.url !== 'http://example.org/fhir/StructureDefinition/questionnaire-notes');
        // Add the new notes extension
        questionnaireToSave.extension.push({
          url: 'http://example.org/fhir/StructureDefinition/questionnaire-notes',
          valueString: notes.trim()
        });
      }
      
      if (id && id !== 'new') {
        // Update existing questionnaire
        await Meteor.callAsync('questionnaires.update', id, questionnaireToSave);
      } else {
        // Create new questionnaire
        const newId = await Meteor.callAsync('questionnaires.create', questionnaireToSave);
        if (newId) {
          // Navigate to the questionnaires list after successful creation
          navigate('/questionnaires');
          return;
        }
      }
      
      // For updates, just disable editing mode
      setIsEditing(false);
      navigate('/questionnaires');
    } catch (err) {
      console.error('Error saving questionnaire:', err);
      setError(err.error || err.message || 'Failed to save questionnaire');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('questionnaires.remove', id);
        navigate('/questionnaires');
      } catch (err) {
        console.error('Error deleting questionnaire:', err);
        setError(err.error || err.message || 'Failed to delete questionnaire');
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (id && id !== 'new') {
      setIsEditing(false);
      // Reload the original data
      loadQuestionnaire();
    } else {
      navigate('/questionnaires');
    }
  }

  // Toggle edit mode
  function toggleEditMode() {
    setIsEditing(!isEditing);
  }

  // Status options for the select dropdown
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'retired', label: 'Retired' },
    { value: 'unknown', label: 'Unknown' }
  ];

  return (
    <Container id="questionnaireDetailPage" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardHeader
          title={id === 'new' ? 'New Questionnaire' : 'Questionnaire Details'}
          action={
            id !== 'new' && (
              <Tooltip title={isEditing ? "View mode" : "Edit mode"}>
                <IconButton onClick={toggleEditMode} color="primary">
                  {isEditing ? <LockOpenIcon /> : <LockIcon />}
                </IconButton>
              </Tooltip>
            )
          }
        />
        
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                id="title"
                fullWidth
                label="Title"
                value={get(questionnaire, 'title', '')}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={!isEditing}
                helperText="Human-readable name for this questionnaire"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="name"
                fullWidth
                label="Computer Name"
                value={get(questionnaire, 'name', '')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
                helperText="Computer-friendly name (no spaces)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="version"
                fullWidth
                label="Version"
                value={get(questionnaire, 'version', '')}
                onChange={(e) => handleChange('version', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="publisher"
                fullWidth
                label="Publisher"
                value={get(questionnaire, 'publisher', '')}
                onChange={(e) => handleChange('publisher', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  id="status"
                  labelId="status-label"
                  value={get(questionnaire, 'status', 'active')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="description"
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={get(questionnaire, 'description', '')}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!isEditing}
                helperText="Natural language description of the questionnaire"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="purpose"
                fullWidth
                multiline
                rows={2}
                label="Purpose"
                value={get(questionnaire, 'purpose', '')}
                onChange={(e) => handleChange('purpose', e.target.value)}
                disabled={!isEditing}
                helperText="Why this questionnaire is defined"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                id="approvalDate"
                fullWidth
                label="Approval Date"
                type="date"
                value={get(questionnaire, 'approvalDate', '')}
                onChange={(e) => handleChange('approvalDate', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                id="lastReviewDate"
                fullWidth
                label="Last Review Date"
                type="date"
                value={get(questionnaire, 'lastReviewDate', '')}
                onChange={(e) => handleChange('lastReviewDate', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                id="subjectType"
                fullWidth
                label="Subject Type"
                value={get(questionnaire, 'subjectType[0]', 'Patient')}
                onChange={(e) => handleChange('subjectType[0]', e.target.value)}
                disabled={!isEditing}
                helperText="Resource type that can answer this questionnaire"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="effectivePeriodStart"
                fullWidth
                label="Effective Period Start"
                type="date"
                value={get(questionnaire, 'effectivePeriod.start', '')}
                onChange={(e) => handleChange('effectivePeriod.start', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="effectivePeriodEnd"
                fullWidth
                label="Effective Period End"
                type="date"
                value={get(questionnaire, 'effectivePeriod.end', '')}
                onChange={(e) => handleChange('effectivePeriod.end', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="codeCode"
                fullWidth
                label="Code"
                value={get(questionnaire, 'code[0].code', '')}
                onChange={(e) => handleChange('code[0].code', e.target.value)}
                disabled={!isEditing}
                helperText="LOINC or other coding system code"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="codeDisplay"
                fullWidth
                label="Code Display"
                value={get(questionnaire, 'code[0].display', '')}
                onChange={(e) => handleChange('code[0].display', e.target.value)}
                disabled={!isEditing}
                helperText="Human-readable meaning of the code"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isEditing}
                helperText="Additional notes or comments about this questionnaire"
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box>
            {id !== 'new' && isEditing && (
              <Button
                color="error"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
          </Box>
          
          <Box>
            {isEditing && (
              <>
                <Button
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  id="saveQuestionnaireButton"
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                >
                  Save
                </Button>
              </>
            )}
          </Box>
        </CardActions>
      </Card>
    </Container>
  );
}

export default QuestionnaireDetail;
// /imports/ui-fhir/planDefinitions/PlanDefinitionDetail.jsx

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
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function PlanDefinitionDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user from session
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to PlanDefinitions
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if(autoPublishEnabled){
      handle = Meteor.subscribe('autopublish.PlanDefinitions', {}, {});
    } else {
      handle = Meteor.subscribe('plandefinitions.all');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [planDefinition, setPlanDefinition] = useState({
    resourceType: "PlanDefinition",
    url: "",
    version: "",
    name: "",
    title: "",
    type: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/plan-definition-type",
        code: "",
        display: ""
      }]
    },
    status: "draft",
    date: "",
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
    topic: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/definition-topic",
        code: "",
        display: ""
      }]
    }],
    author: [{
      name: ""
    }],
    editor: [{
      name: ""
    }],
    reviewer: [{
      name: ""
    }],
    endorser: [{
      name: ""
    }],
    relatedArtifact: [{
      type: "documentation",
      display: "",
      url: ""
    }],
    goal: [{
      category: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/goal-category",
          code: "",
          display: ""
        }]
      },
      description: {
        text: ""
      },
      priority: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/goal-priority",
          code: "",
          display: ""
        }]
      }
    }],
    action: [{
      title: "",
      description: "",
      priority: "routine"
    }],
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set default values on component mount for new plan definitions
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new plan definitions
      setIsEditing(true);
    } else {
      // Viewing existing plan definition - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load plan definition if editing
  useEffect(function() {
    if (id && id !== 'new' && isSubscriptionReady) {
      const existingPlanDefinition = PlanDefinitions.findOne({_id: id});
      if (existingPlanDefinition) {
        setPlanDefinition(existingPlanDefinition);
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    const updatedPlanDefinition = { ...planDefinition };
    set(updatedPlanDefinition, path, value);
    setPlanDefinition(updatedPlanDefinition);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing plan definition
        await Meteor.callAsync('updatePlanDefinition', id, planDefinition);
        console.log('Plan definition updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new plan definition
        console.log('Creating plan definition with data:', JSON.stringify(planDefinition, null, 2));
        const newId = await Meteor.callAsync('createPlanDefinition', planDefinition);
        console.log('Plan definition created with ID:', newId);
        // Navigate back to plan definitions list for new plan definitions
        navigate('/plan-definitions');
      }
    } catch (err) {
      console.error('Error saving plan definition:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this plan definition?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removePlanDefinition', id);
        console.log('Plan definition deleted successfully');
        navigate('/plan-definitions');
      } catch (err) {
        console.error('Error deleting plan definition:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Search for users (for various reference fields)
  function handleSearchUser(fieldPath) {
    console.log('Search for user - field:', fieldPath);
    // TODO: Implement user search dialog
  }

  return (
    <Container id="planDefinitionDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Plan Definition' : 'New Plan Definition'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {/* Display barcode for existing records */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Stack spacing={3}>
            {/* Basic Information Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Stack spacing={2}>
                <TextField
                  id="urlInput"
                  fullWidth
                  label="URL"
                  value={get(planDefinition, 'url', '')}
                  onChange={(e) => handleChange('url', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="versionInput"
                  fullWidth
                  label="Version"
                  value={get(planDefinition, 'version', '')}
                  onChange={(e) => handleChange('version', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="nameInput"
                  fullWidth
                  label="Name"
                  value={get(planDefinition, 'name', '')}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="titleInput"
                  fullWidth
                  label="Title"
                  value={get(planDefinition, 'title', '')}
                  onChange={(e) => handleChange('title', e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </Stack>
            </Box>

            {/* Type and Status Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Type and Status</Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="typeCoding-label">Type</InputLabel>
                  <Select
                    labelId="typeCoding-label"
                    id="typeCodingSelect"
                    value={get(planDefinition, 'type.coding[0].code', '')}
                    label="Type"
                    onChange={(e) => {
                      const code = e.target.value;
                      handleChange('type.coding[0].code', code);
                      // Map code to display
                      const typeMap = {
                        'eca-rule': 'ECA Rule',
                        'clinical-protocol': 'Clinical Protocol',
                        'order-set': 'Order Set',
                        'workflow-definition': 'Workflow Definition'
                      };
                      handleChange('type.coding[0].display', typeMap[code] || code);
                    }}
                    disabled={!isEditing}
                  >
                    <MenuItem value="eca-rule">ECA Rule</MenuItem>
                    <MenuItem value="clinical-protocol">Clinical Protocol</MenuItem>
                    <MenuItem value="order-set">Order Set</MenuItem>
                    <MenuItem value="workflow-definition">Workflow Definition</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  id="typeDisplayInput"
                  fullWidth
                  label="Type Display"
                  value={get(planDefinition, 'type.coding[0].display', '')}
                  onChange={(e) => handleChange('type.coding[0].display', e.target.value)}
                  disabled={!isEditing}
                />
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="statusSelect"
                    value={get(planDefinition, 'status', 'draft')}
                    label="Status"
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={!isEditing}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="retired">Retired</MenuItem>
                    <MenuItem value="unknown">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Publication Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Publication</Typography>
              <Stack spacing={2}>
                <TextField
                  id="dateInput"
                  fullWidth
                  label="Date"
                  type="date"
                  value={get(planDefinition, 'date', '')}
                  onChange={(e) => handleChange('date', e.target.value)}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  id="publisherInput"
                  fullWidth
                  label="Publisher"
                  value={get(planDefinition, 'publisher', '')}
                  onChange={(e) => handleChange('publisher', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="descriptionTextarea"
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={get(planDefinition, 'description', '')}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="purposeTextarea"
                  fullWidth
                  multiline
                  rows={3}
                  label="Purpose"
                  value={get(planDefinition, 'purpose', '')}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="usageTextarea"
                  fullWidth
                  multiline
                  rows={3}
                  label="Usage"
                  value={get(planDefinition, 'usage', '')}
                  onChange={(e) => handleChange('usage', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="copyrightTextarea"
                  fullWidth
                  multiline
                  rows={2}
                  label="Copyright"
                  value={get(planDefinition, 'copyright', '')}
                  onChange={(e) => handleChange('copyright', e.target.value)}
                  disabled={!isEditing}
                />
              </Stack>
            </Box>

            {/* Review Dates Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Review Information</Typography>
              <Stack spacing={2}>
                <TextField
                  id="approvalDateInput"
                  fullWidth
                  label="Approval Date"
                  type="date"
                  value={get(planDefinition, 'approvalDate', '')}
                  onChange={(e) => handleChange('approvalDate', e.target.value)}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  id="lastReviewDateInput"
                  fullWidth
                  label="Last Review Date"
                  type="date"
                  value={get(planDefinition, 'lastReviewDate', '')}
                  onChange={(e) => handleChange('lastReviewDate', e.target.value)}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  id="effectivePeriodStartInput"
                  fullWidth
                  label="Effective Period Start"
                  type="date"
                  value={get(planDefinition, 'effectivePeriod.start', '')}
                  onChange={(e) => handleChange('effectivePeriod.start', e.target.value)}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  id="effectivePeriodEndInput"
                  fullWidth
                  label="Effective Period End"
                  type="date"
                  value={get(planDefinition, 'effectivePeriod.end', '')}
                  onChange={(e) => handleChange('effectivePeriod.end', e.target.value)}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Box>

            {/* Topics Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Topics</Typography>
              <Stack spacing={2}>
                <TextField
                  id="topicCodeInput"
                  fullWidth
                  label="Topic Code"
                  value={get(planDefinition, 'topic[0].coding[0].code', '')}
                  onChange={(e) => handleChange('topic[0].coding[0].code', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="topicDisplayInput"
                  fullWidth
                  label="Topic Display"
                  value={get(planDefinition, 'topic[0].coding[0].display', '')}
                  onChange={(e) => handleChange('topic[0].coding[0].display', e.target.value)}
                  disabled={!isEditing}
                />
              </Stack>
            </Box>

            {/* Contributors Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Contributors</Typography>
              <Stack spacing={2}>
                <TextField
                  id="authorNameInput"
                  fullWidth
                  label="Author Name"
                  value={get(planDefinition, 'author[0].name', '')}
                  onChange={(e) => handleChange('author[0].name', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="editorNameInput"
                  fullWidth
                  label="Editor Name"
                  value={get(planDefinition, 'editor[0].name', '')}
                  onChange={(e) => handleChange('editor[0].name', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="reviewerNameInput"
                  fullWidth
                  label="Reviewer Name"
                  value={get(planDefinition, 'reviewer[0].name', '')}
                  onChange={(e) => handleChange('reviewer[0].name', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="endorserNameInput"
                  fullWidth
                  label="Endorser Name"
                  value={get(planDefinition, 'endorser[0].name', '')}
                  onChange={(e) => handleChange('endorser[0].name', e.target.value)}
                  disabled={!isEditing}
                />
              </Stack>
            </Box>

            {/* Related Artifacts Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Related Artifacts</Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="relatedArtifactType-label">Related Artifact Type</InputLabel>
                  <Select
                    labelId="relatedArtifactType-label"
                    id="relatedArtifactTypeSelect"
                    value={get(planDefinition, 'relatedArtifact[0].type', 'documentation')}
                    label="Related Artifact Type"
                    onChange={(e) => handleChange('relatedArtifact[0].type', e.target.value)}
                    disabled={!isEditing}
                  >
                    <MenuItem value="documentation">Documentation</MenuItem>
                    <MenuItem value="justification">Justification</MenuItem>
                    <MenuItem value="citation">Citation</MenuItem>
                    <MenuItem value="predecessor">Predecessor</MenuItem>
                    <MenuItem value="successor">Successor</MenuItem>
                    <MenuItem value="derived-from">Derived From</MenuItem>
                    <MenuItem value="depends-on">Depends On</MenuItem>
                    <MenuItem value="composed-of">Composed Of</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  id="relatedArtifactUrlInput"
                  fullWidth
                  label="Related Artifact URL"
                  value={get(planDefinition, 'relatedArtifact[0].url', '')}
                  onChange={(e) => handleChange('relatedArtifact[0].url', e.target.value)}
                  disabled={!isEditing}
                />
              </Stack>
            </Box>

            {/* Goals Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Goals</Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="goalCategory-label">Goal Category</InputLabel>
                  <Select
                    labelId="goalCategory-label"
                    id="goalCategorySelect"
                    value={get(planDefinition, 'goal[0].category.coding[0].code', '')}
                    label="Goal Category"
                    onChange={(e) => {
                      const code = e.target.value;
                      handleChange('goal[0].category.coding[0].code', code);
                      // Map code to display
                      const categoryMap = {
                        'dietary': 'Dietary',
                        'safety': 'Safety',
                        'behavioral': 'Behavioral',
                        'nursing': 'Nursing',
                        'physiotherapy': 'Physiotherapy'
                      };
                      handleChange('goal[0].category.coding[0].display', categoryMap[code] || code);
                    }}
                    disabled={!isEditing}
                  >
                    <MenuItem value="dietary">Dietary</MenuItem>
                    <MenuItem value="safety">Safety</MenuItem>
                    <MenuItem value="behavioral">Behavioral</MenuItem>
                    <MenuItem value="nursing">Nursing</MenuItem>
                    <MenuItem value="physiotherapy">Physiotherapy</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  id="goalDescriptionInput"
                  fullWidth
                  label="Goal Description"
                  value={get(planDefinition, 'goal[0].description.text', '')}
                  onChange={(e) => handleChange('goal[0].description.text', e.target.value)}
                  disabled={!isEditing}
                />
                <FormControl fullWidth>
                  <InputLabel id="goalPriority-label">Goal Priority</InputLabel>
                  <Select
                    labelId="goalPriority-label"
                    id="goalPrioritySelect"
                    value={get(planDefinition, 'goal[0].priority.coding[0].code', '')}
                    label="Goal Priority"
                    onChange={(e) => {
                      const code = e.target.value;
                      handleChange('goal[0].priority.coding[0].code', code);
                      // Map code to display
                      const priorityMap = {
                        'high-priority': 'High Priority',
                        'medium-priority': 'Medium Priority',
                        'low-priority': 'Low Priority'
                      };
                      handleChange('goal[0].priority.coding[0].display', priorityMap[code] || code);
                    }}
                    disabled={!isEditing}
                  >
                    <MenuItem value="high-priority">High Priority</MenuItem>
                    <MenuItem value="medium-priority">Medium Priority</MenuItem>
                    <MenuItem value="low-priority">Low Priority</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Actions Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Actions</Typography>
              <Stack spacing={2}>
                <TextField
                  id="actionTitleInput"
                  fullWidth
                  label="Action Title"
                  value={get(planDefinition, 'action[0].title', '')}
                  onChange={(e) => handleChange('action[0].title', e.target.value)}
                  disabled={!isEditing}
                />
                <TextField
                  id="actionDescriptionInput"
                  fullWidth
                  label="Action Description"
                  value={get(planDefinition, 'action[0].description', '')}
                  onChange={(e) => handleChange('action[0].description', e.target.value)}
                  disabled={!isEditing}
                />
                <FormControl fullWidth>
                  <InputLabel id="actionPriority-label">Action Priority</InputLabel>
                  <Select
                    labelId="actionPriority-label"
                    id="actionPrioritySelect"
                    value={get(planDefinition, 'action[0].priority', 'routine')}
                    label="Action Priority"
                    onChange={(e) => handleChange('action[0].priority', e.target.value)}
                    disabled={!isEditing}
                  >
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="asap">ASAP</MenuItem>
                    <MenuItem value="stat">STAT</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Notes Section */}
            <Box>
              <Typography variant="h6" gutterBottom>Notes</Typography>
              <TextField
                id="notesTextarea"
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={get(planDefinition, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Box>
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <>
              <Button 
                onClick={() => navigate('/plan-definitions')}
                variant="outlined"
              >
                Back
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDelete}
                  variant="outlined"
                  color="error"
                >
                  Delete
                </Button>
              )}
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => {
                  if (id && id !== 'new') {
                    // Cancel edit mode and reload
                    setIsEditing(false);
                    const existingPlanDefinition = PlanDefinitions.findOne({_id: id});
                    if (existingPlanDefinition) {
                      setPlanDefinition(existingPlanDefinition);
                    }
                  } else {
                    // Cancel new plan definition
                    navigate('/plan-definitions');
                  }
                }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                id="savePlanDefinitionButton"
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (id ? 'Update' : 'Save')} Plan Definition
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default PlanDefinitionDetail;
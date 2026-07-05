// imports/ui-fhir/planDefinitions/PlanDefinitionFormView.jsx

import React, { useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GroupIcon from '@mui/icons-material/Group';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SecurityIcon from '@mui/icons-material/Security';

import { get, set } from 'lodash';

// Theme-aware styling
var sectionStyle = function(theme) {
  return {
    mb: 3,
    '& .MuiAccordion-root': {
      backgroundColor: theme.palette.mode === 'dark'
        ? theme.palette.grey[900]
        : theme.palette.grey[50],
      '&:before': {
        display: 'none',
      },
      boxShadow: theme.palette.mode === 'dark'
        ? '0 2px 4px rgba(0,0,0,0.3)'
        : '0 2px 4px rgba(0,0,0,0.1)',
    }
  };
};

var arrayItemStyle = function(theme) {
  return {
    p: 2,
    mb: 1,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 1,
    border: '1px solid ' + theme.palette.divider,
    position: 'relative',
    '&:hover': {
      boxShadow: theme.shadows[2],
    }
  };
};

function PlanDefinitionFormView({ resource, isEditing, onChange, isEmbedded }) {
  var [activeTab, setActiveTab] = useState(0);
  var [expandedAccordions, setExpandedAccordions] = useState({});

  function handleAccordionChange(panel) {
    return function(event, isExpanded) {
      setExpandedAccordions(function(prev) {
        return { ...prev, [panel]: isExpanded };
      });
    };
  }

  function addArrayItem(path, defaultItem) {
    var currentArray = get(resource, path, []);
    var updatedArray = [...currentArray, defaultItem];
    onChange(path, updatedArray);
  }

  function removeArrayItem(path, index) {
    var currentArray = get(resource, path, []);
    var updatedArray = [...currentArray];
    updatedArray.splice(index, 1);
    onChange(path, updatedArray);
  }

  function updateArrayItem(path, index, value) {
    var currentArray = get(resource, path, []);
    var updatedArray = [...currentArray];
    updatedArray[index] = value;
    onChange(path, updatedArray);
  }

  function renderIdentifiers() {
    var identifiers = get(resource, 'identifier', []);
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">Identifiers</Typography>
          <IconButton
            size="small"
            onClick={function() { addArrayItem('identifier', { system: '', value: '', use: 'official' }); }}
            disabled={!isEditing}
            aria-label="Add"
          >
            <AddIcon />
          </IconButton>
        </Box>
        {identifiers.map(function(identifier, index) {
          return (
            <Paper key={index} sx={arrayItemStyle} elevation={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="System"
                    value={identifier.system || ''}
                    onChange={function(e) { updateArrayItem('identifier', index, { ...identifier, system: e.target.value }); }}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={identifier.value || ''}
                    onChange={function(e) { updateArrayItem('identifier', index, { ...identifier, value: e.target.value }); }}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Use</InputLabel>
                    <Select
                      value={identifier.use || 'official'}
                      onChange={function(e) { updateArrayItem('identifier', index, { ...identifier, use: e.target.value }); }}
                      disabled={!isEditing}
                    >
                      <MenuItem value="usual">Usual</MenuItem>
                      <MenuItem value="official">Official</MenuItem>
                      <MenuItem value="temp">Temporary</MenuItem>
                      <MenuItem value="secondary">Secondary</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton
                    size="small"
                    onClick={function() { removeArrayItem('identifier', index); }}
                    disabled={!isEditing}
                    color="error"
                    aria-label="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          );
        })}
      </Box>
    );
  }

  function renderGoals() {
    var goals = get(resource, 'goal', []);
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GpsFixedIcon color="primary" />
            Clinical Goals
          </Typography>
          <IconButton
            size="small"
            onClick={function() {
              addArrayItem('goal', {
                id: 'goal-' + Date.now(),
                category: { coding: [{ system: '', code: '', display: '' }] },
                description: { text: '' },
                priority: { coding: [{ system: '', code: 'medium-priority', display: 'Medium Priority' }] },
                start: { text: '' },
                addresses: [],
                documentation: [],
                target: []
              });
            }}
            disabled={!isEditing}
            color="primary"
            aria-label="Add"
          >
            <AddIcon />
          </IconButton>
        </Box>
        {goals.map(function(goal, index) {
          return (
            <Accordion
              key={index}
              expanded={expandedAccordions['goal-' + index] || false}
              onChange={handleAccordionChange('goal-' + index)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip label={'Goal ' + (index + 1)} color="primary" size="small" />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {get(goal, 'description.text', 'No description')}
                  </Typography>
                  {get(goal, 'priority.coding[0].code') && (
                    <Chip
                      label={get(goal, 'priority.coding[0].display', get(goal, 'priority.coding[0].code'))}
                      size="small"
                      color={
                        get(goal, 'priority.coding[0].code') === 'high-priority' ? 'error' :
                        get(goal, 'priority.coding[0].code') === 'medium-priority' ? 'warning' : 'default'
                      }
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Goal ID"
                    value={goal.id || ''}
                    onChange={function(e) {
                      var updated = { ...goal, id: e.target.value };
                      updateArrayItem('goal', index, updated);
                    }}
                    disabled={!isEditing}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={get(goal, 'description.text', '')}
                    onChange={function(e) {
                      var updated = { ...goal };
                      set(updated, 'description.text', e.target.value);
                      updateArrayItem('goal', index, updated);
                    }}
                    disabled={!isEditing}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={get(goal, 'category.coding[0].code', '')}
                          onChange={function(e) {
                            var updated = { ...goal };
                            set(updated, 'category.coding[0].code', e.target.value);
                            var categoryMap = {
                              'dietary': 'Dietary',
                              'safety': 'Safety',
                              'behavioral': 'Behavioral',
                              'nursing': 'Nursing',
                              'physiotherapy': 'Physiotherapy'
                            };
                            set(updated, 'category.coding[0].display', categoryMap[e.target.value] || e.target.value);
                            updateArrayItem('goal', index, updated);
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
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={get(goal, 'priority.coding[0].code', 'medium-priority')}
                          onChange={function(e) {
                            var updated = { ...goal };
                            set(updated, 'priority.coding[0].code', e.target.value);
                            var priorityMap = {
                              'high-priority': 'High Priority',
                              'medium-priority': 'Medium Priority',
                              'low-priority': 'Low Priority'
                            };
                            set(updated, 'priority.coding[0].display', priorityMap[e.target.value] || e.target.value);
                            updateArrayItem('goal', index, updated);
                          }}
                          disabled={!isEditing}
                        >
                          <MenuItem value="high-priority">High Priority</MenuItem>
                          <MenuItem value="medium-priority">Medium Priority</MenuItem>
                          <MenuItem value="low-priority">Low Priority</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <TextField
                    fullWidth
                    label="Start Condition"
                    value={get(goal, 'start.text', '')}
                    onChange={function(e) {
                      var updated = { ...goal };
                      set(updated, 'start.text', e.target.value);
                      updateArrayItem('goal', index, updated);
                    }}
                    disabled={!isEditing}
                    placeholder="e.g., Within 24 hours of admission"
                  />
                  {isEditing && (
                    <Box display="flex" justifyContent="flex-end">
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={function() { removeArrayItem('goal', index); }}
                        color="error"
                        size="small"
                      >
                        Remove Goal
                      </Button>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  }

  function renderActions() {
    var actions = get(resource, 'action', []);
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Protocol Actions
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={function() {
              addArrayItem('action', {
                id: 'action-' + Date.now(),
                title: '',
                description: '',
                priority: 'routine'
              });
            }}
            disabled={!isEditing}
            variant="contained"
            size="small"
          >
            Add Action
          </Button>
        </Box>

        {actions.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
            <Typography color="text.secondary">
              No actions defined. Click "Add Action" to create protocol steps.
            </Typography>
          </Paper>
        ) : (
          actions.map(function(action, index) {
            return (
              <Paper key={index} sx={{ p: 2, mb: 1 }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Action Title"
                    value={action.title || ''}
                    onChange={function(e) { updateArrayItem('action', index, { ...action, title: e.target.value }); }}
                    disabled={!isEditing}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={action.description || ''}
                    onChange={function(e) { updateArrayItem('action', index, { ...action, description: e.target.value }); }}
                    disabled={!isEditing}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={action.priority || 'routine'}
                      onChange={function(e) { updateArrayItem('action', index, { ...action, priority: e.target.value }); }}
                      disabled={!isEditing}
                    >
                      <MenuItem value="routine">Routine</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="asap">ASAP</MenuItem>
                      <MenuItem value="stat">STAT</MenuItem>
                    </Select>
                  </FormControl>
                  {isEditing && (
                    <Box display="flex" justifyContent="flex-end">
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={function() { removeArrayItem('action', index); }}
                        color="error"
                        size="small"
                      >
                        Remove Action
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Paper>
            );
          })
        )}
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Tabs value={activeTab} onChange={function(e, v) { setActiveTab(v); }} sx={{ mb: 1 }}>
        <Tab icon={<InfoIcon />} label="Basic Info" />
        <Tab icon={<GpsFixedIcon />} label="Goals & Actions" />
        <Tab icon={<GroupIcon />} label="Contributors" />
        <Tab icon={<LibraryBooksIcon />} label="Resources" />
        <Tab icon={<SecurityIcon />} label="Governance" />
      </Tabs>

      {/* Tab 0: Basic Information */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <Accordion
            expanded={expandedAccordions['identifiers'] !== false}
            onChange={handleAccordionChange('identifiers')}
            sx={sectionStyle}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Identifiers & Metadata</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                {renderIdentifiers()}
                <Divider />
                <TextField
                  id="urlInput"
                  fullWidth
                  label="Canonical URL"
                  value={get(resource, 'url', '')}
                  onChange={function(e) { onChange('url', e.target.value); }}
                  disabled={!isEditing}
                  helperText="Canonical identifier for this plan definition"
                />
                <Box display="flex" gap={2}>
                  <TextField
                    id="versionInput"
                    sx={{ flex: 1 }}
                    label="Version"
                    value={get(resource, 'version', '')}
                    onChange={function(e) { onChange('version', e.target.value); }}
                    disabled={!isEditing}
                    helperText="Business version"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={get(resource, 'experimental', false)}
                        onChange={function(e) { onChange('experimental', e.target.checked); }}
                        disabled={!isEditing}
                      />
                    }
                    label="Experimental"
                  />
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            defaultExpanded
            expanded={expandedAccordions['basic'] !== false}
            onChange={handleAccordionChange('basic')}
            sx={sectionStyle}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Basic Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField
                  id="nameInput"
                  fullWidth
                  label="Name (Computer Friendly)"
                  value={get(resource, 'name', '')}
                  onChange={function(e) { onChange('name', e.target.value); }}
                  disabled={!isEditing}
                  required
                  helperText="Computer-friendly name (no spaces)"
                />
                <TextField
                  id="titleInput"
                  fullWidth
                  label="Title (Human Friendly)"
                  value={get(resource, 'title', '')}
                  onChange={function(e) { onChange('title', e.target.value); }}
                  disabled={!isEditing}
                  required
                  helperText="Human-readable title"
                />
                <TextField
                  fullWidth
                  label="Subtitle"
                  value={get(resource, 'subtitle', '')}
                  onChange={function(e) { onChange('subtitle', e.target.value); }}
                  disabled={!isEditing}
                  helperText="Subordinate title"
                />
                <Box display="flex" gap={2}>
                  <FormControl sx={{ flex: 1 }} required>
                    <InputLabel>Type</InputLabel>
                    <Select
                      id="typeSelect"
                      value={get(resource, 'type.coding[0].code', 'clinical-protocol')}
                      onChange={function(e) {
                        var typeMap = {
                          'eca-rule': 'ECA Rule',
                          'clinical-protocol': 'Clinical Protocol',
                          'order-set': 'Order Set',
                          'workflow-definition': 'Workflow Definition'
                        };
                        onChange('type.coding[0].code', e.target.value);
                        onChange('type.coding[0].display', typeMap[e.target.value]);
                      }}
                      disabled={!isEditing}
                    >
                      <MenuItem value="clinical-protocol">Clinical Protocol</MenuItem>
                      <MenuItem value="eca-rule">ECA Rule</MenuItem>
                      <MenuItem value="order-set">Order Set</MenuItem>
                      <MenuItem value="workflow-definition">Workflow Definition</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ flex: 1 }} required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      id="statusSelect"
                      value={get(resource, 'status', 'draft')}
                      onChange={function(e) { onChange('status', e.target.value); }}
                      disabled={!isEditing}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="retired">Retired</MenuItem>
                      <MenuItem value="unknown">Unknown</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TextField
                  id="descriptionTextarea"
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={get(resource, 'description', '')}
                  onChange={function(e) { onChange('description', e.target.value); }}
                  disabled={!isEditing}
                  helperText="Natural language description"
                />
                <TextField
                  id="purposeTextarea"
                  fullWidth
                  multiline
                  rows={3}
                  label="Purpose"
                  value={get(resource, 'purpose', '')}
                  onChange={function(e) { onChange('purpose', e.target.value); }}
                  disabled={!isEditing}
                  helperText="Why this plan definition is defined"
                />
                <TextField
                  id="usageTextarea"
                  fullWidth
                  multiline
                  rows={3}
                  label="Usage"
                  value={get(resource, 'usage', '')}
                  onChange={function(e) { onChange('usage', e.target.value); }}
                  disabled={!isEditing}
                  helperText="Describes clinical usage"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedAccordions['dates'] !== false}
            onChange={handleAccordionChange('dates')}
            sx={sectionStyle}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Important Dates</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    id="dateInput"
                    fullWidth
                    label="Publication Date"
                    type="date"
                    value={get(resource, 'date', '')}
                    onChange={function(e) { onChange('date', e.target.value); }}
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
                    value={get(resource, 'approvalDate', '')}
                    onChange={function(e) { onChange('approvalDate', e.target.value); }}
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
                    value={get(resource, 'lastReviewDate', '')}
                    onChange={function(e) { onChange('lastReviewDate', e.target.value); }}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Next Review Date"
                    type="date"
                    value={get(resource, 'nextReviewDate', '')}
                    onChange={function(e) { onChange('nextReviewDate', e.target.value); }}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                    helperText="When next review is expected"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Effective Period</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    id="effectivePeriodStartInput"
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={get(resource, 'effectivePeriod.start', '')}
                    onChange={function(e) { onChange('effectivePeriod.start', e.target.value); }}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    id="effectivePeriodEndInput"
                    fullWidth
                    label="End Date"
                    type="date"
                    value={get(resource, 'effectivePeriod.end', '')}
                    onChange={function(e) { onChange('effectivePeriod.end', e.target.value); }}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Stack>
      )}

      {/* Tab 1: Goals & Actions */}
      {activeTab === 1 && (
        <Stack spacing={3}>
          {renderGoals()}
          <Divider />
          {renderActions()}
        </Stack>
      )}

      {/* Tab 2: Contributors */}
      {activeTab === 2 && (
        <Stack spacing={3}>
          <TextField
            id="publisherInput"
            fullWidth
            label="Publisher"
            value={get(resource, 'publisher', '')}
            onChange={function(e) { onChange('publisher', e.target.value); }}
            disabled={!isEditing}
          />

          <Box>
            <Typography variant="h6" gutterBottom>Authors</Typography>
            {get(resource, 'author', []).map(function(author, index) {
              return (
                <Paper key={index} sx={arrayItemStyle}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={author.name || ''}
                        onChange={function(e) {
                          var authors = [...get(resource, 'author', [])];
                          authors[index] = { ...author, name: e.target.value };
                          onChange('author', authors);
                        }}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={get(author, 'telecom[0].value', '')}
                        onChange={function(e) {
                          var authors = [...get(resource, 'author', [])];
                          set(authors[index], 'telecom[0]', { system: 'email', value: e.target.value });
                          onChange('author', authors);
                        }}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      {isEditing && (
                        <IconButton onClick={function() { removeArrayItem('author', index); }} color="error" aria-label="Delete">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
            {isEditing && (
              <Button
                startIcon={<AddIcon />}
                onClick={function() { addArrayItem('author', { name: '', telecom: [{ system: 'email', value: '' }] }); }}
              >
                Add Author
              </Button>
            )}
          </Box>
        </Stack>
      )}

      {/* Tab 3: Resources */}
      {activeTab === 3 && (
        <Stack spacing={3}>
          <Typography variant="h6">Related Artifacts</Typography>
          <Typography variant="h6">Libraries</Typography>
          <Typography variant="h6">Topics</Typography>
        </Stack>
      )}

      {/* Tab 4: Governance */}
      {activeTab === 4 && (
        <Stack spacing={3}>
          <TextField
            id="copyrightTextarea"
            fullWidth
            multiline
            rows={3}
            label="Copyright"
            value={get(resource, 'copyright', '')}
            onChange={function(e) { onChange('copyright', e.target.value); }}
            disabled={!isEditing}
          />
          <Typography variant="h6">Use Context</Typography>
          <Typography variant="h6">Jurisdiction</Typography>
        </Stack>
      )}
    </Stack>
  );
}

export default PlanDefinitionFormView;

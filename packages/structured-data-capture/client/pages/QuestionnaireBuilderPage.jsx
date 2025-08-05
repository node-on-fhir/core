// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/pages/QuestionnaireBuilderPage.jsx

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  ContentCopy as DuplicateIcon
} from '@mui/icons-material';
import { Random } from 'meteor/random';
import { QuestionnaireForm } from '../components/QuestionnaireForm';

const questionTypes = [
  { value: 'string', label: 'Short Text' },
  { value: 'text', label: 'Long Text' },
  { value: 'integer', label: 'Number (Integer)' },
  { value: 'decimal', label: 'Number (Decimal)' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'date', label: 'Date' },
  { value: 'dateTime', label: 'Date & Time' },
  { value: 'time', label: 'Time' },
  { value: 'choice', label: 'Multiple Choice' },
  { value: 'open-choice', label: 'Multiple Choice with Other' },
  { value: 'attachment', label: 'File Upload' },
  { value: 'group', label: 'Section/Group' },
  { value: 'display', label: 'Display Text' }
];

export function QuestionnaireBuilderPage() {
  const [questionnaire, setQuestionnaire] = useState({
    resourceType: 'Questionnaire',
    id: Random.id(),
    status: 'draft',
    title: 'New Questionnaire',
    description: '',
    item: []
  });

  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const addItem = function(parentIndex = null) {
    const newItem = {
      linkId: Random.id(),
      type: 'string',
      text: 'New Question',
      required: false
    };

    const newQuestionnaire = { ...questionnaire };
    
    if (parentIndex !== null) {
      // Add as sub-item
      if (!newQuestionnaire.item[parentIndex].item) {
        newQuestionnaire.item[parentIndex].item = [];
      }
      newQuestionnaire.item[parentIndex].item.push(newItem);
    } else {
      // Add to root
      newQuestionnaire.item.push(newItem);
    }
    
    setQuestionnaire(newQuestionnaire);
  };

  const updateItem = function(index, updates) {
    const newQuestionnaire = { ...questionnaire };
    newQuestionnaire.item[index] = { ...newQuestionnaire.item[index], ...updates };
    
    // Handle answer options for choice types
    if (updates.type === 'choice' || updates.type === 'open-choice') {
      if (!newQuestionnaire.item[index].answerOption) {
        newQuestionnaire.item[index].answerOption = [
          { valueCoding: { code: 'option1', display: 'Option 1' } }
        ];
      }
    } else {
      delete newQuestionnaire.item[index].answerOption;
    }
    
    setQuestionnaire(newQuestionnaire);
  };

  const deleteItem = function(index) {
    const newQuestionnaire = { ...questionnaire };
    newQuestionnaire.item.splice(index, 1);
    setQuestionnaire(newQuestionnaire);
    setSelectedItemIndex(null);
  };

  const moveItem = function(index, direction) {
    const newQuestionnaire = { ...questionnaire };
    const items = newQuestionnaire.item;
    
    if (direction === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }
    
    setQuestionnaire(newQuestionnaire);
  };

  const duplicateItem = function(index) {
    const newQuestionnaire = { ...questionnaire };
    const itemToDuplicate = { ...newQuestionnaire.item[index] };
    itemToDuplicate.linkId = Random.id();
    itemToDuplicate.text = itemToDuplicate.text + ' (Copy)';
    newQuestionnaire.item.splice(index + 1, 0, itemToDuplicate);
    setQuestionnaire(newQuestionnaire);
  };

  const addAnswerOption = function(itemIndex) {
    const newQuestionnaire = { ...questionnaire };
    if (!newQuestionnaire.item[itemIndex].answerOption) {
      newQuestionnaire.item[itemIndex].answerOption = [];
    }
    newQuestionnaire.item[itemIndex].answerOption.push({
      valueCoding: { 
        code: `option${newQuestionnaire.item[itemIndex].answerOption.length + 1}`, 
        display: `Option ${newQuestionnaire.item[itemIndex].answerOption.length + 1}` 
      }
    });
    setQuestionnaire(newQuestionnaire);
  };

  const updateAnswerOption = function(itemIndex, optionIndex, display) {
    const newQuestionnaire = { ...questionnaire };
    newQuestionnaire.item[itemIndex].answerOption[optionIndex].valueCoding.display = display;
    newQuestionnaire.item[itemIndex].answerOption[optionIndex].valueCoding.code = display.toLowerCase().replace(/\s+/g, '-');
    setQuestionnaire(newQuestionnaire);
  };

  const deleteAnswerOption = function(itemIndex, optionIndex) {
    const newQuestionnaire = { ...questionnaire };
    newQuestionnaire.item[itemIndex].answerOption.splice(optionIndex, 1);
    setQuestionnaire(newQuestionnaire);
  };

  const saveQuestionnaire = function() {
    console.log('Saving questionnaire:', questionnaire);
    // Here you would call a Meteor method to save
    alert('Questionnaire saved! (Check console for JSON)');
  };

  if (previewMode) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setPreviewMode(false)}
          >
            Back to Editor
          </Button>
        </Box>
        <QuestionnaireForm
          questionnaire={questionnaire}
          onSubmit={(response) => {
            console.log('Preview response:', response);
            alert('This is just a preview - responses are not saved');
          }}
          showProgress={true}
          showSidebar={false}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Questionnaire Builder
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Questionnaire Properties */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Questionnaire Properties
            </Typography>
            
            <TextField
              fullWidth
              label="Title"
              value={questionnaire.title}
              onChange={(e) => setQuestionnaire({ ...questionnaire, title: e.target.value })}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Description"
              value={questionnaire.description}
              onChange={(e) => setQuestionnaire({ ...questionnaire, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={questionnaire.status}
                onChange={(e) => setQuestionnaire({ ...questionnaire, status: e.target.value })}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="retired">Retired</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveQuestionnaire}
                fullWidth
              >
                Save
              </Button>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => setPreviewMode(true)}
                fullWidth
              >
                Preview
              </Button>
            </Box>
          </Paper>

          {/* Selected Item Properties */}
          {selectedItemIndex !== null && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Question Properties
              </Typography>
              
              <TextField
                fullWidth
                label="Question Text"
                value={questionnaire.item[selectedItemIndex].text}
                onChange={(e) => updateItem(selectedItemIndex, { text: e.target.value })}
                margin="normal"
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select
                  value={questionnaire.item[selectedItemIndex].type}
                  onChange={(e) => updateItem(selectedItemIndex, { type: e.target.value })}
                >
                  {questionTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={questionnaire.item[selectedItemIndex].required || false}
                    onChange={(e) => updateItem(selectedItemIndex, { required: e.target.checked })}
                  />
                }
                label="Required"
              />

              {/* Answer Options for Choice Types */}
              {(questionnaire.item[selectedItemIndex].type === 'choice' || 
                questionnaire.item[selectedItemIndex].type === 'open-choice') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Answer Options
                  </Typography>
                  <List dense>
                    {questionnaire.item[selectedItemIndex].answerOption?.map((option, optIndex) => (
                      <ListItem key={optIndex}>
                        <TextField
                          size="small"
                          value={option.valueCoding.display}
                          onChange={(e) => updateAnswerOption(selectedItemIndex, optIndex, e.target.value)}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            size="small"
                            onClick={() => deleteAnswerOption(selectedItemIndex, optIndex)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addAnswerOption(selectedItemIndex)}
                  >
                    Add Option
                  </Button>
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        {/* Right Panel - Question List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Questions ({questionnaire.item.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => addItem()}
              >
                Add Question
              </Button>
            </Box>

            <List>
              {questionnaire.item.map((item, index) => (
                <Card key={item.linkId} sx={{ mb: 2 }}>
                  <CardContent 
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedItemIndex === index ? 'action.selected' : 'transparent'
                    }}
                    onClick={() => setSelectedItemIndex(index)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {index + 1}. {item.text}
                      </Typography>
                      <Chip label={item.type} size="small" />
                      {item.required && <Chip label="Required" size="small" color="error" />}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => moveItem(index, 'up')} disabled={index === 0}>
                      <MoveUpIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveItem(index, 'down')} disabled={index === questionnaire.item.length - 1}>
                      <MoveDownIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => duplicateItem(index)}>
                      <DuplicateIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteItem(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              ))}
            </List>

            {questionnaire.item.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  No questions yet. Click "Add Question" to get started.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
// /imports/ui-fhir/questionnaireResponses/QuestionnaireResponseDetail.jsx

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
  Divider,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function QuestionnaireResponseDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [questionnaireResponse, setQuestionnaireResponse] = useState({
    resourceType: "QuestionnaireResponse",
    identifier: {
      system: "",
      value: ""
    },
    questionnaire: "",
    status: "in-progress",
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    authored: moment().format('YYYY-MM-DDTHH:mm:ss'),
    author: {
      reference: "",
      display: ""
    },
    source: {
      reference: "",
      display: ""
    },
    item: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalQuestionnaire, setOriginalQuestionnaire] = useState(null);

  // Set patient name and author on component mount for new responses
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new responses
      setIsEditing(true);
      
      // For new responses, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }
      
      // Set author and source to current user
      let authorName = '';
      let authorReference = '';
      
      if (currentUser) {
        authorName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        authorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setQuestionnaireResponse(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        author: {
          reference: authorReference,
          display: authorName
        },
        source: {
          reference: patientReference,
          display: patientName
        }
      }));
    } else {
      // Viewing existing response - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load questionnaire response if editing
  useEffect(function() {
    async function loadQuestionnaireResponse() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('questionnaireResponses.get', id);
          if (result) {
            setQuestionnaireResponse(result);
            
            // Load the original questionnaire if referenced
            if (get(result, 'questionnaire')) {
              let questionnaireId = result.questionnaire;
              if (questionnaireId.includes('/')) {
                questionnaireId = questionnaireId.split('/')[1];
              }
              
              const questionnaire = await Meteor.callAsync('questionnaires.get', questionnaireId);
              if (questionnaire) {
                setOriginalQuestionnaire(questionnaire);
              }
            }
          }
        } catch (err) {
          console.error('Error loading questionnaire response:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadQuestionnaireResponse();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedQuestionnaireResponse = { ...questionnaireResponse };
    set(updatedQuestionnaireResponse, path, value);
    setQuestionnaireResponse(updatedQuestionnaireResponse);
  }

  // Handle answer changes
  function handleAnswerChange(itemIndex, value, answerType) {
    const updatedQuestionnaireResponse = { ...questionnaireResponse };
    const items = get(updatedQuestionnaireResponse, 'item', []);
    
    if (!items[itemIndex]) {
      items[itemIndex] = { answer: [{}] };
    }
    
    if (!items[itemIndex].answer) {
      items[itemIndex].answer = [{}];
    }
    
    // Clear other answer types
    items[itemIndex].answer[0] = {};
    
    // Set the appropriate answer type
    switch(answerType) {
      case 'boolean':
        items[itemIndex].answer[0].valueBoolean = value === 'true';
        break;
      case 'string':
        items[itemIndex].answer[0].valueString = value;
        break;
      case 'integer':
        items[itemIndex].answer[0].valueInteger = parseInt(value) || null;
        break;
      case 'date':
        items[itemIndex].answer[0].valueDate = value;
        break;
      case 'dateTime':
        items[itemIndex].answer[0].valueDateTime = value;
        break;
      case 'coding':
        items[itemIndex].answer[0].valueCoding = {
          system: "",
          code: value,
          display: value
        };
        break;
      default:
        items[itemIndex].answer[0].valueString = value;
    }
    
    set(updatedQuestionnaireResponse, 'item', items);
    setQuestionnaireResponse(updatedQuestionnaireResponse);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing questionnaire response
        await Meteor.callAsync('questionnaireResponses.update', id, questionnaireResponse);
        console.log('Questionnaire response updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new questionnaire response
        const newId = await Meteor.callAsync('questionnaireResponses.create', questionnaireResponse);
        console.log('Questionnaire response created with ID:', newId);
        // Navigate back to questionnaire responses list for new responses
        navigate('/questionnaire-responses');
      }
    } catch (err) {
      console.error('Error saving questionnaire response:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this questionnaire response?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('questionnaireResponses.remove', id);
        console.log('Questionnaire response deleted successfully');
        navigate('/questionnaire-responses');
      } catch (err) {
        console.error('Error deleting questionnaire response:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/questionnaire-responses');
  }

  const statusOptions = [
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'amended', label: 'Amended' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'stopped', label: 'Stopped' }
  ];

  // Render answer fields based on questionnaire items
  function renderAnswerFields() {
    const items = get(questionnaireResponse, 'item', []);
    const questionnaireItems = get(originalQuestionnaire, 'item', []);
    
    if (questionnaireItems.length === 0 && items.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No questions available. Please ensure a questionnaire is linked to this response.
        </Typography>
      );
    }
    
    // Use questionnaire items as template if available
    const itemsToRender = questionnaireItems.length > 0 ? questionnaireItems : items;
    
    return itemsToRender.map((questionItem, index) => {
      const responseItem = items[index] || {};
      const linkId = get(questionItem, 'linkId', `item_${index}`);
      const text = get(questionItem, 'text', get(responseItem, 'text', `Question ${index + 1}`));
      const type = get(questionItem, 'type', 'string');
      
      // Get the current answer value
      let currentValue = '';
      const answer = get(responseItem, 'answer[0]', {});
      
      if (answer.valueString) currentValue = answer.valueString;
      else if (answer.valueBoolean !== undefined) currentValue = answer.valueBoolean.toString();
      else if (answer.valueInteger !== undefined) currentValue = answer.valueInteger.toString();
      else if (answer.valueDate) currentValue = answer.valueDate;
      else if (answer.valueDateTime) currentValue = answer.valueDateTime;
      else if (answer.valueCoding) currentValue = answer.valueCoding.code || answer.valueCoding.display;
      
      // Ensure item has linkId and text
      if (!items[index]) {
        items[index] = { linkId, text };
      } else {
        if (!items[index].linkId) items[index].linkId = linkId;
        if (!items[index].text) items[index].text = text;
      }
      
      switch(type) {
        case 'boolean':
          return (
            <FormControl key={linkId} fullWidth disabled={!isEditing}>
              <Typography variant="body1" gutterBottom>{text}</Typography>
              <RadioGroup
                value={currentValue}
                onChange={(e) => handleAnswerChange(index, e.target.value, 'boolean')}
              >
                <FormControlLabel value="true" control={<Radio />} label="Yes" />
                <FormControlLabel value="false" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          );
          
        case 'integer':
          return (
            <TextField
              key={linkId}
              fullWidth
              type="number"
              label={text}
              value={currentValue}
              onChange={(e) => handleAnswerChange(index, e.target.value, 'integer')}
              disabled={!isEditing}
            />
          );
          
        case 'date':
          return (
            <TextField
              key={linkId}
              fullWidth
              type="date"
              label={text}
              value={moment(currentValue).format('YYYY-MM-DD')}
              onChange={(e) => handleAnswerChange(index, e.target.value, 'date')}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          );
          
        case 'dateTime':
          return (
            <TextField
              key={linkId}
              fullWidth
              type="datetime-local"
              label={text}
              value={moment(currentValue).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleAnswerChange(index, e.target.value, 'dateTime')}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          );
          
        case 'choice':
          const answerOptions = get(questionItem, 'answerOption', []);
          if (answerOptions.length > 0) {
            return (
              <FormControl key={linkId} fullWidth disabled={!isEditing}>
                <InputLabel>{text}</InputLabel>
                <Select
                  value={currentValue}
                  onChange={(e) => handleAnswerChange(index, e.target.value, 'coding')}
                  label={text}
                >
                  {answerOptions.map((option, optIndex) => {
                    const optionValue = get(option, 'valueCoding.code') || 
                                       get(option, 'valueCoding.display') || 
                                       get(option, 'valueString', '');
                    const optionDisplay = get(option, 'valueCoding.display') || 
                                         get(option, 'valueString', optionValue);
                    return (
                      <MenuItem key={optIndex} value={optionValue}>
                        {optionDisplay}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            );
          }
          // Fall through to string if no options
          
        case 'string':
        case 'text':
        default:
          return (
            <TextField
              key={linkId}
              fullWidth
              label={text}
              value={currentValue}
              onChange={(e) => handleAnswerChange(index, e.target.value, 'string')}
              multiline={type === 'text'}
              rows={type === 'text' ? 3 : 1}
              disabled={!isEditing}
            />
          );
      }
    });
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Questionnaire Response' : 'New Questionnaire Response'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Questionnaire Reference"
              value={get(questionnaireResponse, 'questionnaire', '')}
              onChange={(e) => handleChange('questionnaire', e.target.value)}
              helperText="Reference to the questionnaire being answered (e.g., Questionnaire/123)"
              disabled={!isEditing}
            />
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={get(questionnaireResponse, 'status', 'in-progress')}
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
              
              <TextField
                fullWidth
                type="datetime-local"
                label="Authored Date/Time"
                value={moment(get(questionnaireResponse, 'authored', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('authored', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              fullWidth
              label="Subject (Patient)"
              value={get(questionnaireResponse, 'subject.display', '')}
              helperText={get(questionnaireResponse, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              fullWidth
              label="Author"
              value={get(questionnaireResponse, 'author.display', '')}
              onChange={(e) => handleChange('author.display', e.target.value)}
              helperText={get(questionnaireResponse, 'author.reference', '') || 'Author reference will be assigned'}
              disabled={!isEditing}
            />
            
            {originalQuestionnaire && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Questionnaire: {get(originalQuestionnaire, 'title', 'Untitled Questionnaire')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {get(originalQuestionnaire, 'description', '')}
                </Typography>
              </Box>
            )}
            
            <Divider />
            
            <Typography variant="h6">Answers</Typography>
            
            <Stack spacing={2}>
              {renderAnswerFields()}
            </Stack>
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/questionnaire-responses')}
              >
                Back
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button 
                onClick={() => {
                  if (id && id !== 'new') {
                    // Cancel editing and reload original data
                    setIsEditing(false);
                    // Reload the questionnaire response to discard changes
                    async function reloadQuestionnaireResponse() {
                      try {
                        const result = await Meteor.callAsync('questionnaireResponses.get', id);
                        if (result) {
                          setQuestionnaireResponse(result);
                        }
                      } catch (err) {
                        console.error('Error reloading questionnaire response:', err);
                      }
                    }
                    reloadQuestionnaireResponse();
                  } else {
                    // For new questionnaire responses, go back
                    navigate('/questionnaire-responses');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                onClick={handleSave}
                variant="contained"
                color="primary"
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

export default QuestionnaireResponseDetail;
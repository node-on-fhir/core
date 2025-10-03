// packages/reference-app/client/FooterButtons.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { 
  Button,
  ButtonGroup
} from '@mui/material';

import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Add as AddIcon
} from '@mui/icons-material';

// =============================================================================
// FOOTER BUTTONS COMPONENT
// =============================================================================

export function ReferenceAppFooterButtons(props) {
  console.log('ReferenceAppFooterButtons.render()', props);
  
  const navigate = useNavigate();
  
  // =============================================================================
  // HANDLERS
  // =============================================================================
  
  function handleSave() {
    console.log('Save button clicked');
    
    // Get current form data from Session or state
    const formData = Session.get('referenceAppFormData');
    
    // Call server method to save
    Meteor.call('referenceApp.saveData', formData, (error, result) => {
      if (error) {
        console.error('Error saving data:', error);
        // Show error notification
      } else {
        console.log('Data saved successfully:', result);
        // Show success notification
        Session.set('referenceAppFormData', null);
      }
    });
  }
  
  function handleCancel() {
    console.log('Cancel button clicked');
    
    // Clear form data
    Session.set('referenceAppFormData', null);
    
    // Navigate back
    navigate(-1);
  }
  
  function handleSubmit() {
    console.log('Submit button clicked');
    
    const formData = Session.get('referenceAppFormData');
    
    // Validate data
    if (!formData) {
      console.warn('No data to submit');
      return;
    }
    
    // Submit to server
    Meteor.call('referenceApp.submitData', formData, (error, result) => {
      if (error) {
        console.error('Error submitting data:', error);
      } else {
        console.log('Data submitted successfully:', result);
        Session.set('referenceAppFormData', null);
        navigate('/reference-app/success');
      }
    });
  }
  
  function handleAddNew() {
    console.log('Add new button clicked');
    
    // Navigate to creation form
    navigate('/reference-app/new');
  }
  
  // =============================================================================
  // RENDERING
  // =============================================================================
  
  return (
    <ButtonGroup 
      variant="contained" 
      aria-label="reference app footer buttons"
      sx={{ width: '100%' }}
    >
      <Button
        id="referenceAppCancelButton"
        color="inherit"
        onClick={handleCancel}
        startIcon={<CancelIcon />}
        sx={{ 
          flex: 1,
          bgcolor: theme => theme.palette.grey[500]
        }}
      >
        Cancel
      </Button>
      
      <Button
        id="referenceAppSaveButton"
        color="primary"
        onClick={handleSave}
        startIcon={<SaveIcon />}
        sx={{ flex: 1 }}
      >
        Save
      </Button>
      
      <Button
        id="referenceAppSubmitButton"
        color="success"
        onClick={handleSubmit}
        startIcon={<SendIcon />}
        sx={{ flex: 1 }}
      >
        Submit
      </Button>
      
      <Button
        id="referenceAppAddButton"
        color="secondary"
        onClick={handleAddNew}
        startIcon={<AddIcon />}
        sx={{ flex: 1 }}
      >
        Add New
      </Button>
    </ButtonGroup>
  );
}

export default ReferenceAppFooterButtons;
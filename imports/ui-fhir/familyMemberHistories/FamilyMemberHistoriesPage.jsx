// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/familyMemberHistories/FamilyMemberHistoriesPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Grid, 
  Container,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge'; 
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import FamilyMemberHistoriesTable from './FamilyMemberHistoriesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Direct imports to avoid timing issues
import { FamilyMemberHistories } from '/imports/lib/schemas/SimpleSchemas/FamilyMemberHistories';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedFamilyMemberHistoryId', false);
Session.setDefault('familyMemberHistoryPageTabIndex', 1); 
Session.setDefault('familyMemberHistorySearchFilter', ''); 

//=============================================================================================================================================
// MAIN COMPONENT

function FamilyMemberHistoriesPage() {
  const navigate = useNavigate();
  
  // Column visibility toggles
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  
  // Search filter
  const [searchFilter, setSearchFilter] = useState('');
  
  // Debug logging state
  useEffect(() => {
    return () => {
      Session.set('FamilyMemberHistoriesPage.debugLogged', false);
    };
  }, []);

  // Subscription tracker
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    let query = {};
    
    // Add patient filter if patient is selected
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    // Add search filter if provided
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'relationship.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'patient.display': {$regex: searchFilter, $options: 'i'}},
          {'name': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      // Combine patient filter with search filter
      if (Object.keys(query).length > 0) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.FamilyMemberHistories', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('familyMemberHistories.all');
      return !handle.ready();
    }
  }, [searchFilter]);

  // Data tracker
  const data = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    let query = {};
    if (patientIdToUse) {
      query = FhirUtilities.addPatientFilterToQuery(patientIdToUse);
    }
    
    // Debug logging
    if(!Session.get('FamilyMemberHistoriesPage.debugLogged')) {
      Session.set('FamilyMemberHistoriesPage.debugLogged', true);
      
      console.log('FamilyMemberHistories data - MongoDB _id:', selectedPatientId);
      console.log('FamilyMemberHistories data - FHIR id:', fhirId);
      console.log('FamilyMemberHistories data - query:', query);
    }
    
    return {
      familyMemberHistories: FamilyMemberHistories.find(query).fetch(),
      selectedPatient: selectedPatient,
      selectedPatientId: selectedPatientId
    };
  }, []);

  // Handlers
  function handleAddFamilyMemberHistory() {
    navigate('/family-member-histories/new');
  }

  function handleTogglePatientName() {
    setShowPatientName(!showPatientName);
  }
  
  function handleTogglePatientReference() {
    setShowPatientReference(!showPatientReference);
  }
  
  function handleToggleSystemId() {
    setShowSystemId(!showSystemId);
  }

  // Layout helpers
  let layoutContainerStyle = LayoutHelpers.calcLayoutContainerStyle();

  return (
    <Box sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      minHeight: '100vh'
    }}>
      <Container maxWidth="xl" sx={layoutContainerStyle}>
        {/* Header */}
        <Box sx={{ mb: 3, pt: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FamilyRestroomIcon color="primary" />
            Family Health History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Family member health conditions and genetic history for ONC §170.315(a)(12) compliance
          </Typography>
        </Box>

        {/* Controls */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                id="familyMemberHistorySearchInput"
                fullWidth
                placeholder="Search family history by relationship, condition, status..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <ToggleButtonGroup size="small">
                <ToggleButton 
                  value="patientName" 
                  selected={showPatientName}
                  onClick={handleTogglePatientName}
                  aria-label="show patient name"
                >
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton 
                  value="patientReference" 
                  selected={showPatientReference}
                  onClick={handleTogglePatientReference}
                  aria-label="show patient reference"
                >
                  <CodeIcon />
                </ToggleButton>
                <ToggleButton 
                  value="systemId" 
                  selected={showSystemId}
                  onClick={handleToggleSystemId}
                  aria-label="show system id"
                >
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleAddFamilyMemberHistory}
              >
                Add Family History
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Content */}
        {data.familyMemberHistories && data.familyMemberHistories.length > 0 ? (
          <Card>
            <CardContent sx={{ p: 0 }}>
              <FamilyMemberHistoriesTable
                familyMemberHistories={data.familyMemberHistories}
                hidePatientDisplay={!showPatientName}
                hidePatientReference={!showPatientReference}
                hideBarcode={!showSystemId}
                onRowClick={(familyMemberHistoryId) => {
                  navigate('/family-member-histories/' + familyMemberHistoryId);
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }} className="no-data-card">
            <FamilyRestroomIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Family Health History
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {data.selectedPatient ? 
                `No family health history recorded for ${get(data.selectedPatient, 'name.0.text', 'this patient')}` :
                'No family health history records found'
              }
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddFamilyMemberHistory}
            >
              Add Your First Family History Record
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default FamilyMemberHistoriesPage;
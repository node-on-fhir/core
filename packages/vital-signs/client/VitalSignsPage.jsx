// packages/vital-signs/client/VitalSignsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

import { 
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Tab,
  Tabs,
  Fab,
  Stack,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';

// Note: PageCanvas is deprecated, using div instead
// StyledCard is deprecated, using Card from MUI instead
import { useTheme } from '@mui/material/styles';

// Import components
import { VitalSignsPanel } from './components/panels/VitalSignsPanel';
import { VitalSignsTable } from './components/displays/VitalSignsTable';
import { VitalSignsChart } from './components/displays/VitalSignsChart';
import { VitalSignForm } from './components/forms/VitalSignForm';

// Import collections
import { VitalSigns } from '../lib';

// Collections will be accessed via Meteor.Collections
let Patients;
Meteor.startup(function() {
  Patients = Meteor.Collections?.Patients;
});

export function VitalSignsPage(props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { patientId, observationId } = useParams();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedVitalSign, setSelectedVitalSign] = useState(null);

  // Subscribe to data
  const { vitalSigns, selectedPatient, isLoading } = useTracker(function() {
    const handles = [];
    
    // Subscribe to vital signs
    handles.push(Meteor.subscribe('vital-signs.list', patientId));
    
    // Subscribe to patient if patientId provided
    if (patientId) {
      handles.push(Meteor.subscribe('patients.one', patientId));
    }

    const isLoading = handles.some(handle => !handle.ready());
    
    // Query data
    const query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    const vitalSigns = VitalSigns.find(query, {
      sort: { effectiveDateTime: -1 }
    }).fetch();
    
    const selectedPatient = patientId ? Patients.findOne(patientId) : null;
    
    return {
      vitalSigns,
      selectedPatient,
      isLoading
    };
  }, [patientId]);

  // Handle tab change
  function handleTabChange(event, newValue) {
    setSelectedTab(newValue);
  }

  // Handle vital sign selection
  function handleSelectVitalSign(vitalSign) {
    setSelectedVitalSign(vitalSign);
    if (vitalSign && vitalSign.id) {
      navigate(`/vital-signs/${patientId || 'all'}/${vitalSign.id}`);
    }
  }

  // Handle form submit
  async function handleFormSubmit(vitalSignData) {
    try {
      await Meteor.callAsync('vitalSigns.create', vitalSignData);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving vital sign:', error);
    }
  }

  // Render header
  const renderHeader = function() {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <FavoriteIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Box>
                <Typography variant="h4">
                  Vital Signs
                </Typography>
                {selectedPatient && (
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedPatient.name?.[0]?.text || 'Unknown Patient'}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
              disabled={!patientId}
            >
              Record Vital Signs
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render tabs
  const renderTabs = function() {
    return (
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Current Vitals" />
          <Tab label="History" />
          <Tab label="Trends" />
        </Tabs>
      </Paper>
    );
  };

  // Render content based on selected tab
  const renderContent = function() {
    switch (selectedTab) {
      case 0: // Current Vitals
        return (
          <VitalSignsPanel
            vitalSigns={vitalSigns}
            patientId={patientId}
            onSelectVitalSign={handleSelectVitalSign}
          />
        );
      
      case 1: // History
        return (
          <VitalSignsTable
            vitalSigns={vitalSigns}
            onSelectVitalSign={handleSelectVitalSign}
            selectedVitalSign={selectedVitalSign}
          />
        );
        
      case 2: // Trends
        return (
          <VitalSignsChart
            vitalSigns={vitalSigns}
            patientId={patientId}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div id="vitalSignsPage" style={{ padding: '20px' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {renderHeader()}
        {renderTabs()}
        {renderContent()}
        
        {/* Vital Sign Form Dialog */}
        {showForm && (
          <VitalSignForm
            open={showForm}
            onClose={() => setShowForm(false)}
            onSubmit={handleFormSubmit}
            patientId={patientId}
            patientName={selectedPatient?.name?.[0]?.text}
          />
        )}
      </Container>
    </div>
  );
}
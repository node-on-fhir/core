// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/appointments/AppointmentsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import AppointmentsTable from './AppointmentsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedAppointmentId', false);
Session.setDefault('appointmentPageTabIndex', 1); 
Session.setDefault('appointmentSearchFilter', ''); 
Session.setDefault('selectedAppointment', false)
Session.setDefault('AppointmentsPage.onePageLayout', true)
Session.setDefault('AppointmentsPage.defaultQuery', {})
Session.setDefault('AppointmentsTable.hideCheckbox', true)
Session.setDefault('AppointmentsTable.appointmentsIndex', 0)

//=============================================================================================================================================
// GLOBAL THEMING

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(177, 128, 13)",
  secondaryText: "rgba(255, 255, 255, 1) !important",

  cardColor: "rgba(255, 255, 255, 1) !important",
  cardTextColor: "rgba(0, 0, 0, 1) !important",

  errorColor: "rgb(128,20,60) !important",
  errorText: "#ffffff !important",

  appBarColor: "#f5f5f5 !important",
  appBarTextColor: "rgba(0, 0, 0, 1) !important",

  paperColor: "#f5f5f5 !important",
  paperTextColor: "rgba(0, 0, 0, 1) !important",

  backgroundCanvas: "rgba(255, 255, 255, 1) !important",
  background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}

//=============================================================================================================================================
// MAIN COMPONENT

export function AppointmentsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchParams] = useSearchParams();
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('AppointmentsPage.debugLogged', false);
    };
  }, []);

  // Subscribe to appointments data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    let query = {};
    
    // Build search query if search filter is active
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'description': {$regex: searchFilter, $options: 'i'}},
          {'appointmentType.text': {$regex: searchFilter, $options: 'i'}},
          {'appointmentType.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'participant.actor.display': {$regex: searchFilter, $options: 'i'}},
          {'comment': {$regex: searchFilter, $options: 'i'}},
          {'patientInstruction': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    // If we have a patient selected, add patient filter
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      const patientIdToUse = fhirId || selectedPatientId;
      
      // Special patient filter for appointments (uses participant.actor.reference)
      const patientQuery = {
        $or: [
          {"participant.actor.reference": "Patient/" + patientIdToUse},
          {"participant.actor.reference": "urn:uuid:" + patientIdToUse},
          {"participant.actor.reference": { $regex: ".*Patient/" + patientIdToUse}}
        ]
      };
      
      if(searchFilter && searchFilter.length > 0) {
        // Combine search and patient filters
        query = { $and: [query, patientQuery] };
      } else {
        query = patientQuery;
      }
    }
    
    console.log('Appointments subscription - selectedPatientId:', selectedPatientId);
    console.log('Appointments subscription - FHIR id:', get(selectedPatient, 'id'));
    console.log('Appointments subscription query:', query);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Appointments', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Appointments', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentAppointmentId: '',
    selectedAppointment: null,
    appointments: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    appointmentsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('AppointmentsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('AppointmentsTable.hideCheckbox');
  }, [])
  data.selectedAppointmentId = useTracker(function(){
    return Session.get('selectedAppointmentId');
  }, [])
  data.selectedAppointment = useTracker(function(){
    return Appointments.findOne({_id: Session.get('selectedAppointmentId')});
  }, [])
  data.appointments = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering, as that's what FHIR resources reference
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    let query = {};
    if(patientIdToUse) {
      // Special patient filter for appointments (uses participant.actor.reference)
      query = {
        $or: [
          {"participant.actor.reference": "Patient/" + patientIdToUse},
          {"participant.actor.reference": "urn:uuid:" + patientIdToUse},
          {"participant.actor.reference": { $regex: ".*Patient/" + patientIdToUse}}
        ]
      };
    }
    
    // Only do debug logging once when component mounts
    if(!Session.get('AppointmentsPage.debugLogged')) {
      Session.set('AppointmentsPage.debugLogged', true);
      
      console.log('Appointments data - MongoDB _id:', selectedPatientId);
      console.log('Appointments data - FHIR id:', fhirId);
      console.log('Appointments data - Using ID for query:', patientIdToUse);
      console.log('Appointments data - query:', query);
      console.log('Total appointments in collection:', Appointments.find({}).count());
      console.log('Filtered appointments:', Appointments.find(query).count());
    }
    
    return Appointments.find(query).fetch();
  }, [])

  function handleAddAppointment(){
    console.log('Add Appointment button clicked');
    navigate('/appointments/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");
  let noDataCardStyle = {};

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Appointments
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.appointments.length} appointments found
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={handleSortOrderChange}
                aria-label="sort order"
                size="small"
              >
                <ToggleButton value="ascending" aria-label="ascending order">
                  <ArrowUpwardIcon />
                </ToggleButton>
                <ToggleButton value="descending" aria-label="descending order">
                  <ArrowDownwardIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <ToggleButtonGroup
                value={[
                  showPatientName ? 'patientName' : null,
                  showPatientReference ? 'patientReference' : null,
                  showSystemId ? 'systemId' : null
                ].filter(Boolean)}
                onChange={(event, newFormats) => {
                  setShowPatientName(newFormats.includes('patientName'));
                  setShowPatientReference(newFormats.includes('patientReference'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="patientName" aria-label="show patient name">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="patientReference" aria-label="show patient reference">
                  <CodeIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddAppointment}
              >
                Add Appointment
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="appointmentSearchInput"
            fullWidth
            placeholder="Search appointments by status, type, description, practitioner..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(isLoading) {
    layoutContent = <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography>Loading appointments...</Typography>
    </Box>
  } else if(data.appointments.length > 0){
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <AppointmentsTable
          id='appointmentsTable'
          appointments={data.appointments}
          count={data.appointments.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hideCheckbox={data.hideCheckbox}
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onRowClick={function(appointmentId){
            console.log('AppointmentsPage.onRowClick', appointmentId);
            navigate('/appointments/' + appointmentId);
          }}
          onSetPage={function(index){
            Session.set('AppointmentsTable.appointmentsIndex', index);
          }}                
          page={data.appointmentsIndex}
        />
      </CardContent>
    </Card>
  } else {
    // Show empty table with message instead of hiding everything
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <AppointmentsTable
          id='appointmentsTable'
          appointments={[]}
          count={0}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hideCheckbox={data.hideCheckbox}
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onRowClick={function(appointmentId){
            console.log('AppointmentsPage.onRowClick', appointmentId);
            navigate('/appointments/' + appointmentId);
          }}
          onSetPage={function(index){
            Session.set('AppointmentsTable.appointmentsIndex', index);
          }}                
          page={data.appointmentsIndex}
        />
        {searchFilter && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No appointments found matching "{searchFilter}"
            </Typography>
            <Button
              variant="text"
              onClick={() => setSearchFilter('')}
              sx={{ mt: 1 }}
            >
              Clear search
            </Button>
          </Box>
        )}
        {!searchFilter && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No appointments found
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  }

  return (
    <Box 
      id="appointmentsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default AppointmentsPage;
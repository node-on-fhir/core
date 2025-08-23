// /imports/ui-fhir/consents/ConsentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

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
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BusinessIcon from '@mui/icons-material/Business';

import ConsentsTable from './ConsentsTable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import LayoutHelpers from '../../lib/LayoutHelpers';
import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { FhirUtilities } from '../../lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedConsentId', false);
Session.setDefault('selectedConsent', false);
Session.setDefault('ConsentsPage.onePageLayout', true);
Session.setDefault('ConsentsPage.defaultQuery', {});
Session.setDefault('ConsentsTable.hideCheckbox', true);
Session.setDefault('ConsentsTable.consentsIndex', 0);

//=============================================================================================================================================
// COMPONENT

export function ConsentsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showOrganization, setShowOrganization] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    selectedConsentId: '',
    selectedConsent: false,
    consents: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    consentsIndex: 0
  };
  
  // Subscribe to consents data with search filter
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
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
    
    // Add search filter
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'category.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'category.0.coding.0.code': {$regex: searchFilter, $options: 'i'}},
          {'patient.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      // Merge with patient query if exists
      if(query.$and) {
        query.$and.push(searchQuery);
      } else if(Object.keys(query).length > 0) {
        query = {$and: [query, searchQuery]};
      } else {
        query = searchQuery;
      }
    }
    
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.Consents', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('consents.all');
      return !handle.ready();
    }
  }, [searchFilter, Session.get('selectedPatientId')]);

  // Clean up debug logging on unmount
  useEffect(() => {
    return () => {
      Session.set('ConsentsPage.debugLogged', false);
    };
  }, []);

  data.selectedConsentId = useTracker(function(){
    return Session.get('selectedConsentId');
  }, [])
  data.selectedConsent = useTracker(function(){
    return Consents.findOne(Session.get('selectedConsentId'));
  }, [])
  data.consents = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    // Debug logging only once
    if(!Session.get('ConsentsPage.debugLogged')) {
      Session.set('ConsentsPage.debugLogged', true);
      
      console.log('Consents data - MongoDB _id:', selectedPatientId);
      console.log('Consents data - FHIR id:', fhirId);
      console.log('Consents data - query:', query);
      console.log('Total consents:', Consents.find({}).count());
      console.log('Filtered consents:', Consents.find(query).count());
    }
    
    return Consents.find(query).fetch();
  }, [])
  data.consentsIndex = useTracker(function(){
    return Session.get('ConsentsTable.consentsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  function handleAddConsent(){
    console.log('Add Consent button clicked');
    navigate('/consents/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function handleToggleChange(event, newFormats) {
    // newFormats is the array of currently selected values
    setShowPatientName(newFormats.includes('patientName'));
    setShowPatientReference(newFormats.includes('patientReference'));
    setShowSystemId(newFormats.includes('systemId'));
    setShowOrganization(newFormats.includes('organization'));
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Consents
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.consents.length} consents found
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
                  ...(showPatientName ? ['patientName'] : []),
                  ...(showPatientReference ? ['patientReference'] : []),
                  ...(showSystemId ? ['systemId'] : []),
                  ...(showOrganization ? ['organization'] : [])
                ]}
                onChange={handleToggleChange}
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
                <ToggleButton value="organization" aria-label="show organization">
                  <BusinessIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddConsent}
              >
                Add Consent
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="consentSearchInput"
            fullWidth
            placeholder="Search consents by ID, status, category, or patient name..."
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
  if(data.consents.length > 0){
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
        <ConsentsTable 
          id='consentsTable'
          consents={data.consents}
          count={data.consents.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideOrganization={!showOrganization}
          order={sortOrder}
          onRowClick={function(consentId){
            console.log('ConsentsPage.onRowClick', consentId);
            navigate('/consents/' + consentId);
          }}
          onSetPage={function(index){
            Session.set('ConsentsTable.consentsIndex', index);
          }}                
          page={data.consentsIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card 
        className="no-data-card"
        sx={{ 
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                mb: 2
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleAddConsent}
            sx={{ 
              mt: 2,
              px: 4,
              py: 1.5,
              borderRadius: 2
            }}
          >
            Add Your First Consent
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box 
      id="consentsPage" 
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

export default ConsentsPage;
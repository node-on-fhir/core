// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/medias/MediasPage.jsx

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

import MediasTable from './MediasTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

import { Medias } from '/imports/lib/schemas/SimpleSchemas/Medias';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedMediaId', false);
Session.setDefault('mediaPageTabIndex', 1); 
Session.setDefault('mediaSearchFilter', ''); 
Session.setDefault('selectedMedia', false);
Session.setDefault('MediasPage.onePageLayout', true);
Session.setDefault('MediasPage.defaultQuery', {});
Session.setDefault('MediasTable.hideCheckbox', true);
Session.setDefault('MediasTable.mediasIndex', 0);


//=============================================================================================================================================
// MAIN COMPONENT

export function MediasPage(props){
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
      Session.set('MediasPage.debugLogged', false);
    };
  }, []);

  // Subscribe to medias data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    // Build query based on search filter and patient filter
    let query = {};
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'content.title': {$regex: searchFilter, $options: 'i'}},
          {'operator.0.display': {$regex: searchFilter, $options: 'i'}},
          {'deviceName': {$regex: searchFilter, $options: 'i'}},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'type.text': {$regex: searchFilter, $options: 'i'}},
          {'modality.text': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    // If we have a patient selected, filter by that patient
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        // Use the FHIR id as primary search
        const patientQuery = FhirUtilities.addPatientFilterToQuery(fhirId);
        if(query.$or) {
          // Combine search and patient filters
          query = {
            $and: [
              query,
              patientQuery
            ]
          };
        } else {
          query = patientQuery;
        }
      } else if(selectedPatientId) {
        // Fallback to MongoDB _id if no FHIR id available
        const patientQuery = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
        if(query.$or) {
          query = {
            $and: [
              query,
              patientQuery
            ]
          };
        } else {
          query = patientQuery;
        }
      }
    }
    
    console.log('Medias subscription - selectedPatientId:', selectedPatientId);
    console.log('Medias subscription - FHIR id:', get(selectedPatient, 'id'));
    console.log('Medias subscription query:', query);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Medias', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Medias', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentMediaId: '',
    selectedMedia: null,
    medias: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    mediasIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('MediasPage.onePageLayout');
  }, []);
  data.hideCheckbox = useTracker(function(){
    return Session.get('MediasTable.hideCheckbox');
  }, []);
  data.selectedMediaId = useTracker(function(){
    return Session.get('selectedMediaId');
  }, []);
  data.selectedMedia = useTracker(function(){
    return Medias.findOne({_id: Session.get('selectedMediaId')});
  }, []);
  data.medias = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering, as that's what FHIR resources reference
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    let query = {};
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'content.title': {$regex: searchFilter, $options: 'i'}},
          {'operator.0.display': {$regex: searchFilter, $options: 'i'}},
          {'deviceName': {$regex: searchFilter, $options: 'i'}},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'type.text': {$regex: searchFilter, $options: 'i'}},
          {'modality.text': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    // Add patient filter
    if(patientIdToUse) {
      const patientQuery = FhirUtilities.addPatientFilterToQuery(patientIdToUse);
      if(query.$or) {
        query = {
          $and: [
            query,
            patientQuery
          ]
        };
      } else {
        query = patientQuery;
      }
    }
    
    // Only do debug logging once when component mounts
    if(!Session.get('MediasPage.debugLogged')) {
      Session.set('MediasPage.debugLogged', true);
      
      console.log('Medias data - MongoDB _id:', selectedPatientId);
      console.log('Medias data - FHIR id:', fhirId);
      console.log('Medias data - Using ID for query:', patientIdToUse);
      console.log('Medias data - query:', query);
      
      // First check all medias
      const allMedias = Medias.find().fetch();
      console.log('Total Medias in client collection:', allMedias.length);
      
      // Log first few medias to see their structure
      if(allMedias.length > 0) {
        console.log('Sample Media structure:', allMedias[0]);
        console.log('First 3 patient references:');
        allMedias.slice(0, 3).forEach(m => {
          console.log('- _id:', m._id, 'patient:', get(m, 'patient'), 'subject:', get(m, 'subject'));
        });
      }
    }
    
    // Sort by _id descending to get newest first
    const results = Medias.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, [searchFilter]);
  data.mediasIndex = useTracker(function(){
    return Session.get('MediasTable.mediasIndex');
  }, []);
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, []);
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, []);


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddMedia(){
    console.log('Add Media button clicked');
    navigate('/medias/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Media Resources
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.medias.length} media records found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
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
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
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
                onClick={handleAddMedia}
              >
                Add Media
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="mediaSearchInput"
              fullWidth
              placeholder="Search medias by ID, title, operator, device, status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ 
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.medias.length > 0){
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
        <MediasTable 
          id='mediasTable'
          medias={data.medias}
          count={data.medias.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Medias.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            Medias.remove({_id: selectedId});
          }}
          onRowClick={function(mediaId){
            console.log('MediasPage.onRowClick', mediaId);
            navigate('/medias/' + mediaId);
          }}
          onSetPage={function(index){
            Session.set('MediasTable.mediasIndex', index);
          }}        
          page={data.mediasIndex}
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
            startIcon={<AddIcon />}
            onClick={handleAddMedia}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Add Your First Media
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="mediasPage" 
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

export default MediasPage;
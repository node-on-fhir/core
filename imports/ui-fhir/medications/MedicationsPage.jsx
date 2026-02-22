import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

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
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Direct import - no Meteor.startup needed
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';

// import MedicationDetail from './MedicationDetail';
import MedicationsTable from './MedicationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedMedicationId', false);


Session.setDefault('medicationPageTabIndex', 1); 
Session.setDefault('medicationSearchFilter', ''); 
Session.setDefault('selectedMedicationId', false);
Session.setDefault('selectedMedication', false)
Session.setDefault('MedicationsPage.onePageLayout', true)
Session.setDefault('MedicationsPage.defaultQuery', {})
Session.setDefault('MedicationsTable.hideCheckbox', true)
Session.setDefault('MedicationsTable.medicationsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function MedicationsPage(props){
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('descending');

  // Subscribe to medications data
  const isLoading = useTracker(() => {
    // Request configured subscription limit to ensure newly created records appear
    // This is especially important when there are 100+ existing records (e.g., Synthea data)
    const subscriptionLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

    // Build query based on search filter
    let query = {};

    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      // Check if searchFilter looks like a medication ID (24-char hex string)
      const looksLikeId = /^[a-f0-9]{24}$/i.test(searchFilter);

      if (looksLikeId) {
        // Exact ID match - much faster, no regex needed
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter}
          ]
        };
        console.log('Medications subscription - ID query (optimized):', query);
      } else {
        // General search with regex
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'code.text': {$regex: searchFilter, $options: 'i'}},
            {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
            {'manufacturer.display': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}}
          ]
        };
        console.log('Medications subscription - general query:', query);
      }
    }

    const handle = Meteor.subscribe('selectedPatient.Medications', Session.get('selectedPatientId'), {
      limit: subscriptionLimit,
      sort: { '_id': -1 } // Most recent first
    });
    return !handle.ready();
  }, [searchFilter]);

  let data = {
    currentMedicationId: '',
    selectedMedication: null,
    medications: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    medicationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('MedicationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('MedicationsTable.hideCheckbox');
  }, [])
  data.selectedMedicationId = useTracker(function(){
    return Session.get('selectedMedicationId');
  }, [])
  data.selectedMedication = useTracker(function(){
    return Medications.findOne({_id: Session.get('selectedMedicationId')});
  }, [])
  data.medications = useTracker(function(){
    // Build same query as subscription for client-side filtering
    let query = {};

    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      // Check if searchFilter looks like a medication ID (24-char hex string)
      const looksLikeId = /^[a-f0-9]{24}$/i.test(searchFilter);

      if (looksLikeId) {
        // Exact ID match - much faster
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter}
          ]
        };
      } else {
        // General search with regex
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'code.text': {$regex: searchFilter, $options: 'i'}},
            {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
            {'manufacturer.display': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}}
          ]
        };
      }
    }

    // Sort by most recent first (using _id in reverse order)
    const medications = Medications.find(query, {
      sort: {
        '_id': -1  // Most recent first (naive but works with MongoDB ObjectIDs)
      }
    }).fetch();

    // Diagnostic logging
    console.log('[MedicationsPage] Fetched', medications.length, 'medications from client collection');
    if (medications.length > 0) {
      console.log('[MedicationsPage] First 3 medications:', medications.slice(0, 3).map(med => ({
        _id: med._id,
        codeText: get(med, 'code.text'),
        codeDisplay: get(med, 'code.coding[0].display'),
        manufacturer: get(med, 'manufacturer.display')
      })));
    }

    return medications;
  }, [searchFilter])
  data.medicationsIndex = useTracker(function(){
    return Session.get('MedicationsTable.medicationsIndex')
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
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddMedication(){
    console.log('Add Medication button clicked');
    navigate('/medications/new');
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
              Medications
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.medications.length} medications found
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

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMedication}
              >
                Add Medication
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              id="medicationSearchInput"
              fullWidth
              placeholder="Search medications by ID, code, manufacturer, status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.medications.length > 0){
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
        <MedicationsTable 
          id='medicationsTable'
          medications={data.medications}
          count={data.medications.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Medications.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Medications._collection.remove({_id: selectedId})
          }}
          onRowClick={function(medicationId){
            console.log('Medication row clicked:', medicationId);
            Session.set('selectedMedicationId', medicationId);
            navigate('/medications/' + medicationId);
          }}
          onSetPage={function(index){
            Session.set('MedicationsTable.medicationsIndex', index)
          }}        
          page={data.medicationsIndex}
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
            onClick={handleAddMedication}
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
            Add Your First Medication
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="medicationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.medications.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default MedicationsPage;
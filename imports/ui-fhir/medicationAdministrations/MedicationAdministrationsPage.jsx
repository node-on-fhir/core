// imports/ui-fhir/medicationAdministrations/MedicationAdministrationsPage.jsx

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
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import MedicationAdministrationDetail from './MedicationAdministrationDetail';
import MedicationAdministrationsTable from './MedicationAdministrationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  MedicationAdministrations = Meteor.Collections.MedicationAdministrations;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedMedicationAdministrationId', false);


Session.setDefault('medicationAdministrationPageTabIndex', 1); 
Session.setDefault('medicationAdministrationSearchFilter', ''); 
Session.setDefault('selectedMedicationAdministrationId', false);
Session.setDefault('selectedMedicationAdministration', false)
Session.setDefault('MedicationAdministrationsPage.onePageLayout', true)
Session.setDefault('MedicationAdministrationsPage.defaultQuery', {})
Session.setDefault('MedicationAdministrationsTable.hideCheckbox', true)
Session.setDefault('MedicationAdministrationsTable.medicationAdministrationsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function MedicationAdministrationsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');

  let data = {
    currentMedicationAdministrationId: '',
    selectedMedicationAdministration: null,
    medicationAdministrations: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    medicationAdministrationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('MedicationAdministrationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('MedicationAdministrationsTable.hideCheckbox');
  }, [])
  data.selectedMedicationAdministrationId = useTracker(function(){
    return Session.get('selectedMedicationAdministrationId');
  }, [])
  data.selectedMedicationAdministration = useTracker(function(){
    return MedicationAdministrations.findOne({_id: Session.get('selectedMedicationAdministrationId')});
  }, [])
  data.medicationAdministrations = useTracker(function(){
    return MedicationAdministrations.find().fetch();
  }, [])
  data.medicationAdministrationsIndex = useTracker(function(){
    return Session.get('MedicationAdministrationsTable.medicationAdministrationsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  // Subscribe to MedicationAdministrations
  useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      return Meteor.subscribe('autopublish.MedicationAdministrations', {}, {});
    } else {
      return Meteor.subscribe('medicationAdministrations.all');
    }
  }, []);


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddMedicationAdministration(){
    console.log('Add Medication Administration button clicked');
    navigate('/medication-administrations/new');
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
              Medication Administrations
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.medicationAdministrations.length} administrations found
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMedicationAdministration}
              >
                Add Administration
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Sort medication administrations by effectiveDateTime
  let sortedMedicationAdministrations = [...data.medicationAdministrations];
  sortedMedicationAdministrations.sort((a, b) => {
    let dateA = get(a, 'effectiveDateTime', '');
    let dateB = get(b, 'effectiveDateTime', '');
    
    if (sortOrder === 'ascending') {
      return dateA > dateB ? 1 : -1;
    } else {
      return dateA < dateB ? 1 : -1;
    }
  });

  let layoutContent;
  if(data.medicationAdministrations.length > 0){
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
        <MedicationAdministrationsTable 
          id='medicationAdministrationsTable'
          medicationAdministrations={sortedMedicationAdministrations}
          count={sortedMedicationAdministrations.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.MedicationAdministrations.hideRemoveButtonOnTable', true)}
          hideStatus={false}
          hideRoute={false}
          hideNote={false}
          onActionButtonClick={function(selectedId){
            MedicationAdministrations._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('MedicationAdministrationsTable.medicationAdministrationsIndex', index)
          }}
          onRowClick={function(medicationAdministrationId){
            console.log('MedicationAdministrationsPage.onRowClick', medicationAdministrationId);
            navigate('/medication-administrations/' + medicationAdministrationId);
          }}        
          page={data.medicationAdministrationsIndex}
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
            onClick={handleAddMedicationAdministration}
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
            Add Your First Administration
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="medicationAdministrationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.medicationAdministrations.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default MedicationAdministrationsPage;
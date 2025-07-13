// /imports/ui-fhir/communications/CommunicationsPage.jsx

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
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import CommunicationDetail from './CommunicationDetail';
import CommunicationsTable from './CommunicationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

let Communications;
Meteor.startup(async function(){
  if(Meteor.isClient){
    Communications = await global.Collections.Communications;
  }
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedCommunicationId', false);


Session.setDefault('communicationPageTabIndex', 1); 
Session.setDefault('communicationSearchFilter', ''); 
Session.setDefault('selectedCommunicationId', false);
Session.setDefault('selectedCommunication', false)
Session.setDefault('CommunicationsPage.onePageLayout', true)
Session.setDefault('CommunicationsPage.defaultQuery', {})
Session.setDefault('CommunicationsTable.hideCheckbox', true)
Session.setDefault('CommunicationsTable.communicationsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function CommunicationsPage(props){
  const navigate = useNavigate();

  let data = {
    currentCommunicationId: '',
    selectedCommunication: null,
    communications: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    communicationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('CommunicationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('CommunicationsTable.hideCheckbox');
  }, [])
  data.selectedCommunicationId = useTracker(function(){
    return Session.get('selectedCommunicationId');
  }, [])
  data.selectedCommunication = useTracker(function(){
    if(Communications){
      return Communications.findOne({_id: Session.get('selectedCommunicationId')});
    }
    return null;
  }, [])
  data.communications = useTracker(function(){
    if(Communications){
      return Communications.find().fetch();
    }
    return [];
  }, [])
  data.communicationsIndex = useTracker(function(){
    return Session.get('CommunicationsTable.communicationsIndex')
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

  function handleAddCommunication(){
    console.log('Add Communication button clicked');
    navigate('/communications/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Communications
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.communications.length} communications found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCommunication}
            >
              Add Communication
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.communications.length > 0){
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
        <CommunicationsTable 
          id='communicationsTable'
          communications={data.communications}
          count={data.communications.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Communications.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Communications._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('CommunicationsTable.communicationsIndex', index);
          }}        
          page={data.communicationsIndex}
          onRowClick={function(communicationId){
            console.log('CommunicationsPage.onRowClick', communicationId);
            navigate('/communications/' + communicationId);
          }}
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
            onClick={handleAddCommunication}
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
            Add Your First Communication
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="communicationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.communications.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default CommunicationsPage;
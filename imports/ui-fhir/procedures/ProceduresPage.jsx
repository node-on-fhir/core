// /imports/ui-fhir/procedures/ProceduresPage.jsx

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

// import ProcedureDetail from './ProcedureDetail';
import ProceduresTable from './ProceduresTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';

//=============================================================================================================================================
// DATA CURSORS

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedProcedureId', false);


Session.setDefault('procedurePageTabIndex', 1); 
Session.setDefault('procedureSearchFilter', ''); 
Session.setDefault('selectedProcedureId', false);
Session.setDefault('selectedProcedure', false)
Session.setDefault('ProceduresPage.onePageLayout', true)
Session.setDefault('ProceduresPage.defaultQuery', {})
Session.setDefault('ProceduresTable.hideCheckbox', true)
Session.setDefault('ProceduresTable.proceduresIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ProceduresPage(props){
  const navigate = useNavigate();

  let data = {
    currentProcedureId: '',
    selectedProcedure: null,
    procedures: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    proceduresIndex: 0
  };

  // Subscribe to Procedures
  useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      return Meteor.subscribe('autopublish.Procedures', {}, {});
    } else {
      return Meteor.subscribe('procedures.all');
    }
  }, []);

  data.onePageLayout = useTracker(function(){
    return Session.get('ProceduresPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ProceduresTable.hideCheckbox');
  }, [])
  data.selectedProcedureId = useTracker(function(){
    return Session.get('selectedProcedureId');
  }, [])
  data.selectedProcedure = useTracker(function(){
    return Procedures.findOne({_id: Session.get('selectedProcedureId')});
  }, [])
  data.procedures = useTracker(function(){
    return Procedures.find().fetch();
  }, [])
  data.proceduresIndex = useTracker(function(){
    return Session.get('ProceduresTable.proceduresIndex')
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

  function handleAddProcedure(){
    console.log('Add Procedure button clicked');
    navigate('/procedures/new');
  }

  function handleRowClick(procedureId){
    console.log('Procedure row clicked:', procedureId);
    navigate('/procedures/' + procedureId);
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Procedures
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.procedures.length} procedures found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddProcedure}
            >
              Add Procedure
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.procedures.length > 0){
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
        <ProceduresTable 
          id='proceduresTable'
          procedures={data.procedures}
          count={data.procedures.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Procedures.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Procedures._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('ProceduresTable.proceduresIndex', index)
          }}        
          page={data.proceduresIndex}
          onRowClick={handleRowClick}
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
            onClick={handleAddProcedure}
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
            Add Your First Procedure
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="proceduresPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.procedures.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}


export default ProceduresPage;
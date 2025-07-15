// /imports/ui-fhir/lists/ListsPage.jsx

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

// import ListDetail from './ListDetail';
import ListsTable from './ListsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

let Lists;
Meteor.startup(async function(){
  if(Meteor.isClient){
    Lists = await global.Collections.Lists;
  }
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedListId', false);


Session.setDefault('listPageTabIndex', 1); 
Session.setDefault('listSearchFilter', ''); 
Session.setDefault('selectedListId', false);
Session.setDefault('selectedList', false)
Session.setDefault('ListsPage.onePageLayout', true)
Session.setDefault('ListsPage.defaultQuery', {})
Session.setDefault('ListsTable.hideCheckbox', true)
Session.setDefault('ListsTable.listsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ListsPage(props){
  const navigate = useNavigate();

  let data = {
    currentListId: '',
    selectedList: null,
    lists: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    listsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ListsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ListsTable.hideCheckbox');
  }, [])
  data.selectedListId = useTracker(function(){
    return Session.get('selectedListId');
  }, [])
  data.selectedList = useTracker(function(){
    if(Lists){
      return Lists.findOne({_id: Session.get('selectedListId')});
    }
    return null;
  }, [])
  data.lists = useTracker(function(){
    if(Lists){
      return Lists.find().fetch();
    }
    return [];
  }, [])
  data.listsIndex = useTracker(function(){
    return Session.get('ListsTable.listsIndex')
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

  function handleAddList(){
    console.log('Add List button clicked');
    navigate('/lists/new');
    // Add logic for adding a new list
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Lists
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.lists.length} lists found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddList}
            >
              Add List
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.lists.length > 0){
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
        <ListsTable 
          id='listsTable'
          lists={data.lists}
          count={data.lists.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Lists.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Lists._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('ListsTable.listsIndex', index);
          }}        
          page={data.listsIndex}
          onRowClick={function(listId){
            console.log('ListsPage.onRowClick', listId);
            navigate('/lists/' + listId);
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
            onClick={handleAddList}
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
            Add Your First List
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="listsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.lists.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default ListsPage;
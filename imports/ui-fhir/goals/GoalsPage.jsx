import { 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Typography,
  Box,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

// import ListDetail from './ListDetail';
import GoalsTable from '../carePlans/GoalsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, cloneDeep } from 'lodash';



//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Goals = Meteor.Collections.Goals;
})

//===============================================================================================================
// Session Variables

Session.setDefault('goalPageTabIndex', 0);
Session.setDefault('goalSearchFilter', '');
Session.setDefault('selectedGoalId', '');
Session.setDefault('selectedGoal', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('goalsArray', []);
Session.setDefault('GoalsPage.onePageLayout', true)


//===============================================================================================================
// Global Theming 
// This is necessary for the Material UI component render layer

// import { MuiThemeProvider, createTheme } from '@mui/material/styles';


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



//===============================================================================================================
// Main Component

export function GoalsPage(props){
  const navigate = useNavigate();

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  

  let cardWidth = window.innerWidth - paddingWidth;

  function handleAddGoal(){
    console.log('Add Goal button clicked');
    navigate('/goals/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Goals
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.goals.length} goals found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddGoal}
            >
              Add Goal
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  
  let data = {
    selectedGoalId: '',
    selectedGoal: null,
    goals: [],
    query: {},
    options: {
      limit: get(Meteor, 'settings.public.defaults.paginationLimit', 5)
    },
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    goalsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('GoalsPage.onePageLayout');
  }, [])
  data.selectedGoalId = useTracker(function(){
    return Session.get('selectedGoalId');
  }, [])
  data.selectedGoal = useTracker(function(){
    return Goals.findOne(Session.get('selectedGoalId'));
  }, [])
  data.goals = useTracker(function(){
    return Goals.find().fetch();
  }, [])
  data.goalsIndex = useTracker(function(){
    return Session.get('OrganizationsTable.goalsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])
  

  function setGoalsIndex(newIndex){
    Session.set('GoalsTable.goalsIndex', newIndex)
  }




  let layoutContent;
  if(data.goals.length > 0){
    if(data.onePageLayout){
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
          <GoalsTable 
            goals={ data.goals }
            hideCheckbox={true} 
            hideActionIcons={true}
            hideIdentifier={true} 
            paginationLimit={10}   
            onSetPage={function(index){
              setGoalsIndex(index)
            }}   
            page={data.goalsIndex}                 
          />
        </CardContent>
      </Card>
    } else {
      layoutContent = <Grid container spacing={3}>
        <Grid item lg={6}>
          <Card 
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
              <GoalsTable 
                goals={ data.goals }
                selectedGoalId={ data.selectedGoalId }
                hideIdentifier={true} 
                hideCheckbox={true} 
                hideApprovalDate={false}
                hideLastReviewed={false}
                hideVersion={false}
                hideStatus={false}
                hidePublisher={true}
                hideReviewer={true}
                hideScoring={true}
                hideEndorser={true}
                paginationLimit={10}            
                hideActionIcons={true}
                onRowClick={this.handleRowClick.bind(this) }
                onSetPage={function(index){
                  setGoalsIndex(index)
                }}         
                page={data.goalsIndex}                 
                count={data.goalsCount}
                />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={4}>
          <Card 
            sx={{ 
              width: '100%',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedGoalId }</h1>
            <CardContent>
              <CardContent>
                {/* <ListDetail 
                  id='goalDetails' 
                  displayDatePicker={true} 
                  displayBarcodes={false}
                  goal={ data.selectedGoal }
                  goalId={ data.selectedGoalId } 
                  showListInputs={true}
                  showHints={false}
                /> */}
              </CardContent>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    }
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
            onClick={handleAddGoal}
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
            Add Your First Goal
          </Button>
        </CardContent>
      </Card>
    </Box>
  }


  return (
    <Box 
      id="goalsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.goals.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}


export default GoalsPage;
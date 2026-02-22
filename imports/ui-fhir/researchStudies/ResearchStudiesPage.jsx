// /imports/ui-fhir/researchStudies/ResearchStudiesPage.jsx

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

// import ResearchStudyDetail from './ResearchStudyDetail';
import ResearchStudiesTable from './ResearchStudiesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Import the collection directly - avoids timing issues
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedResearchStudyId', false);
Session.setDefault('researchStudiesPageTabIndex', 1); 
Session.setDefault('researchStudiesSearchFilter', ''); 
Session.setDefault('selectedResearchStudy', false)
Session.setDefault('ResearchStudiesPage.onePageLayout', true)
Session.setDefault('ResearchStudiesPage.defaultQuery', {})
Session.setDefault('ResearchStudiesTable.hideCheckbox', true)
Session.setDefault('ResearchStudiesTable.researchStudiesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ResearchStudiesPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');

  // Subscribe to ResearchStudies
  useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.ResearchStudies', Session.get('selectedPatientId'), {});
    } else {
      return Meteor.subscribe('researchStudies.all');
    }
  }, []);

  let data = {
    currentResearchStudyId: '',
    selectedResearchStudy: null,
    researchStudies: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    researchStudiesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ResearchStudiesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ResearchStudiesTable.hideCheckbox');
  }, [])
  data.selectedResearchStudyId = useTracker(function(){
    return Session.get('selectedResearchStudyId');
  }, [])
  data.selectedResearchStudy = useTracker(function(){
    return ResearchStudies.findOne({_id: Session.get('selectedResearchStudyId')});
  }, [])
  data.researchStudies = useTracker(function(){
    return ResearchStudies.find().fetch();
  }, [])
  data.researchStudiesIndex = useTracker(function(){
    return Session.get('ResearchStudiesTable.researchStudiesIndex')
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

  function handleAddResearchStudy(){
    console.log('Add Research Study button clicked');
    navigate('/research-studies/new');
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
              Research Studies
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.researchStudies.length} research studies found
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
                onClick={handleAddResearchStudy}
              >
                Add Research Study
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.researchStudies.length > 0){
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
        <ResearchStudiesTable 
          id='researchStudiesTable'
          researchStudies={data.researchStudies}
          count={data.researchStudies.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.ResearchStudies.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            ResearchStudies.remove({_id: selectedId})
          }}
          onRowClick={function(researchStudyId){
            console.log('ResearchStudiesPage.onRowClick', researchStudyId);
            navigate('/research-studies/' + researchStudyId);
          }}
          onSetPage={function(index){
            Session.set('ResearchStudiesTable.researchStudiesIndex', index)
          }}        
          page={data.researchStudiesIndex}
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
            onClick={handleAddResearchStudy}
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
            Add Your First Research Study
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="researchStudiesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.researchStudies.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default ResearchStudiesPage;
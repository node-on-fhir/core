// /imports/ui-fhir/researchSubjects/ResearchSubjectsPage.jsx

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

import ResearchSubjectsTable from './ResearchSubjectsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Import the collection directly - avoids timing issues
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedResearchSubjectId', false);


Session.setDefault('researchSubjectPageTabIndex', 1); 
Session.setDefault('researchSubjectSearchFilter', ''); 
Session.setDefault('selectedResearchSubjectId', false);
Session.setDefault('selectedResearchSubject', false)
Session.setDefault('ResearchSubjectsPage.onePageLayout', true)
Session.setDefault('ResearchSubjectsPage.defaultQuery', {})
Session.setDefault('ResearchSubjectsTable.hideCheckbox', true)
Session.setDefault('ResearchSubjectsTable.researchSubjectsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ResearchSubjectsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');

  // Subscribe to ResearchSubjects
  useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('autopublish.ResearchSubjects', {}, { limit: 1000 });
    } else {
      return Meteor.subscribe('selectedPatient.ResearchSubjects', Session.get('selectedPatientId'), { limit: 1000 });
    }
  }, []);

  let data = {
    currentResearchSubjectId: '',
    selectedResearchSubject: null,
    researchSubjects: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    researchSubjectsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ResearchSubjectsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ResearchSubjectsTable.hideCheckbox');
  }, [])
  data.selectedResearchSubjectId = useTracker(function(){
    return Session.get('selectedResearchSubjectId');
  }, [])
  data.selectedResearchSubject = useTracker(function(){
    return ResearchSubjects.findOne({_id: Session.get('selectedResearchSubjectId')});
  }, [])
  data.researchSubjects = useTracker(function(){
    return ResearchSubjects.find().fetch();
  }, [])
  data.researchSubjectsIndex = useTracker(function(){
    return Session.get('ResearchSubjectsTable.researchSubjectsIndex')
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

  function handleAddResearchSubject(){
    console.log('Add Research Subject button clicked');
    navigate('/research-subjects/new');
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
              Research Subjects
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.researchSubjects.length} research subjects found
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
                onClick={handleAddResearchSubject}
              >
                Add Research Subject
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.researchSubjects.length > 0){
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
        <ResearchSubjectsTable 
          id='researchSubjectsTable'
          researchSubjects={data.researchSubjects}
          count={data.researchSubjects.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.ResearchSubjects.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            ResearchSubjects.remove({_id: selectedId})
          }}
          onRowClick={function(researchSubjectId){
            console.log('ResearchSubjectsPage.onRowClick', researchSubjectId);
            navigate('/research-subjects/' + researchSubjectId);
          }}
          onSetPage={function(index){
            Session.set('ResearchSubjectsTable.researchSubjectsIndex', index)
          }}        
          page={data.researchSubjectsIndex}
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
            onClick={handleAddResearchSubject}
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
            Add Your First Research Subject
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="researchSubjectsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.researchSubjects.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default ResearchSubjectsPage;

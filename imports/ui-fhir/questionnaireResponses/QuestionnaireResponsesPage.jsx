import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Card,
  CardContent, 
  CardHeader,
  Container,
  Grid,
  Button,
  Typography,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';


// import QuestionnaireResponseDetail from './QuestionnaireResponseDetail';
import QuestionnaireResponsesTable from './QuestionnaireResponsesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { Session } from 'meteor/session';

import { get } from 'lodash';

import SurveyResponseSummary from './SurveyResponseSummary';


//===========================================================================

Meteor.startup(function(){
  Questionnaires = Meteor.Collections.Questionnaires;
  QuestionnaireResponses = Meteor.Collections.QuestionnaireResponses;
})

//===============================================================================================================
// Session Variables

Session.setDefault('questionnaireResponseFormData', null);
Session.setDefault('questionnaireResponseSearchFilter', '');
Session.setDefault('selectedQuestionnaireResponse', null);
Session.setDefault('selectedQuestionnaireResponseId', '');

Session.setDefault('QuestionnaireResponsesPage.onePageLayout', false)
Session.setDefault('QuestionnaireResponsesPage.defaultQuery', {})
Session.setDefault('QuestionnaireResponsesTable.hideCheckbox', true)
Session.setDefault('QuestionnaireResponsesTable.questionnaireResponsesIndex', 0)


//===============================================================================================================
// Global Theming 
// This is necessary for the Material UI component render layer

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


export function QuestionnaireResponsesPage(props){
  const navigate = useNavigate();


  let data = {
    selectedQuestionnaireResponseId: '',
    selectedQuestionnaireResponse: null,
    questionnaireResponses: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    organizationsIndex: 0
  };

  // Subscribe to QuestionnaireResponses
  useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.QuestionnaireResponses', Session.get('selectedPatientId'), {});
    } else {
      return Meteor.subscribe('questionnaireresponses.all');
    }
  }, []);

  data.onePageLayout = useTracker(function(){
    return Session.get('QuestionnaireResponsesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('QuestionnaireResponsesTable.hideCheckbox');
  }, [])

  data.selectedQuestionnaireResponseId = useTracker(function(){
    return Session.get('selectedQuestionnaireResponseId');
  }, [])
  data.selectedQuestionnaireResponse = useTracker(function(){
    return QuestionnaireResponses.findOne({id: Session.get('selectedQuestionnaireResponseId')});
  }, [])
  data.questionnaireResponses = useTracker(function(){
    return QuestionnaireResponses.find().fetch();
  }, [])
  data.questionnaireResponseSearchFilter = useTracker(function(){
    return Session.get('questionnaireResponseSearchFilter');
  }, [])
  data.questionnaireResponsesIndex = useTracker(function(){
    return Session.get('QuestionnaireResponsesTable.questionnaireResponsesIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])



  function onRowChecked(questionnaire, event, toggle){
    console.log('onRowChecked', questionnaire, toggle);
    let newStatus = 'draft';

    if(toggle){
      newStatus = 'active';
    } else {
      newStatus = 'draft';
    }

    Questionnaires._collection.update({_id: questionnaire._id}, {$set: {
      'status': newStatus
    }}, function(error, result){
      if(error){
        console.error('Questionnaire Error', error);
      }
    });
  }
  function onSend(id){
    let patient = QuestionnaireResponses.findOne({_id: id});

    console.log("QuestionnaireResponsesTable.onSend()", patient);

    var httpEndpoint = "http://localhost:8080";
    if (get(Meteor, 'settings.public.interfaces.default.channel.endpoint')) {
      httpEndpoint = get(Meteor, 'settings.public.interfaces.default.channel.endpoint');
    }
    HTTP.post(httpEndpoint + '/QuestionnaireResponse', {
      data: patient
    }, function(error, result){
      if (error) {
        console.log("error", error);
      }
      if (result) {
        console.log("result", result);
      }
    });
  }


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();


  let cardWidth = window.innerWidth - paddingWidth;
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");

  function handleAddQuestionnaireResponse(){
    console.log('Add Questionnaire Response button clicked');
    navigate('/questionnaire-responses/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Questionnaire Responses
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.questionnaireResponses.length} responses found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddQuestionnaireResponse}
            >
              Add Questionnaire Response
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }  


  let layoutContent;
  if(data.questionnaireResponses.length > 0){
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
          <QuestionnaireResponsesTable 
            questionnaireResponses={data.questionnaireResponses}
            count={data.questionnaireResponses.length}
            onCellClick={function(responseId){
              console.log('responseId', responseId)
              Session.set('selectedQuestionnaireResponse', responseId)
              Session.set('questionnaireResponsePageTabIndex', 2)
            }}
            onRemoveRecord={function(responseId){
              console.log('onRemoveRecord()')
              QuestionnaireResponses.remove({_id: responseId});                      
            }}
            onRowClick={function(responseId){
              console.log('onRowClick()', responseId)
              Session.set('selectedQuestionnaireResponseId', responseId);                  
              Session.set('selectedQuestionnaireResponse', QuestionnaireResponses.findOne(responseId));
              navigate(`/questionnaire-responses/${responseId}`);                  
            }}
            onSetPage={function(index){
              Session.set('QuestionnaireResponsesTable.questionnaireResponsesIndex', index)
            }}  
            page={data.questionaireResponsesIndex}
            formFactorLayout={formFactor}
            rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
            size="medium"
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
              <QuestionnaireResponsesTable 
                questionnaireResponses={data.questionnaireResponses}
                count={data.questionnaireResponses.length}
                onCellClick={function(responseId){
                  console.log('responseId', responseId)
                  Session.set('selectedQuestionnaireResponse', responseId)
                  Session.set('selectedQuestionnaireResponseId', responseId)
                  Session.set('questionnaireResponsePageTabIndex', 2)
                }}
                onRemoveRecord={function(responseId){
                  console.log('onRemoveRecord()')
                  QuestionnaireResponses.remove({_id: responseId});                      
                }}
                onRowClick={function(responseId){
                  console.log('onRowClick()', responseId)
                  Session.set('selectedQuestionnaireResponseId', responseId);                  
                  Session.set('selectedQuestionnaireResponse', QuestionnaireResponses.findOne(responseId));
                  navigate(`/questionnaire-responses/${responseId}`);                  
                }}
                onSetPage={function(index){
                  Session.set('QuestionnaireResponsesTable.questionnaireResponsesIndex', index)
                }}  
                page={data.questionaireResponsesIndex}
                formFactorLayout={formFactor}
                rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
                size="medium"
                  />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={5}>
          <Card 
            sx={{ 
              width: '100%',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <h1 className="barcode" style={{fontWeight: 100}}>{data.questionnaireResponseId }</h1>
            <CardContent>
              <CardContent>
                {/* <code>
                  {JSON.stringify(data.questionnaireResponse)}
                </code> */}
  
                <SurveyResponseSummary 
                  id='surveyResponseSummary' 
                  selectedResponse={get(data, 'selectedQuestionnaireResponse', null)} 
                  selectedResponseId={get(data, 'selectedQuestionnaireResponse.id', '')}
                  />
  
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
            onClick={handleAddQuestionnaireResponse}
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
            Add Your First Questionnaire Response
          </Button>
        </CardContent>
      </Card>
    </Box>
  }


  return (
    <Box 
      id="questionnaireResponsesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.questionnaireResponses.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default QuestionnaireResponsesPage;
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Card,
  CardContent, 
  CardHeader, 
  Container,
  Button,
  Grid,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// import QuestionnaireExpansionPanels from './QuestionnaireExpansionPanels';
// import SortableQuestionnaire from './SortableQuestionnaire';

import QuestionnaireExpansion from './QuestionnaireExpansion';
import QuestionnairesTable from './QuestionnairesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

// import questionnaireStyles from "./QuestionnaireStyles.css";



import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import moment from 'moment';
import { get } from 'lodash';

let defaultQuestionnaire = {
  index: 2,
  id: ''
};


//===========================================================================

import { DynamicSpacer } from '../../ui/DynamicSpacer';

let ValueSets;
Meteor.startup(function(){
  ValueSets = Meteor.Collections.ValueSets;
})

// =========================================================================================================
// Session Variables  

Session.setDefault('questionnaireFormData', defaultQuestionnaire);
Session.setDefault('questionnaireSearchFilter', '');
Session.setDefault('questionnaireDesignerCurrentQuestion', {
  linkId: 0,
  text: '',
  type: 'question',
  multiplicity: 1,
  multiline: false,
  numerical: false
});
Session.setDefault('questionnaireDesignerCurrentMultiChoice', {label: ''});
Session.setDefault('questionnaireIsSorting', false);

Session.setDefault('enableCurrentQuestionnaire', false);
Session.setDefault('activeQuestionnaireName', 'bar');
Session.setDefault('activeQuestionLinkId', false);

Session.setDefault('selectedQuestionnaireId', '');
Session.setDefault('selectedQuestionnaire', false)
Session.setDefault('QuestionnairesPage.onePageLayout', true)
Session.setDefault('QuestionnairesPage.defaultQuery', {})
Session.setDefault('QuestionnairesTable.hideCheckbox', true)
Session.setDefault('QuestionnairesTable.questionnairesIndex', 0)


//=============================================================================================================================================
// DATA CURSORS

// Import the collection directly - avoids timing issues
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';


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



//===============================================================================================================
// THEMING




// =========================================================================================================
// Main Component

export function QuestionnairesPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  
  // Subscribe to Questionnaires
  useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      return Meteor.subscribe('autopublish.Questionnaires', {}, {});
    } else {
      return Meteor.subscribe('questionnaires.all');
    }
  }, []);
  
  let data = {
    questionnaire: defaultQuestionnaire,
    questionnaireSearchFilter: '',
    currentQuestionnaire: null,
    questionnaireId: false,
    sortableItems: [],
    enabled: true,
    chatbotInstalled: false,
    questionnaireName: '',
    questionnaireDesignerCurrentQuestion: {text: ''},
    questionnaireDesignerCurrentMultiChoice: {label: ''},
    isActive: false,
    isNumber: false,
    isSorting: false,
    activeQuestionLinkId: '',
    questionnaireSearchFilter: '',
    selectedQuestionnaireId: '',
    selectedQuestionnaire: null,
    questionnaires: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    questionnairesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('QuestionnairesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('QuestionnairesTable.hideCheckbox');
  }, [])
  data.selectedQuestionnaireId = useTracker(function(){
    return Session.get('selectedQuestionnaireId');
  }, [])
  data.selectedQuestionnaire = useTracker(function(){
    return Questionnaires.findOne({id: Session.get('selectedQuestionnaireId')});
  }, [])
  data.questionnaires = useTracker(function(){
    return Questionnaires.find().fetch();
  }, [])
  data.enabled = useTracker(function(){
    return Session.get('enableCurrentQuestionnaire');
  }, [])
  data.isSorting = useTracker(function(){
    return Session.get('questionnaireIsSorting');
  }, [])
  data.activeQuestionLinkId = useTracker(function(){
    return Session.get('activeQuestionLinkId');
  }, [])

  data.questionnaireSearchFilter = useTracker(function(){
    return Session.get('questionnaireSearchFilter');
  }, [])
  data.questionnairesIndex = useTracker(function(){
    return Session.get('QuestionnairesTable.questionnairesIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  if (get(data, 'selectedQuestionnaire')) {
    if (get(data, 'selectedQuestionnaire.item')) {
      
      if(Array.isArray(data.selectedQuestionnaire.item)){
        let count = 0;
        data.selectedQuestionnaire.item.forEach(function(item){
          data.sortableItems.push({
            linkId: count,
            text: get(item, 'text')
          });              
          count++;
        });  
      }
    }

    if(get(data, 'selectedQuestionnaire.status') === "active"){
      data.isActive = true;
    } else {
      data.isActive = false;
    }

    // if(get(data, 'selectedQuestionnaire.title')){
    //   data.questionnaireName = get(data, 'selectedQuestionnaire.title');
    // } else {
    //   data.questionnaireName = '';
    // }
  }

  if(get(data, 'activeQuestionLinkId')){
    console.log('ActiveQuestionLinkId was updated. Checking if it exists in the current questionnaire items.')
    if (Array.isArray(get(data, 'selectedQuestionnaire.item'))) {
      data.selectedQuestionnaire.item.forEach(function(item){
        if(Session.equals('activeQuestionLinkId', get(item, 'linkId', ''))){      
          console.log('Found.  Updating the question being edited.')
          data.questionnaireDesignerCurrentQuestion = item;
        }  
      });
    } 
  } 

  // if (Session.get('questionnaireDesignerCurrentQuestion')) {
  //   console.log('Selected question not found.  Using dirty state.')
  //   data.questionnaireDesignerCurrentQuestion = Session.get('questionnaireDesignerCurrentQuestion');
  // }

  console.log("QuestionnairesPage[data]", data);



  function toggleSortStatus(){
    if(Session.equals('questionnaireIsSorting', true)){
      saveSortedQuestionnaire();
      Session.set('questionnaireIsSorting', false);
    } else {
      Session.set('questionnaireIsSorting', true);
    }    
  }
  function toggleActiveStatus(event, newValue){
    console.log('toggleActiveStatus', event, newValue)
    console.log('toggleActiveStatus currentQuestionnaire id', get(this, 'data.currentQuestionnaire._id'))

    let currentStatus =  get(this, 'data.currentQuestionnaire.status');

    console.log('currentStatus', currentStatus)

    if(currentStatus === 'inactive'){
      Questionnaires.update({_id: get(this, 'data.currentQuestionnaire._id')}, {$set: {
        'status': 'active'
      }});
    } else if (currentStatus === 'active'){
      Questionnaires.update({_id: get(this, 'data.currentQuestionnaire._id')}, {$set: {
        'status': 'inactive'
      }});
    }
  }
  function handleAddQuestionnaire() {
    navigate('/questionnaires/new');
  }
  
  function handleSortOrderChange(event, newOrder) {
    if (newOrder !== null) {
      setSortOrder(newOrder);
    }
  }
  
  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Questionnaires
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.questionnaires.length} questionnaires found
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
                onClick={handleAddQuestionnaire}
              >
                Add Questionnaire
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  function handleTabChange(index){
    Session.set('questionnairePageTabIndex', index);
  }
  function changeText(name, event, newValue){
    console.log('changeText', this, newValue)

    // Session.set('activeQuestionnaireName', newValue);
    // console.log('_id', get(this, 'data.currentQuestionnaire._id'))

    Questionnaires.update({_id: get(this, 'data.currentQuestionnaire._id')}, {$set: {
      'title': newValue
    }});
  }
  function onSend(id){
    let patient = QuestionnaireResponses.findOne({_id: id});

    console.log("QuestionnaireResponseTable.onSend()", patient);

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
  function saveQuestion(event, activeQuestionLinkId){
    console.log('Saving question to Questionnaire/', get(this, 'data.currentQuestionnaire._id'))
    console.log(' ')
    console.log('Going to try to add the following item: ');
    console.log(Session.get('questionnaireDesignerCurrentQuestion'));
    console.log(' ')
    console.log('ActiveQuestionLinkId', data.activeQuestionLinkId);
    console.log(' ')

    let currentItemsArray = get(this, 'data.currentQuestionnaire.item', []);
    console.log('Current questionnaire items:', currentItemsArray)

    let newItems = [];
    if(Array.isArray(currentItemsArray)){
      console.log('Iterating through current items')
      currentItemsArray.forEach(function(item){
        if(Session.equals('activeQuestionLinkId', item.linkId)){
          console.log('Found a match.  Using dirty state.')
          newItems.push(Session.get('questionnaireDesignerCurrentQuestion'));
        } else {
          console.log('No match.  Using the original.')
          newItems.push(item);
        }
      });
    }

    console.log('New items.  Adding to questionnaire.', newItems)
    Questionnaires.update({_id: get(this, 'data.currentQuestionnaire._id')}, {$set: {
      'item': newItems
    }})  
  }
  function addQuestion(event, bar, baz){
    console.log('Adding a question to Questionnaire/', get(this, 'data.currentQuestionnaire._id'))
    console.log(' ')
    console.log('Going to try to add the following item: ');
    console.log(Session.get('questionnaireDesignerCurrentQuestion'));
    console.log(' ')
    console.log('Output of current Questionnaire', get(this, 'data.currentQuestionnaire'))
    
    let itemsArray = get(this, 'data.currentQuestionnaire.item', []);
    let newItem = Session.get('questionnaireDesignerCurrentQuestion')
    
    if(itemsArray.length === 0){
      newItem.linkId = 1;
    } else {
      newItem.linkId = Random.id();
    }
    
    console.log(' ')
    console.log("This is the new item we've generated and will be attaching to the questionnaire: ", newItem)
    console.log(' ')

    Questionnaires.update({_id: get(this, 'data.currentQuestionnaire._id')}, {$addToSet: {
      'item': newItem
    }})    
  }
  function updateQuestionText(event, newValue){
    // console.log('record id', get(this, 'data.currentQuestionnaire._id'))
    console.log('updateQuestionText', newValue)

    let newQuestionState = Session.get('questionnaireDesignerCurrentQuestion');
    newQuestionState.text = newValue;

    Session.set('questionnaireDesignerCurrentQuestion', newQuestionState);
    console.log('newQuestionState', newQuestionState)
  }
  function handleSaveQuestionnaireResponse(){
    console.log('Posting questionnaire response to external system...')

    let newQuestionnaireResponse = {
      "resourceType": "QuestionnaireResponse",
      "meta": {
        "versionId": "1",
        "lastUpdated": "2020-05-12T14:58:42.196+00:00",
        "profile": [
          "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|2.7"
        ]
      },
      "questionnaire": "Questionnaire/d2ff1d83-f772-448c-b5df-04b66b5ef0f2",
      "status": "in-progress",
      "authored": new Date(),
      "subject": {
        "reference": "Patient/" + Random.id(),
        "type": "Patient"
      },
      "item": [{
        "linkId": "/food",
        "text": "Food",
        "item": [{
          "linkId": "/food/1",
          "text": "Within the past 12 months, did you worry that your food would run out before you got money to buy more?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }, {
          "linkId": "/food/2",
          "text": "Within the past 12 months, did the food you bought just not last and you didn’t have money to get more?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }]
      }, {
        "linkId": "/housing/utilities",
        "text": "Housing/Utilities",
        "item": [{
          "linkId": "/housing/utilities/3",
          "text": "Within the past 12 months, have you ever stayed: outside, in a car, in a tent, in an overnight shelter, or temporarily in someone else’s home (i.e. couch-surfing)?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }, {
          "linkId": "/housing/utilities/4",
          "text": "Are you worried about losing your housing?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }, {
          "linkId": "/housing/utilities/5",
          "text": "Within the past 12 months, have you been unable to get utilities (heat, electricity) when it was really needed?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }]
      }, {
        "linkId": "/transportation",
        "text": "Transportation",
        "item": [{
          "linkId": "/transportation/6",
          "text": "Within the past 12 months, has a lack of transportation kept you from medical appointments or from doing things needed for daily living?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }]
      },
      {
        "linkId": "/interpersonal safety",
        "text": "Interpersonal Safety",
        "item": [{
          "linkId": "/interpersonal safety/7",
          "text": "Do you feel physically or emotionally unsafe where you currently live?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }, {
          "linkId": "/interpersonal safety/8",
          "text": "Within the past 12 months, have you been hit, slapped, kicked or otherwise physically hurt by anyone?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }]
      },
      {
        "linkId": "/optional: immediate need",
        "text": "Optional: Immediate Need",
        "item": [{
          "linkId": "/optional: immediate need/10",
          "text": "Are any of your needs urgent? For example, you don’t have food for tonight, you don’t have a place to sleep tonight, you are afraid you will get hurt if you go home today.",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }, {
          "linkId": "/optional: immediate need/11",
          "text": "Would you like help with any of the needs that you have identified?",
          "answer": [{
            "valueBoolean": Random.choice([true, false])
          }]
        }
      ]}
    ]}

    Meteor.call('postRelay', 'https://nw-sf-dev-uses0-safr2-safhirapim.azure-api.net/grav/api/QuestionnaireResponse', Session.get('accountsAccessToken'), {
      payload: newQuestionnaireResponse
    }, function(error, response){
      if(error){
        console.error('error', error)
      }
      if(response){
        console.log('response', response)
      }
    })
  }



  let formFactor = LayoutHelpers.determineFormFactor(2);


  let layoutContent;
  if(data.questionnaires.length > 0){
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
        <QuestionnairesTable 
          id='questionnairesTable'
          questionnaires={data.questionnaires}
          count={data.questionnaires.length}
          selectedQuestionnaireId={data.selectedQuestionnaireId}                  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Questionnaires.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onRemoveRecord={function(questionnaireId){
            Questionnaires.remove({_id: questionnaireId})
          }}
          onRowClick={function(questionnaireId){
            console.log('QuestionnairesPage.onRowClick', questionnaireId);
            navigate('/questionnaires/' + questionnaireId);
          }}
          onSetPage={function(index){
            Session.set('QuestionnairesTable.questionnairesIndex', index)
          }}    
          page={data.questionnairesIndex}
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
            onClick={handleAddQuestionnaire}
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
            Add Your First Questionnaire
          </Button>
        </CardContent>
      </Card>
    </Box>
  }


  return (
    <Box 
      id="questionnairesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.questionnaires.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}


export default QuestionnairesPage;
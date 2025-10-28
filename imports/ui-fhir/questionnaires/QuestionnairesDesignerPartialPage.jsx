
import { 
  Select, 
  MenuItem,
  Card,
  CardContent, 
  CardHeader, 
  CardActions, 
  TextField, 
  Checkbox, 
  Button,
  Grid
} from '@mui/material';


import QuestionnaireDetail from './QuestionnaireDetail';
import QuestionnairesTable from './QuestionnairesTable';
import SortableQuestionnaire from './SortableQuestionnaire';
import LayoutHelpers from '../../lib/LayoutHelpers';

import PropTypes from 'prop-types';
import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { DynamicSpacer } from '../../ui/DynamicSpacer';
import { ValueSets } from '../../lib/schemas/SimpleSchemas/ValueSets';



let defaultQuestionnaire = {
  index: 2,
  id: '',
  username: '',
  email: '',
  given: '',
  family: '',
  gender: ''
};

//===========================================================================

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


// =========================================================================================================
// Main Component

export class QuestionnairesPage extends React.Component {
  getMeteorData() {
    let data = {
      style: {
        opacity: Session.get('globalOpacity'),
        tab: {
          borderBottom: '1px solid lightgray',
          borderRight: 'none'
        }
      },
      tabIndex: Session.get('questionnairePageTabIndex'),
      questionnaire: defaultQuestionnaire,
      questionnaireSearchFilter: '',
      currentQuestionnaire: null,
      questionnaireId: false,
      //sortableItems: ['Lorem ipsum?', 'Ipsum foo?', 'Dolar set et?'],
      enabled: Session.get('enableCurrentQuestionnaire'),
      chatbotInstalled: false,
      questionnaireName: '',
      questionnaireDesignerCurrentQuestion: {text: ''},
      questionnaireDesignerCurrentMultiChoice: {label: ''},
      isActive: false,
      isNumber: false,
      isSorting: Session.get('questionnaireIsSorting'),
      activeQuestionLinkId: Session.get('activeQuestionLinkId'),
      onePageLayout: true
    };

    if (Session.get('questionnaireFormData')) {
      data.questionnaire = Session.get('questionnaireFormData');
    }
    if (Session.get('questionnaireSearchFilter')) {
      data.questionnaireSearchFilter = Session.get('questionnaireSearchFilter');
    }
    if (Session.get("selectedQuestionnaire")) {
      console.log("data.questionnaireId", Session.get('data.questionnaireId'));

        data.currentQuestionnaire = Questionnaires.findOne({_id: Session.get('selectedQuestionnaire')});
        console.log("data.currentQuestionnaire", data.currentQuestionnaire);

        // if (get(data, 'selectedQuestionnaire.item')) {
        //   data.sortableItems = [];
        //   data.currentQuestionnaire.item.forEach(function(item){
        //     console.log('item', item)
        //     data.sortableItems.push(get(item, 'text'));              
        //   });
        // }

        if(get(data, 'currentQuestionnaire.status') === "active"){
          data.isActive = true;
        } else {
          data.isActive = false;
        }

        if(get(data, 'currentQuestionnaire.title')){
          data.questionnaireName = get(data, 'currentQuestionnaire.title');
        } else {
          data.questionnaireName = '';
        }
    }

    if(Session.get('activeQuestionLinkId')){
      console.log('ActiveQuestionLinkId was updated. Checking if it exists in the current questionnaire items.')
      if (Array.isArray(get(data, 'currentQuestionnaire.item'))) {
        data.currentQuestionnaire.item.forEach(function(item){
          if(Session.equals('activeQuestionLinkId', get(item, 'linkId', ''))){      
            console.log('Found.  Updating the question being edited.')
            data.questionnaireDesignerCurrentQuestion = item;
          }  
        });
      } 
    } 

    if (Session.get('questionnaireDesignerCurrentQuestion')) {
      console.log('Selected question not found.  Using dirty state.')
      data.questionnaireDesignerCurrentQuestion = Session.get('questionnaireDesignerCurrentQuestion');
    }

    console.log("QuestionnairesPage[data]", data);
    return data;
  }
  toggleSortStatus(){
    if(Session.equals('questionnaireIsSorting', true)){
      this.saveSortedQuestionnaire();
      Session.set('questionnaireIsSorting', false);
    } else {
      Session.set('questionnaireIsSorting', true);
    }    
  }
  toggleActiveStatus(event, newValue){
    //Session.toggle('enableCurrentQuestionnaire');
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

  handleTabChange(index){
    Session.set('questionnairePageTabIndex', index);
  }
  selectLanguage(){
    
  }
  onNewTab(){
    Session.set('selectedQuestionnaire', null);
    Session.set('questionnaireUpsert', false);
  }
  addChoice(){
    console.log('addChoice')
  }
  changeText(name, event, newValue){
    console.log('changeText', this, newValue)

    // Session.set('activeQuestionnaireName', newValue);
    // console.log('_id', get(this, 'data.currentQuestionnaire._id'))

    Questionnaires.update({_id: get(this, 'data.currentQuestionnaire._id')}, {$set: {
      'title': newValue
    }});
  }

  onSend(id){
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

  saveQuestion(event, activeQuestionLinkId){
    console.log('Saving question to Questionnaire/', get(this, 'data.currentQuestionnaire._id'))
    console.log(' ')
    console.log('Going to try to add the following item: ');
    console.log(Session.get('questionnaireDesignerCurrentQuestion'));
    console.log(' ')
    console.log('ActiveQuestionLinkId', this.data.activeQuestionLinkId);
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
  addQuestion(event, bar, baz){
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
  returnCurrentlySelectedQuestionItem(event){
    console.log('Returning currently selected Question Item')
    return '';
  }
  updateQuestionText(event, newValue){
    // console.log('record id', get(this, 'data.currentQuestionnaire._id'))
    console.log('updateQuestionText', newValue)

    let newQuestionState = Session.get('questionnaireDesignerCurrentQuestion');
    newQuestionState.text = newValue;

    Session.set('questionnaireDesignerCurrentQuestion', newQuestionState);
    console.log('newQuestionState', newQuestionState)
  }
  saveSortedQuestionnaire(){
    // Session.set('editedQuestionnaire', {
    //   questionnaireId: Session.get('selectedQuestionnaire'),
    //   items: this.state.items
    // })

    let editedQuestionnaire = Session.get('editedQuestionnaire');
    let currentQuestionnaire = Questionnaires.findOne(get(editedQuestionnaire, 'questionnaireId'));

    let updatedItemArray = [];

    if(editedQuestionnaire){
      if(Array.isArray(editedQuestionnaire.items)){
        editedQuestionnaire.items.forEach(function(editedItem){
          console.log('editedItem', editedItem)
          
          currentQuestionnaire.item.forEach(function(currentItem){
            console.log('currentItem', currentItem)
            if(editedItem.text === currentItem.text){
              console.log('found match; pushing')
              updatedItemArray.push(currentItem);
            }        
          });
        });
      }
  
      console.log('Current  questionnaire item array: ', currentQuestionnaire.item);
      console.log('Proposed questionnaire item array: ', updatedItemArray);
  
      let count = 0;
      updatedItemArray.forEach(function(item){
        if(count === 0){
          item.linkId = 1;
        } else {
          item.linkId = Random.id()
        }
        count++;
      })  
  
      console.log('Renormalized linkIds: ', updatedItemArray);
  
      if(get(editedQuestionnaire, 'questionnaireId')){
        Questionnaires.update({_id: get(editedQuestionnaire, 'questionnaireId')}, {$set: {
          item: updatedItemArray
        }})
        Session.set('questionnaireIsSorting', false)
      }      
    }
  }
  render() {
    console.log('React.version: ' + React.version);

    let headerHeight = LayoutHelpers.calcHeaderHeight();

    let isActiveLabel = 'Active';

    if(this.data.isActive){
      isActiveLabel = 'Active';
    } else {
      isActiveLabel = 'Inactive';
    }

    return (
    
        
          <Grid container>
            <Grid item md={4} marins={20} style={{position: 'sticky', top: '0px'}}>
              <Card height="auto" margins={20}>
                <CardHeader
                  title="Questionnaires"
                />
                <QuestionnairesTable 
                  hideCheckboxes={true}
                  hideIdentifier={true}
                  onRemoveRecord={function(questionnaireId){
                    Questionnaires.remove({_id: questionnaireId})
                  }}
                />
              </Card>
            </Grid>
            <Grid item md={4}>
              <CardHeader 
                title='Add Questions' 
                />

              <Card margins={20}>
                <CardHeader subtitle='Basic Question' />
                <CardContent>
                  <TextField
                    hintText="Lorem ipsum?"
                    errorText="Question text as it should be displayed."
                    type='text'
                    value={ get(this, 'data.questionnaireDesignerCurrentQuestion.text') }
                    onChange={ this.updateQuestionText.bind(this) }
                    fullWidth />
                  <br />
                  <TextField
                    errorText="Multiplicity"
                    defaultValue={1}
                    type='number'
                    />
                </CardContent>
                <CardActions>
                  <Button id='multilineButton' primary={ this.data.isMultiline } >Multiline</Button>
                  <Button id='numericalButton' primary={ this.data.isNumber } >Numerical</Button>
                  <Button id='addQuestionButton' onClick={ this.addQuestion.bind(this)} style={{float: 'right'}} >Add</Button>
                  <Button id='saveQuestionButton' onClick={ this.saveQuestion.bind(this, this.data.activeQuestionLinkId)} style={{float: 'right'}} >Save</Button>
                </CardActions>
              </Card>
              <DynamicSpacer />

              <Card margins={20}>
                <CardHeader subtitle='Multiple Choice Question' />
                <CardContent>
                  <TextField
                    id='multipleChoiceQuestionTitle'
                    hintText="Lorem ipsum...."
                    errorText="Multiple Choice Question"
                    type='text'
                    fullWidth />
                  <TextField
                    hintText="Multiple Choice"
                    errorText="New Choice"
                    type='text'
                    style={{paddingLeft: '20px'}}
                    fullWidth />
                    <DynamicSpacer />
                  <Button onClick={this.addChoice} style={{margin: '20px'}}>Add Choice</Button>
                </CardContent>
                <CardActions>
                  <Button id='addMultipleChoice'>Add</Button>
                </CardActions>
              </Card>
              <DynamicSpacer />
              

              <Card margins={20}>
                <CardHeader subtitle='Question Response' />
                <CardContent>
                  <Checkbox
                    label="Response Behavior"
                    toggled={ this.data.isActive }
                  />
                </CardContent>
                <CardActions>
                  <Button id='addMultipleChoice'>Add</Button>
                </CardActions>
              </Card>
              <DynamicSpacer />

              <Card margins={20}>
                <CardHeader subtitle='Display' />
                <CardContent>
                  <TextField
                    id='linkUrl'
                    hintText="http://bit.ly/12345"
                    errorText="Link URL"
                    type='text'
                    style={{paddingLeft: '20px'}}
                    fullWidth />
                </CardContent>
                <CardActions>
                  <Button id='addMultipleChoice'>Add</Button>
                </CardActions>
              </Card>
              <DynamicSpacer />


            </Grid>
            <Grid item md={4} style={{position: 'sticky', top: '0px'}}>
              <CardHeader 
                title='Preview' 
                />
              <Card margins={20}>
                <CardContent>
                  <TextField
                    hintText="Questionnaire - My Custom Name"
                    errorText="Please enter a title for your questionnaire."
                    type='text'
                    value={ get(this, 'data.questionnaireName') }
                    onChange={ this.changeText.bind(this, 'name')}
                    fullWidth />
                    <br />
                </CardContent>
                <CardActions>
                  <Button id='isActiveButton' onClick={this.toggleActiveStatus.bind(this)} primary={ this.data.isActive } >{isActiveLabel}</Button>
                  <Button id='isSortingButton' onClick={this.toggleSortStatus.bind(this)} primary={ this.data.isSorting } >Sort</Button>
                </CardActions>
              </Card>
              <DynamicSpacer />

              <Card margins={20}>
                <CardContent>
                  <QuestionnaireDetail id='questionnaireDetails' currentQuestionnaire={this.data.currentQuestionnaire} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        
    
    );
  }
}


export default QuestionnairesPage;
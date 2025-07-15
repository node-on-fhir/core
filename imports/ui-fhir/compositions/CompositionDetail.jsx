

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Tab, 
  Tabs,
  Typography,
  TextField,
  DatePicker,
  Box
} from '@mui/material';

import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { get, set } from 'lodash';
import { Icon } from 'react-icons-kit'
import {users} from 'react-icons-kit/fa/users'



//===========================================================================
// THEMING

let Theming;
Meteor.startup(function(){
  Theming = Meteor.Theming;
})

//===========================================================================
// MAIN COMPONENT

export function CompositionDetail(props){

  let {
    children,
    composition,
    compositionId
  } = props;
 
  function renderDatePicker(displayDatePicker, effectiveDateTime){
    //console.log('renderDatePicker', displayDatePicker, effectiveDateTime)
    if(typeof effectiveDateTime === "string"){
      effectiveDateTime = moment(effectiveDateTime);
    }
    // if (displayDatePicker) {
    //   return (
    //     <DatePicker 
    //       name='effectiveDateTime'
    //       hintText={ setHint("Date of Administration") } 
    //       container="inline" 
    //       mode="landscape"
    //       value={ effectiveDateTime ? effectiveDateTime : null}    
    //       onChange={ this.changeState.bind(this, 'effectiveDateTime')}      
    //       fullWidth
    //     />
    //   );
    // }
  }
  function setHint(text){
    if(props.showHints !== false){
      return text;
    } else {
      return '';
    }
  }

  return(
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={props.compositionId ? 'Edit Composition' : 'New Composition'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          <Grid container spacing={3}>
        <Grid item xs={6}>
          <TextField
            id='subjectDisplayInput'                
            name='subjectDisplay'
            label='Subject Name'
            value={get(composition, 'subject.display')}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            /><br/>
        </Grid>
        <Grid item xs={6}>
          <TextField
            id='subjectIdInput'                
            name='subjectReference'
            label='Subject ID'
            value={get(composition, 'subject.reference')}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            /><br/>
        </Grid>
        <Grid item xs={6}>
          <TextField
            id='titleInput'                
            name='title'
            label='Title'
            value={get(composition, 'title')}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            /><br/>
        </Grid>
        <Grid item xs={3}>
          <TextField
            id='statusInput'                
            name='status'
            label='Status'
            value={get(composition, 'status')}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            /><br/>
        </Grid>
        <Grid item xs={3}>
          <TextField
            id='categoryTextInput'                
            name='category'
            label='Category'
            value={get(composition, 'category[0].display')}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            /><br/>
        </Grid>
        <Grid item xs={3}>
          <TextField
            id='encounterReferenceInput'                
            name='encounterReference'
            label='Encounter Reference'
            value={get(composition, 'encounter.reference')}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            /><br/>
        </Grid>
        <Grid item xs={3}>
          <TextField
            id='encounterInput'                
            name='encounter'
            label='Encounter'
            value={get(composition, 'encounter.display')}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            /><br/>
        </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          {props.compositionId ? (
            <>
              <Button variant="contained" color="primary" onClick={props.onUpsert} sx={{ mr: 2 }}>Save</Button>
              <Button variant="outlined" color="error" onClick={props.onRemove}>Delete</Button>
            </>
          ) : (
            <Button variant="contained" color="primary" onClick={props.onInsert}>Create</Button>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

CompositionDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  compositionId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  composition: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default CompositionDetail;
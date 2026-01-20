import { 
    Checkbox, 
    Table, 
    TableRow, 
    TableCell,
    TableBody
  } from '@mui/material';
  
//   import { FaTags, FaCode, FaPuzzlePiece, FaLock  } from 'react-icons/fa';
//   import { GoTrashcan } from 'react-icons/go'
  
  import React from 'react';
  import { useTracker } from 'meteor/react-meteor-data';
  import { get } from 'lodash';
  import PropTypes from 'prop-types';

  import { FhirDehydrator } from '../../lib/FhirDehydrator';



  export function ActivitiesTable(props){
    let data = {
        activities: []
    }

    //---------------------------------------------
    // Trackers

    data.activities = useTracker(function(){
        return [];
    }, [])

    //---------------------------------------------
    // Helper Functions

    function rowClick(id){
        Session.set('activitiesUpsert', false);
        Session.set('selectedGoalId', id);
        Session.set('goalPageTabIndex', 2);
      };
    function removeRecord(_id){
        console.log('Remove goal ', _id)
        if(props.onRemoveRecord){
          props.onRemoveRecord(_id);
        }
      }
    function showSecurityDialog(goal){
        console.log('showSecurityDialog', goal)
    
        Session.set('securityDialogResourceJson', goal);
        Session.set('securityDialogResourceType', 'Goal');
        Session.set('securityDialogResourceId', get(goal, '_id'));
        Session.set('securityDialogOpen', true);
    }

    //---------------------------------------------
    // Render Functions

    function renderCheckboxsHeader(){
        if (!props.hideCheckbox) {
          return (
            <TableCell className="Checkbox"></TableCell>
          );
        }
      }
    function renderCheckboxs(patientId ){
        if (!props.hideCheckbox) {
          return (
            <TableCell className="Checkbox">
                <Checkbox
                  defaultChecked={true}
                />
              </TableCell>
          );
        }
      }
    function renderIdentifierHeader(){
        if (!props.hideIdentifier) {
          return (
            <TableCell className="identifier">Identifier</TableCell>
          );
        }
      }
    function renderIdentifier(activities ){
        if (!props.hideIdentifier) {
          
          return (
            <TableCell className='identifier'>{ get(activities, 'identifier[0].value') }</TableCell>       );
        }
      }
    function renderActionIconsHeader(){
        if (!props.hideActionIcons) {
          return (
            <TableCell className='actionIcons' style={{minWidth: '120px'}}>Actions</TableCell>
          );
        }
      }
    function renderActionIcons(goal){
        if (!props.hideActionIcons) {
    
          // let warningStyle = {
          //   marginLeft: '4px', 
          //   marginRight: '4px', 
          //   marginTop: '4px', 
          //   fontSize: '120%%',
          //   opacity: 0
          // }
    
          let iconStyle = {
            marginLeft: '4px', 
            marginRight: '4px', 
            marginTop: '4px', 
            fontSize: '120%'
          }
    
    
          return (
            <TableCell className='actionIcons' style={{minWidth: '120px', marginTop: '2px'}}>
              {/* <IoIosWarning style={warningStyle} onClick={showSecurityDialog.bind(this, goal)} /> */}
              {/* <FaTags style={iconStyle} onClick={showSecurityDialog.bind(this, goal)} />
              <GoTrashcan style={iconStyle} onClick={removeRecord.bind(this, goal._id)} />   */}
            </TableCell>
          );
        }
      } 


    //---------------------------------------------
    // Render Method

    let tableRows = [];
    for (var i = 0; i < data.activities.length; i++) {
      var newRow = {
        description: '',
        priority: '',
        status: ''
      };

      if(get(data.activities[i], 'description')){
        newRow.description = get(data.activities[i], 'description');
      }
      if(get(data.activities[i], 'priority.text')){
        newRow.priority = get(data.activities[i], 'priority.text');
      } else if(get(data.activities[i], 'priority')){
        newRow.priority = String(get(data.activities[i], 'priority'));
      }
      if(get(data.activities[i], 'status')){
        newRow.status = get(data.activities[i], 'status');
      }

      newRow.identifier = get(data.activities[i], 'identifier[0].value');

      let rowStyle = {
        cursor: 'pointer'
      }
      if(get(data.activities[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }

      tableRows.push(
        <TableRow key={i} className="goalRow" style={rowStyle} onClick={ rowClick.bind('this', data.activities[i]._id)} >
          { renderCheckboxs(data.activities[i]) }
          { renderActionIcons(data.activities[i]) }
          { renderIdentifier(data.activities[i]) }

          <TableCell className='description'>{ newRow.description }</TableCell>
          <TableCell className='priority'>{ newRow.priority }</TableCell>
          <TableCell className='status'>{ newRow.status }</TableCell>
        </TableRow>
      )
    }

    return(
      <Table id='ActivitiesTable' hover >
        {/* <TableHeader>
          <TableRow>
            { renderCheckboxsHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            <TableCell className='description'>Description</TableCell>
            <TableCell className='priority'>Priority</TableCell>
            <TableCell className='status'>Status</TableCell>             
          </TableRow>
        </TableHeader>
        <TableBody>
          { tableRows }
        </TableBody> */}
      </Table>
    );
  }
  
  
  ActivitiesTable.propTypes = {
    data: PropTypes.array,
    query: PropTypes.object,
    paginationLimit: PropTypes.number,
    hideIdentifier: PropTypes.bool,
    hideCheckbox: PropTypes.bool,
    hideActionIcons: PropTypes.bool,
    onRemoveRecord: PropTypes.func,
    onSetPage: PropTypes.func,

    page: PropTypes.number,
  
  };

  export default ActivitiesTable;
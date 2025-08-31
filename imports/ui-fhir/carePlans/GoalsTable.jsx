// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/carePlans/GoalsTable.jsx
import React, { useState } from 'react';
import { 
    Checkbox, 
    Table, 
    TableRow, 
    TableCell,
    TableBody,
    TableHead,
    TablePagination
  } from '@mui/material';
  import { useTracker } from 'meteor/react-meteor-data';
  import { get, has, concat, cloneDeep, findIndex, pullAt } from 'lodash';
  import PropTypes from 'prop-types';

  import { FhirDehydrator, FhirUtilities } from '../../lib/FhirDehydrator';
  import { Session } from 'meteor/session';

  // Set up a simple logger if not available
  const logger = {
    trace: console.trace ? console.trace.bind(console) : console.log.bind(console)
  };

  export function GoalsTable(props){


    let { 
      goals,           
      selectedGoalId,
      selectedIds,

      dateFormat,
      showMinutes,

      hideIdentifier,
      hideCheckboxes,
      hideActionIcons,
      hideDescription,
      hidePriority,
      hideLifecycleStatus,
      hideAchievementStatus,
      hideSubjectName,
      hideSubjectReference,

      onRowClick,
      onRemoveRecord,
      onActionButtonClick,
      showActionButton,
      actionButtonLabel,

      query,
      paginationLimit,
      disablePagination,
      rowsPerPage,
      tableRowSize,

      count,
      formFactorLayout,

      page,
      onSetPage,

      children 
    } = props;

    let [ selectedRowIds, setSelectedRowIds ] = useState(selectedIds);

    // console.log('GoalsTable.tableRowSize', tableRowSize)
      
    //---------------------------------------------
    // Trackers

    // goals = useTracker(function(){
    //     return Goals.find().fetch();
    // }, [])

    //---------------------------------------------
    // Helper Functions

    function rowClick(id){
        Session.set('goalsUpsert', false);
        Session.set('selectedGoalId', id);
        Session.set('goalPageTabIndex', 2);
      };
    function removeRecord(_id){
        console.log('Remove goal ', _id)
        if(onRemoveRecord){
          onRemoveRecord(_id);
        }
      }
    function showSecurityDialog(goal){
        console.log('showSecurityDialog', goal)
    
        Session.set('securityDialogResourceJson', goal);
        Session.set('securityDialogResourceType', 'Goal');
        Session.set('securityDialogResourceId', get(goal, '_id'));
        Session.set('securityDialogOpen', true);
    }
    function handleToggle(index, objectId){
      // console.log('Toggling entry', index, objectId)

      let clonedRowIds = cloneDeep(selectedRowIds);
      // console.log('handleToggle().clonedRowIds', selectedRowIds)


      let trimmedRowIds = [];
      if(Array.isArray(clonedRowIds)){
        let undefinedIndex = findIndex(clonedRowIds, function(o) {
          if(typeof o !== "undefined"){
            trimmedRowIds.push(o);
          }
        });
      }
      // console.log('handleToggle().trimmedRowIds', trimmedRowIds)

      let rowId = trimmedRowIds.indexOf(objectId);
      // console.log('handleToggle().rowId', rowId)

      let resultingRowIds = cloneDeep(trimmedRowIds);
      if(rowId > -1){
        pullAt(resultingRowIds, rowId);
      } else {
        resultingRowIds.push(objectId);
      };
      // console.log('handleToggle().resultingRowIds', resultingRowIds)

      setSelectedRowIds(resultingRowIds);      

      if(props.onToggle){
        props.onToggle(resultingRowIds);
      }
    }


    //---------------------------------------------
    // Render Functions

    function renderCheckboxesHeader(){
        if (!hideCheckboxes) {
          return (
            <TableCell className="Checkbox" style={{width: '60px', padding: '0px'}} ></TableCell>
          );
        }
      }
    function renderCheckboxes(index, objectId){
        if (!hideCheckboxes) {
          return (
            <TableCell className="Checkbox" style={{width: '60px', padding: '0px'}}>
                <Checkbox 
                  defaultChecked={false} 
                  onChange={ handleToggle.bind(this, index, objectId)} 
                  
                />
              </TableCell>
          );
        }
      }
    function renderDescriptionHeader(){
        if (!hideDescription) {
          return (
            <TableCell className="description">Description</TableCell>
          );
        }
      }
    function renderDescription(description ){
        if (!hideDescription) {
          
          return (
            <TableCell className='description'>{ description }</TableCell>       );
        }
      }
    function renderPriorityHeader(){
      if (!hidePriority) {
        return (
          <TableCell className="priority">Priority</TableCell>
        );
      }
    }
    function renderPriority(priority ){
      if (!hidePriority) {
        
        return (
          <TableCell className='priority'>{ priority }</TableCell>       );
      }
    }
    function renderLifecycleStatusHeader(){
      if (!hideLifecycleStatus) {
        return (
          <TableCell className="status">Status</TableCell>
        );
      }
    }
    function renderLifecycleStatus(status ){
      if (!hideLifecycleStatus) {
        
        return (
          <TableCell className='status'>{ status }</TableCell>       );
      }
    }
    function renderAchievementStatusHeader(){
      if (!hideAchievementStatus) {
        return (
          <TableCell className="achievementStatus">Achievement</TableCell>
        );
      }
    }
    function renderAchievementStatus(achievementStatus ){
      if (!hideAchievementStatus) {
        
        return (
          <TableCell className='achievementStatus'>{ achievementStatus }</TableCell>       );
      }
    }
    function renderIdentifierHeader(){
        if (!hideIdentifier) {
          return (
            <TableCell className="identifier">Identifier</TableCell>
          );
        }
    }
    function renderIdentifier(identifier ){
        if (!hideIdentifier) {
          
          return (
            <TableCell className='identifier'>{ identifier }</TableCell>       );
        }
    }
    function renderActionIconsHeader(){
        if (!hideActionIcons) {
          return (
            <TableCell className='actionIcons' style={{minWidth: '120px'}}>Actions</TableCell>
          );
        }
    }
    function renderActionIcons(goal){
        if (!hideActionIcons) {    

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
    function renderSubjectNameHeader(){
      if (!hideSubjectName) {
        return (
          <TableCell className='subjectDisplay'>Subject</TableCell>
        );
      }
    }
    function renderSubjectName(subjectDisplay ){
      if (!hideSubjectName) {
        return (
          <TableCell className='subjectDisplay' style={{minWidth: '140px'}}>{ subjectDisplay }</TableCell>
        );
      }
    }
    function renderSubjectReferenceHeader(){
      if (!hideSubjectReference) {
        return (
          <TableCell className='subjectReference'>Subject Reference</TableCell>
        );
      }
    }
    function renderSubjectReference(subjectReference ){
      if (!hideSubjectReference) {
        return (
          <TableCell className='subjectReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
            { FhirUtilities.pluckReferenceId(subjectReference) }
          </TableCell>
        );
      }
    }



  //---------------------------------------------------------------------
  // Pagination

  let rows = [];
  // const [page, setPage] = useState(0);
  // const [rowsPerPage, setRowsPerPage] = useState(rowsPerPage);


  let paginationCount = 101;
  if(count){
    paginationCount = count;
  } else {
    paginationCount = rows.length;
  }

  function handleChangePage(event, newPage){
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  }


  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      // rowsPerPageOptions={[5, 10, 25, 100]}
      rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      style={{float: 'right', border: 'none'}}
    />
  }



    let tableRows = [];
    let goalsToRender = [];
    let internalDateFormat = "YYYY-MM-DD";

    if(showMinutes){
      internalDateFormat = "YYYY-MM-DD hh:mm";
    }
    if(internalDateFormat){
      internalDateFormat = dateFormat;
    }

    if(goals){
      if(goals.length > 0){              
        let count = 0;  

        goals.forEach(function(goal){
          if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
            let newRow = {
                _id: get(goal, '_id', ''),
                identifier: get(goal, 'identifier[0].value', ''),
                description: get(goal, 'description.text', ''),
                priority: get(goal, 'priority.text', ''),
                lifecycleStatus: get(goal, 'lifecycleStatus', ''),
                achievementStatus: get(goal, 'achievementStatus.coding[0].display', ''),
                subjectReference: get(goal, 'subject.reference', ''),
                subjectDisplay: get(goal, 'subject.reference', '')
              };
            goalsToRender.push(newRow);
          }
          count++;
        }); 
      }
    }

  //---------------------------------------------
  // Render Method

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }
  if(goalsToRender.length === 0){
    logger.trace('GoalsTable:  No Goals to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < goalsToRender.length; i++) {

      let selected = false;
      if(goalsToRender[i]._id === selectedGoalId){
        selected = true;
      }
      if(get(goalsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }


      tableRows.push(
        <TableRow key={i} className="goalRow"  hover={true}  style={rowStyle} onClick={ rowClick.bind(this, goalsToRender[i]._id)} selected={selected} >
          { renderCheckboxes(i, goalsToRender[i]._id) }
          { renderActionIcons(goalsToRender[i]._id) }
          { renderIdentifier(goalsToRender[i].identifier) }
          { renderDescription(goalsToRender[i].description) }
          { renderPriority(goalsToRender[i].priority) }
          { renderLifecycleStatus(goalsToRender[i].lifecycleStatus) }
          { renderAchievementStatus(goalsToRender[i].achievementStatus) }
          { renderSubjectName(goalsToRender[i].subjectDisplay ) } 
          { renderSubjectReference(goalsToRender[i].subjectReference ) }    
        </TableRow>
      )
    }
  }


    return(
      <Table id='goalsTable' >
        <TableHead>
          <TableRow style={rowStyle}>
            { renderCheckboxesHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderDescriptionHeader() }
            { renderPriorityHeader() }
            { renderLifecycleStatusHeader() }      
            { renderAchievementStatusHeader() }      
            { renderSubjectNameHeader() }
            { renderSubjectReferenceHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
    );
  }
  
  
  GoalsTable.propTypes = {
    goals: PropTypes.array,
    selectedGoalId: PropTypes.string,
    selectedIds: PropTypes.array,

    query: PropTypes.object,
    paginationLimit: PropTypes.number,
    rowsPerPage: PropTypes.number,
    dateFormat: PropTypes.string,
    showMinutes: PropTypes.bool,
    
    hideIdentifier: PropTypes.bool,
    hideCheckboxes: PropTypes.bool,
    hideActionIcons: PropTypes.bool,
    hideDescription: PropTypes.bool,
    hidePriority: PropTypes.bool,
    hideLifecycleStatus: PropTypes.bool,
    hideAchievementStatus: PropTypes.bool,
    hideSubjectName: PropTypes.bool,
    hideSubjectReference: PropTypes.bool,
    onRemoveRecord: PropTypes.func,
    onToggle: PropTypes.func,
    onSetPage: PropTypes.func,

    page: PropTypes.number,
    count: PropTypes.number,
    tableRowSize: PropTypes.string,
    formFactorLayout: PropTypes.string
  };

  GoalsTable.defaultProps = {
    tableRowSize: 'medium',
    rowsPerPage: 5,
    dateFormat: "YYYY-MM-DD hh:mm:ss",
    goals: [],
    selectedIds: [],
    query: {},
    paginationLimit: 100,
    hideIdentifier: false,
    hideCheckboxes: false,
    hideActionIcons: false,
    hideDescription: false,
    hidePriority: false,
    hideLifecycleStatus: false,
    hideAchievementStatus: false,
    hideSubjectName: false,
    hideSubjectReference: false
  };

  export default GoalsTable;
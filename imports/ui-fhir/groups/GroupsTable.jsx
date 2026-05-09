// imports/ui-fhir/groups/GroupsTable.jsx

import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer
} from '@mui/material';

import { get } from 'lodash';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

//=============================================================================================================================================
// LOGGER

const logger = {
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
  data: console.log.bind(console),
  verbose: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

//=============================================================================================================================================
// MAIN COMPONENT

function GroupsTable(props){
  let {
    groups = [],
    hideCheckbox = true,
    hideBarcode = true,
    hideFhirId = true,
    hideType = false,
    hideActual = true,
    hideName = false,
    hideDescription = true,
    hideQuantity = true,
    hideMemberCount = false,
    hideManagingEntity = true,
    hideActive = false,
    onRowClick,
    count,
    formFactor
  } = props;

  // Form factor adjustments
  let hideCheckboxFromProp = hideCheckbox;
  let hideBarcodeFromProp = hideBarcode;
  let hideFhirIdFromProp = hideFhirId;
  let hideTypeFromProp = hideType;
  let hideActualFromProp = hideActual;
  let hideNameFromProp = hideName;
  let hideDescriptionFromProp = hideDescription;
  let hideQuantityFromProp = hideQuantity;
  let hideMemberCountFromProp = hideMemberCount;
  let hideManagingEntityFromProp = hideManagingEntity;
  let hideActiveFromProp = hideActive;

  switch (formFactor) {
    case "phone":
      hideBarcode = true;
      hideFhirId = true;
      hideActual = true;
      hideDescription = true;
      hideQuantity = true;
      hideMemberCount = true;
      hideManagingEntity = true;
      break;
    case "tablet":
      hideBarcode = true;
      hideFhirId = true;
      hideActual = true;
      hideDescription = true;
      hideManagingEntity = true;
      break;
    case "web":
      hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      hideFhirId = (hideFhirIdFromProp !== undefined) ? hideFhirIdFromProp : true;
      hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
      hideActual = (hideActualFromProp !== undefined) ? hideActualFromProp : true;
      hideName = (hideNameFromProp !== undefined) ? hideNameFromProp : false;
      hideDescription = (hideDescriptionFromProp !== undefined) ? hideDescriptionFromProp : true;
      hideQuantity = (hideQuantityFromProp !== undefined) ? hideQuantityFromProp : true;
      hideMemberCount = (hideMemberCountFromProp !== undefined) ? hideMemberCountFromProp : false;
      hideManagingEntity = (hideManagingEntityFromProp !== undefined) ? hideManagingEntityFromProp : true;
      hideActive = (hideActiveFromProp !== undefined) ? hideActiveFromProp : false;
      break;
    case "desktop":
      hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      hideFhirId = (hideFhirIdFromProp !== undefined) ? hideFhirIdFromProp : true;
      hideType = false;
      hideActual = false;
      hideName = false;
      hideDescription = false;
      hideQuantity = false;
      hideMemberCount = false;
      hideManagingEntity = false;
      hideActive = false;
      break;
  }

  // Dehydrate and build rows
  let groupsToRender = [];
  if(Array.isArray(groups)){
    groups.forEach(function(group){
      groupsToRender.push(FhirDehydrator.dehydrateGroup(group));
    });
  }

  // Render functions
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return <TableCell className='barcode'>System ID</TableCell>;
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return <TableCell><span className="barcode">{idString}</span></TableCell>;
    }
  }

  function renderFhirIdHeader(){
    if (!hideFhirId) {
      return <TableCell className='fhirId'>FHIR ID</TableCell>;
    }
  }
  function renderFhirId(id){
    if (!hideFhirId) {
      return <TableCell className='fhirId'>{id}</TableCell>;
    }
  }

  function renderNameHeader(){
    if (!hideName) {
      return <TableCell className='name'>Name</TableCell>;
    }
  }
  function renderName(name){
    if (!hideName) {
      return <TableCell className='name'>{name}</TableCell>;
    }
  }

  function renderTypeHeader(){
    if (!hideType) {
      return <TableCell className='type'>Type</TableCell>;
    }
  }
  function renderType(type){
    if (!hideType) {
      return <TableCell className='type'>{type}</TableCell>;
    }
  }

  function renderActiveHeader(){
    if (!hideActive) {
      return <TableCell className='active'>Active</TableCell>;
    }
  }
  function renderActive(active){
    if (!hideActive) {
      return <TableCell className='active'>{active ? 'Yes' : 'No'}</TableCell>;
    }
  }

  function renderActualHeader(){
    if (!hideActual) {
      return <TableCell className='actual'>Actual</TableCell>;
    }
  }
  function renderActual(actual){
    if (!hideActual) {
      return <TableCell className='actual'>{actual ? 'Yes' : 'No'}</TableCell>;
    }
  }

  function renderDescriptionHeader(){
    if (!hideDescription) {
      return <TableCell className='description'>Description</TableCell>;
    }
  }
  function renderDescription(description){
    if (!hideDescription) {
      return <TableCell className='description'>{description}</TableCell>;
    }
  }

  function renderQuantityHeader(){
    if (!hideQuantity) {
      return <TableCell className='quantity'>Quantity</TableCell>;
    }
  }
  function renderQuantity(quantity){
    if (!hideQuantity) {
      return <TableCell className='quantity'>{quantity}</TableCell>;
    }
  }

  function renderMemberCountHeader(){
    if (!hideMemberCount) {
      return <TableCell className='memberCount'>Members</TableCell>;
    }
  }
  function renderMemberCount(memberCount){
    if (!hideMemberCount) {
      return <TableCell className='memberCount'>{memberCount}</TableCell>;
    }
  }

  function renderManagingEntityHeader(){
    if (!hideManagingEntity) {
      return <TableCell className='managingEntity'>Managing Entity</TableCell>;
    }
  }
  function renderManagingEntity(managingEntity){
    if (!hideManagingEntity) {
      return <TableCell className='managingEntity'>{managingEntity}</TableCell>;
    }
  }

  // Build rows
  let rows = [];
  for (let i = 0; i < groupsToRender.length; i++) {
    const currentGroup = groupsToRender[i];
    const groupId = currentGroup._id;

    rows.push(
      <TableRow
        key={groupId}
        onClick={function(){ if(onRowClick){ onRowClick(groupId); } }}
        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
      >
        {renderBarcode(currentGroup._id)}
        {renderFhirId(currentGroup.id)}
        {renderName(currentGroup.name)}
        {renderType(currentGroup.type)}
        {renderActive(currentGroup.active)}
        {renderActual(currentGroup.actual)}
        {renderDescription(currentGroup.description)}
        {renderQuantity(currentGroup.quantity)}
        {renderMemberCount(currentGroup.memberCount)}
        {renderManagingEntity(currentGroup.managingEntity)}
      </TableRow>
    );
  }

  return (
    <TableContainer>
      <Table id="groupsTable" size="medium">
        <TableHead>
          <TableRow>
            {renderBarcodeHeader()}
            {renderFhirIdHeader()}
            {renderNameHeader()}
            {renderTypeHeader()}
            {renderActiveHeader()}
            {renderActualHeader()}
            {renderDescriptionHeader()}
            {renderQuantityHeader()}
            {renderMemberCountHeader()}
            {renderManagingEntityHeader()}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default GroupsTable;

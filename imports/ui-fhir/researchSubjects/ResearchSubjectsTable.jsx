// /imports/ui-fhir/researchSubjects/ResearchSubjectsTable.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { 
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  Chip
} from '@mui/material';

import moment from 'moment';
import { get, reverse } from 'lodash';

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

// Create a logger object with all required methods
const logger = {
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
  data: console.log.bind(console),
  verbose: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

//===========================================================================
// MAIN COMPONENT

function ResearchSubjectsTable(props){
  logger.info('Rendering the ResearchSubjectsTable');

  let { 
    id,
    children, 

    data,
    researchSubjects,
    selectedResearchSubjectId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideSubject,
    hideSubjectReference,
    hideStudy,
    hideStatus,
    hideAssignedArm,
    hideActualArm,
    hidePeriod,
    hideConsent,
    hideBarcode,
    hideTextIcon,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton,
    actionButtonLabel,
  
    autoColumns,
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    hideEnteredInError,
    formFactorLayout,
    count,
    labels,

    defaultCheckboxValue,

    page,
    onSetPage,
    
    order,

    ...otherProps 
  } = props;


  // ------------------------------------------------------------------------
  // Form Factors
  
  let multiline = false;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideSubject = false;
        hideSubjectReference = true;
        hideStudy = true;
        hideStatus = false;
        hideAssignedArm = true;
        hideActualArm = true;
        hidePeriod = true;
        hideConsent = true;
        hideBarcode = true;  
        multiline = true;
        hideTextIcon = false
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideSubject = false;
        hideSubjectReference = true;
        hideStudy = false;
        hideStatus = false;
        hideAssignedArm = true;
        hideActualArm = true;
        hidePeriod = false;
        hideConsent = true;
        hideBarcode = false;   
        multiline = false;
        hideTextIcon = false
        break;
      case "web":
        hideSubject = false;
        hideStudy = false;
        hideStatus = false;
        hideAssignedArm = true;
        hideActualArm = true;
        hidePeriod = false;
        hideConsent = true;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = false
        break;
      case "desktop":
        hideSubject = false;
        hideStudy = false;
        hideStatus = false;
        hideAssignedArm = false;
        hideActualArm = false;
        hidePeriod = false;
        hideConsent = true;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideSubject = false;
        hideStudy = false;
        hideStatus = false;
        hideAssignedArm = false;
        hideActualArm = false;
        hidePeriod = false;
        hideConsent = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;            
    }
  }

  // Set defaults
  rowsPerPage = rowsPerPage || 5;
  dateFormat = dateFormat || "YYYY-MM-DD";
  hideCheckbox = hideCheckbox || true;
  hideActionIcons = hideActionIcons || true;
  hideActionButton = hideActionButton || true;
  hideBarcode = hideBarcode || true;
  hideSubjectReference = hideSubjectReference || true;
  hideConsent = hideConsent || true;
  
  // Pagination
  let rows = [];
  const [rowsPerPageToRender, setRowsPerPage] = useState(rowsPerPage);
  const [currentPage, setPage] = useState(0);
  const [rowsToRender, setRowsToRender] = useState([]);

  // Helper functions for pagination
  let handleChangePage = function(event, newPage){
    setPage(newPage);
  }

  let handleChangeRowsPerPage = function(event) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  // Flatten and sort data
  let tableRows = [];
  if(researchSubjects){
    if(researchSubjects.length > 0){
      researchSubjects.forEach(function(researchSubject){
        let flattened = FhirDehydrator.dehydrateResearchSubject(researchSubject, dateFormat);
        tableRows.push(flattened);
      });
    }
  }

  // Sort table rows
  if(order === 'ascending'){
    tableRows = tableRows.sort((a, b) => {
      if(a.startDate < b.startDate) return -1;
      if(a.startDate > b.startDate) return 1;
      return 0;
    });
  } else {
    tableRows = reverse(tableRows);
  }

  // Render table rows
  if(tableRows.length > 0){
    tableRows.forEach(function(row){
      rows.push(
        <TableRow 
          key={row._id} 
          onClick={onRowClick ? onRowClick.bind(this, row._id || row.id) : undefined}
          hover={onRowClick ? true : false}
          style={{cursor: onRowClick ? 'pointer' : 'default'}}
        >
          {!hideCheckbox && (
            <TableCell padding="checkbox">
              <Checkbox defaultChecked={defaultCheckboxValue} />
            </TableCell>
          )}
          {!hideSubject && (
            <TableCell>
              {row.patientDisplay}
            </TableCell>
          )}
          {!hideStudy && (
            <TableCell>
              {row.studyDisplay || row.study}
            </TableCell>
          )}
          {!hideStatus && (
            <TableCell>
              <Chip 
                label={getStatusDisplay(row.status)} 
                size="small"
                color={getStatusColor(row.status)}
                variant="outlined"
              />
            </TableCell>
          )}
          {!hideAssignedArm && (
            <TableCell>
              {row.assignedArm}
            </TableCell>
          )}
          {!hideActualArm && (
            <TableCell>
              {row.actualArm}
            </TableCell>
          )}
          {!hidePeriod && (
            <TableCell>
              {row.startDate}
              {row.endDate && ` - ${row.endDate}`}
            </TableCell>
          )}
          {!hideConsent && (
            <TableCell>
              {row.consent}
            </TableCell>
          )}
          {!hideActionButton && (
            <TableCell>
              <Button 
                variant="contained" 
                size="small"
                onClick={onActionButtonClick ? onActionButtonClick.bind(this, row._id || row.id) : undefined}
              >
                {actionButtonLabel || 'Action'}
              </Button>
            </TableCell>
          )}
        </TableRow>
      );
    });
  }

  // Calculate pagination
  const emptyRows = rowsPerPageToRender - Math.min(rowsPerPageToRender, rows.length - currentPage * rowsPerPageToRender);
  const displayedRows = rows.slice(currentPage * rowsPerPageToRender, currentPage * rowsPerPageToRender + rowsPerPageToRender);

  return (
    <div>
      <Table id={id} size={tableRowSize || "medium"} aria-label="research subjects table">
        <TableHead>
          <TableRow>
            {!hideCheckbox && (
              <TableCell padding="checkbox">
                {labels?.checkbox || 'Checkbox'}
              </TableCell>
            )}
            {!hideSubject && (
              <TableCell>
                Subject
              </TableCell>
            )}
            {!hideStudy && (
              <TableCell>
                Study
              </TableCell>
            )}
            {!hideStatus && (
              <TableCell>
                Status
              </TableCell>
            )}
            {!hideAssignedArm && (
              <TableCell>
                Assigned Arm
              </TableCell>
            )}
            {!hideActualArm && (
              <TableCell>
                Actual Arm
              </TableCell>
            )}
            {!hidePeriod && (
              <TableCell>
                Period
              </TableCell>
            )}
            {!hideConsent && (
              <TableCell>
                Consent
              </TableCell>
            )}
            {!hideActionButton && (
              <TableCell>
                Action
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedRows}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={10} />
            </TableRow>
          )}
        </TableBody>
        {!disablePagination && (
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 100]}
                count={rows.length}
                rowsPerPage={rowsPerPageToRender}
                page={currentPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

// Helper functions
function getStatusDisplay(status) {
  const statusMap = {
    'candidate': 'Candidate',
    'eligible': 'Eligible',
    'follow-up': 'Follow-up',
    'ineligible': 'Ineligible',
    'not-registered': 'Not Registered',
    'off-study': 'Off Study',
    'on-study': 'On Study',
    'on-study-intervention': 'On Study Intervention',
    'on-study-observation': 'On Study Observation',
    'pending-on-study': 'Pending On Study',
    'potential-candidate': 'Potential Candidate',
    'screening': 'Screening',
    'withdrawn': 'Withdrawn'
  };
  return statusMap[status] || status;
}

function getStatusColor(status) {
  switch(status) {
    case 'on-study':
    case 'on-study-intervention':
    case 'on-study-observation':
      return 'primary';
    case 'eligible':
    case 'screening':
      return 'info';
    case 'completed':
    case 'follow-up':
      return 'success';
    case 'withdrawn':
    case 'ineligible':
    case 'not-registered':
      return 'error';
    default:
      return 'default';
  }
}

ResearchSubjectsTable.propTypes = {
  id: PropTypes.string,
  researchSubjects: PropTypes.array,
  selectedResearchSubjectId: PropTypes.string,
  
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hideStudy: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideAssignedArm: PropTypes.bool,
  hideActualArm: PropTypes.bool,
  hidePeriod: PropTypes.bool,
  hideConsent: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideTextIcon: PropTypes.bool,
  hideActionButton: PropTypes.bool,
  
  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  
  actionButtonLabel: PropTypes.string,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  formFactorLayout: PropTypes.string,
  rowsPerPage: PropTypes.number,
  count: PropTypes.number,
  page: PropTypes.number,
  order: PropTypes.string,
  
  disablePagination: PropTypes.bool,
  labels: PropTypes.object,
  defaultCheckboxValue: PropTypes.bool,
  onSetPage: PropTypes.func
};

// Attach to Meteor.Tables for backwards compatibility
if(typeof Meteor !== 'undefined'){
  if(!Meteor.Tables){
    Meteor.Tables = {};
  }
  Meteor.Tables.ResearchSubjectsTable = ResearchSubjectsTable;
}

export default ResearchSubjectsTable;
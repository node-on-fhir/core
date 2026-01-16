// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/familyMemberHistories/FamilyMemberHistoriesTable.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  Typography,
  Stack,
  Tooltip
} from '@mui/material';

import { get, has } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { FhirDehydrator } from '/imports/lib/FhirDehydrator';

//===========================================================================
// THEMING

import { ThemeProvider, StyledEngineProvider, useTheme } from '@mui/material/styles';

//===========================================================================
// SESSION VARIABLES

Session.setDefault('familyMemberHistoriesPageTabIndex', 0);
Session.setDefault('familyMemberHistoriesSearchFilter', '');
Session.setDefault('selectedFamilyMemberHistoryId', '');

//===========================================================================
// MAIN COMPONENT

function FamilyMemberHistoriesTable(props) {
  const theme = useTheme();

  // Props with defaults
  const {
    familyMemberHistories = [],
    hidePatientDisplay = false,
    hidePatientReference = true,
    hideBarcode = true,
    hideStatus = false,
    hideRelationship = false,
    hideConditions = false,
    hideName = false,
    hideAge = false,
    onRowClick,
    page = 0,
    rowsPerPageOptions = [5, 10, 25, 50],
    tableRowSize = 'medium',
    formFactorLayout = 'web',
    ...otherProps
  } = props;

  // Store original prop values for form factor handling
  const hidePatientDisplayFromProp = hidePatientDisplay;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  // State
  const [currentPage, setCurrentPage] = useState(page);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  // Tracker for selected records
  const selectedFamilyMemberHistoryId = useTracker(function() {
    return Session.get('selectedFamilyMemberHistoryId');
  }, []);

  // Apply form factor overrides
  let formFactorHidePatientDisplay = hidePatientDisplay;
  let formFactorHidePatientReference = hidePatientReference;
  let formFactorHideBarcode = hideBarcode;

  switch (formFactorLayout) {
    case "phone":
      formFactorHidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : true;
      formFactorHidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
      formFactorHideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      break;
    case "tablet":
      formFactorHidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
      formFactorHidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
      formFactorHideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      break;
    case "web":
      formFactorHidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
      formFactorHidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
      formFactorHideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      break;
    case "desktop":
      formFactorHidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
      formFactorHidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
      formFactorHideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
      break;
  }

  // Event handlers
  function handleChangePage(event, newPage) {
    setCurrentPage(newPage);
  }

  function handleChangeRowsPerPage(event) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }

  function rowClick(familyMemberHistoryId) {
    Session.set('selectedFamilyMemberHistoryId', familyMemberHistoryId);
    Session.set('selectedFamilyMemberHistory', familyMemberHistories.find(fmh => fmh._id === familyMemberHistoryId));
    
    if (onRowClick) {
      onRowClick(familyMemberHistoryId);
    }
  }

  // Render functions
  function renderBarcodeHeader() {
    if (!formFactorHideBarcode) {
      return <TableCell className='barcode'>System ID</TableCell>;
    }
  }

  function renderPatientNameHeader() {
    if (!formFactorHidePatientDisplay) {
      return <TableCell className='patientDisplay'>Patient Name</TableCell>;
    }
  }

  function renderPatientReferenceHeader() {
    if (!formFactorHidePatientReference) {
      return <TableCell className='patientReference'>Patient Reference</TableCell>;
    }
  }

  function renderStatusHeader() {
    if (!hideStatus) {
      return <TableCell>Status</TableCell>;
    }
  }

  function renderRelationshipHeader() {
    if (!hideRelationship) {
      return <TableCell>Relationship</TableCell>;
    }
  }

  function renderNameHeader() {
    if (!hideName) {
      return <TableCell>Family Member</TableCell>;
    }
  }

  function renderAgeHeader() {
    if (!hideAge) {
      return <TableCell>Age/Deceased</TableCell>;
    }
  }

  function renderConditionsHeader() {
    if (!hideConditions) {
      return <TableCell>Health Conditions</TableCell>;
    }
  }

  function renderBarcode(familyMemberHistory) {
    if (!formFactorHideBarcode) {
      const id = get(familyMemberHistory, '_id');
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell><span className="barcode">{idString}</span></TableCell>
      );
    }
  }

  function renderPatientName(familyMemberHistory) {
    if (!formFactorHidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>
          {get(familyMemberHistory, 'patientDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderPatientReference(familyMemberHistory) {
    if (!formFactorHidePatientReference) {
      return (
        <TableCell className='patientReference'>
          {get(familyMemberHistory, 'patientReference', '')}
        </TableCell>
      );
    }
  }

  function renderStatus(familyMemberHistory) {
    if (!hideStatus) {
      const status = get(familyMemberHistory, 'status', '');
      const color = status === 'partial' ? 'warning' : 
                   status === 'completed' ? 'success' : 
                   status === 'entered-in-error' ? 'error' : 'default';
      
      return (
        <TableCell>
          <Chip label={status} color={color} size="small" />
        </TableCell>
      );
    }
  }

  function renderRelationship(familyMemberHistory) {
    if (!hideRelationship) {
      return (
        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            {get(familyMemberHistory, 'relationship', '')}
          </Typography>
        </TableCell>
      );
    }
  }

  function renderName(familyMemberHistory) {
    if (!hideName) {
      return (
        <TableCell>
          {get(familyMemberHistory, 'name', '') || 
           get(familyMemberHistory, 'relationship', '') + ' (unnamed)'}
        </TableCell>
      );
    }
  }

  function renderAge(familyMemberHistory) {
    if (!hideAge) {
      const deceased = get(familyMemberHistory, 'deceasedBoolean', false);
      const deceasedAge = get(familyMemberHistory, 'deceasedAge', '');
      const ageRange = get(familyMemberHistory, 'ageRange', '');
      const bornDate = get(familyMemberHistory, 'bornDate', '');
      
      let ageDisplay = '';
      if (deceased) {
        ageDisplay = deceasedAge ? `Deceased (${deceasedAge})` : 'Deceased';
      } else if (ageRange) {
        ageDisplay = ageRange;
      } else if (bornDate) {
        const age = moment().diff(moment(bornDate), 'years');
        ageDisplay = `${age} years`;
      }
      
      return (
        <TableCell>
          <Typography variant="body2" color={deceased ? 'text.secondary' : 'text.primary'}>
            {ageDisplay}
          </Typography>
        </TableCell>
      );
    }
  }

  function renderConditions(familyMemberHistory) {
    if (!hideConditions) {
      const conditions = get(familyMemberHistory, 'conditions', []);
      
      return (
        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ maxWidth: 300 }}>
            {conditions.slice(0, 3).map((condition, index) => (
              <Chip 
                key={index}
                label={condition}
                size="small" 
                variant="outlined"
                color="primary"
              />
            ))}
            {conditions.length > 3 && (
              <Tooltip title={conditions.slice(3).join(', ')}>
                <Chip 
                  label={`+${conditions.length - 3} more`}
                  size="small" 
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      );
    }
  }

  // Data processing
  let familyMemberHistoriesToRender = [];
  if (familyMemberHistories && familyMemberHistories.length > 0) {
    familyMemberHistoriesToRender = familyMemberHistories.map(function(familyMemberHistory, index) {
      return FhirDehydrator.flattenFamilyMemberHistory(familyMemberHistory);
    });

    // Pagination
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    familyMemberHistoriesToRender = familyMemberHistoriesToRender.slice(startIndex, endIndex);
  }

  // Render rows
  let tableRows = [];
  if (familyMemberHistoriesToRender.length > 0) {
    for (let i = 0; i < familyMemberHistoriesToRender.length; i++) {
      const currentFamilyMemberHistory = familyMemberHistoriesToRender[i];
      const familyMemberHistoryId = get(currentFamilyMemberHistory, '_id');
      
      tableRows.push(
        <TableRow 
          key={i}
          hover
          onClick={() => rowClick(familyMemberHistoryId)}
          selected={familyMemberHistoryId === selectedFamilyMemberHistoryId}
          sx={{ cursor: 'pointer' }}
        >
          {renderBarcode(currentFamilyMemberHistory)}
          {renderPatientName(currentFamilyMemberHistory)}
          {renderPatientReference(currentFamilyMemberHistory)}
          {renderStatus(currentFamilyMemberHistory)}
          {renderRelationship(currentFamilyMemberHistory)}
          {renderName(currentFamilyMemberHistory)}
          {renderAge(currentFamilyMemberHistory)}
          {renderConditions(currentFamilyMemberHistory)}
        </TableRow>
      );
    }
  }

  return (
    <Box>
      <Table id="familyMemberHistoriesTable" size={tableRowSize}>
        <TableHead>
          <TableRow>
            {renderBarcodeHeader()}
            {renderPatientNameHeader()}
            {renderPatientReferenceHeader()}
            {renderStatusHeader()}
            {renderRelationshipHeader()}
            {renderNameHeader()}
            {renderAgeHeader()}
            {renderConditionsHeader()}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={familyMemberHistories.length}
        rowsPerPage={rowsPerPage}
        page={currentPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}

export default FamilyMemberHistoriesTable;
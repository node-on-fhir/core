// /imports/ui-fhir/activityDefinitions/ActivityDefinitionsTable.jsx

import React from 'react';
import PropTypes from 'prop-types';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper
} from '@mui/material';

import { get } from 'lodash';

import { FhirDehydrator } from '../../lib/FhirDehydrator';

//===========================================================================
// MAIN COMPONENT

function ActivityDefinitionsTable(props) {
  const {
    id,
    activityDefinitions,
    count,
    rowsPerPage,
    page,
    onRowClick,
    onSetPage,
    hideBarcode,
    hideStatus,
    hideKind,
    hideIntent,
    hidePriority,
    hidePublisher,
    ...otherProps
  } = props;

  // Pagination handling
  function handleChangePage(event, newPage) {
    if (typeof onSetPage === 'function') {
      onSetPage(newPage);
    }
  }

  function handleRowClick(activityDefinitionId) {
    if (typeof onRowClick === 'function') {
      onRowClick(activityDefinitionId);
    }
  }

  // Render table rows
  let tableRows = [];
  let activityDefinitionsToRender = [];

  if (activityDefinitions && activityDefinitions.length > 0) {
    let startIndex = (page || 0) * (rowsPerPage || 5);
    let endIndex = startIndex + (rowsPerPage || 5);

    activityDefinitions.forEach(function(activityDefinition, index) {
      if (index >= startIndex && index < endIndex) {
        activityDefinitionsToRender.push(FhirDehydrator.dehydrateActivityDefinition(activityDefinition));
      }
    });
  }

  if (activityDefinitionsToRender.length > 0) {
    for (let i = 0; i < activityDefinitionsToRender.length; i++) {
      const item = activityDefinitionsToRender[i];

      tableRows.push(
        <TableRow
          key={i}
          hover
          onClick={() => handleRowClick(item._id)}
          sx={{ cursor: 'pointer' }}
        >
          <TableCell>{get(item, 'name', '')}</TableCell>
          <TableCell>{get(item, 'title', '')}</TableCell>
          {!hideStatus && <TableCell>{get(item, 'status', '')}</TableCell>}
          {!hideKind && <TableCell>{get(item, 'kind', '')}</TableCell>}
          {!hideIntent && <TableCell>{get(item, 'intent', '')}</TableCell>}
          {!hidePriority && <TableCell>{get(item, 'priority', '')}</TableCell>}
          {!hidePublisher && <TableCell>{get(item, 'publisher', '')}</TableCell>}
          {!hideBarcode && (
            <TableCell>
              <span className="barcode helveticas">{get(item, '_id', '')}</span>
            </TableCell>
          )}
        </TableRow>
      );
    }
  }

  return (
    <div id={id}>
      <TableContainer>
        <Table id="activityDefinitionsTable" size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Title</TableCell>
              {!hideStatus && <TableCell>Status</TableCell>}
              {!hideKind && <TableCell>Kind</TableCell>}
              {!hideIntent && <TableCell>Intent</TableCell>}
              {!hidePriority && <TableCell>Priority</TableCell>}
              {!hidePublisher && <TableCell>Publisher</TableCell>}
              {!hideBarcode && <TableCell>System ID</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={count || activityDefinitions?.length || 0}
        rowsPerPage={rowsPerPage || 5}
        page={page || 0}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </div>
  );
}

ActivityDefinitionsTable.propTypes = {
  id: PropTypes.string,
  activityDefinitions: PropTypes.array,
  count: PropTypes.number,
  rowsPerPage: PropTypes.number,
  page: PropTypes.number,
  onRowClick: PropTypes.func,
  onSetPage: PropTypes.func,
  hideBarcode: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideKind: PropTypes.bool,
  hideIntent: PropTypes.bool,
  hidePriority: PropTypes.bool,
  hidePublisher: PropTypes.bool
};

ActivityDefinitionsTable.defaultProps = {
  activityDefinitions: [],
  rowsPerPage: 5,
  page: 0,
  hideBarcode: false,
  hideStatus: false,
  hideKind: true,
  hideIntent: true,
  hidePriority: true,
  hidePublisher: true
};

export default ActivityDefinitionsTable;

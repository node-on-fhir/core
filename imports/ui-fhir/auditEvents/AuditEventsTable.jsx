// imports/ui-fhir/auditEvents/AuditEventsTable.jsx

import React, { useState } from 'react';
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
  TablePagination
} from '@mui/material';

import moment from 'moment';
import { get } from 'lodash';

import { FhirDehydrator } from '../../lib/FhirDehydrator';

const logger = {
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
  data: console.log.bind(console),
  verbose: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

function AuditEventsTable(props) {
  logger.info('Rendering the AuditEventsTable');

  let {
    id,
    children,

    data,
    auditEvents,
    selectedAuditEventId,

    query,
    paginationLimit,

    disablePagination,
    hideCheckbox = true,
    hideActionIcons = true,
    hideType = false,
    hideAction = false,
    hideRecorded = false,
    hideOutcome = false,
    hideAgent = false,
    hideSource = false,
    hideBarcode = true,
    defaultCheckboxValue = false,

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton = true,
    actionButtonLabel,

    rowsPerPage = 5,
    tableRowSize = 'medium',
    dateFormat = 'YYYY-MM-DD HH:mm:ss',
    showMinutes = true,
    formFactorLayout,
    count,

    page = 0,
    onSetPage,

    ...otherProps
  } = props;

  // Form factor adjustments
  if (formFactorLayout) {
    switch (formFactorLayout) {
      case 'phone':
        hideCheckbox = true;
        hideActionIcons = true;
        hideSource = true;
        hideBarcode = true;
        break;
      case 'tablet':
        hideCheckbox = true;
        hideBarcode = true;
        break;
      case 'web':
      case 'desktop':
        hideCheckbox = true;
        hideBarcode = true;
        break;
      case 'hdmi':
        hideBarcode = false;
        break;
    }
  }

  function handleToggle(index) {
    console.log('Toggling entry ' + index);
    if (props.onToggle) {
      props.onToggle(index);
    }
  }

  function handleRowClick(id) {
    if (props && typeof onRowClick === 'function') {
      onRowClick(id);
    }
  }

  function handleActionButtonClick(_id) {
    if (typeof onActionButtonClick === 'function') {
      onActionButtonClick(_id);
    }
  }

  // Column Rendering
  function renderCheckboxHeader() {
    if (!hideCheckbox) {
      return <TableCell className="toggle" style={{ width: '60px' }}>Checkbox</TableCell>;
    }
  }

  function renderCheckbox(index) {
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{ padding: '0px' }}>
          <Checkbox
            defaultChecked={defaultCheckboxValue}
            onChange={handleToggle.bind(this, index)}
          />
        </TableCell>
      );
    }
  }

  function renderTypeHeader() {
    if (!hideType) {
      return <TableCell className="type">Type</TableCell>;
    }
  }

  function renderType(typeDisplay) {
    if (!hideType) {
      return <TableCell className="type">{typeDisplay}</TableCell>;
    }
  }

  function renderActionHeader() {
    if (!hideAction) {
      return <TableCell className="action">Action</TableCell>;
    }
  }

  function renderAction(action) {
    if (!hideAction) {
      // Map action codes to human-readable text
      const actionMap = {
        'C': 'Create',
        'R': 'Read',
        'U': 'Update',
        'D': 'Delete',
        'E': 'Execute'
      };
      return <TableCell className="action">{actionMap[action] || action}</TableCell>;
    }
  }

  function renderRecordedHeader() {
    if (!hideRecorded) {
      return <TableCell className="recorded">Recorded</TableCell>;
    }
  }

  function renderRecorded(recorded) {
    if (!hideRecorded) {
      return <TableCell className="recorded">{recorded}</TableCell>;
    }
  }

  function renderOutcomeHeader() {
    if (!hideOutcome) {
      return <TableCell className="outcome">Outcome</TableCell>;
    }
  }

  function renderOutcome(outcome) {
    if (!hideOutcome) {
      // Map outcome codes to human-readable text
      const outcomeMap = {
        '0': 'Success',
        '4': 'Minor Failure',
        '8': 'Serious Failure',
        '12': 'Major Failure'
      };
      return <TableCell className="outcome">{outcomeMap[outcome] || outcome}</TableCell>;
    }
  }

  function renderAgentHeader() {
    if (!hideAgent) {
      return <TableCell className="agent">Agent</TableCell>;
    }
  }

  function renderAgent(agentDisplay) {
    if (!hideAgent) {
      return <TableCell className="agent">{agentDisplay}</TableCell>;
    }
  }

  function renderSourceHeader() {
    if (!hideSource) {
      return <TableCell className="source">Source</TableCell>;
    }
  }

  function renderSource(sourceDisplay) {
    if (!hideSource) {
      return <TableCell className="source">{sourceDisplay}</TableCell>;
    }
  }

  function renderBarcodeHeader() {
    if (!hideBarcode) {
      return <TableCell className="barcode">System ID</TableCell>;
    }
  }

  function renderBarcode(id) {
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return <TableCell className="barcode"><span className="barcode helveticas">{idString}</span></TableCell>;
    }
  }

  function renderActionButtonHeader() {
    if (!hideActionButton) {
      return <TableCell className="ActionButton">Action</TableCell>;
    }
  }

  function renderActionButton(auditEventId) {
    if (!hideActionButton) {
      return (
        <TableCell className="ActionButton">
          <Button onClick={handleActionButtonClick.bind(this, auditEventId)}>
            {get(props, 'actionButtonLabel', '')}
          </Button>
        </TableCell>
      );
    }
  }

  // Pagination
  let paginationCount = 101;
  if (count) {
    paginationCount = count;
  }

  function handleChangePage(event, newPage) {
    if (typeof onSetPage === 'function') {
      onSetPage(newPage);
    }
  }

  let paginationFooter;
  if (!disablePagination) {
    paginationFooter = (
      <TablePagination
        component="div"
        rowsPerPageOptions={[5, 10, 25, 100]}
        colSpan={3}
        count={paginationCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        style={{ float: 'right', border: 'none' }}
      />
    );
  }

  // Table Rows
  let tableRows = [];
  let auditEventsToRender = [];
  let internalDateFormat = 'YYYY-MM-DD HH:mm:ss';

  if (showMinutes) {
    internalDateFormat = 'YYYY-MM-DD HH:mm';
  }
  if (dateFormat) {
    internalDateFormat = dateFormat;
  }

  if (auditEvents) {
    if (auditEvents.length > 0) {
      let count = 0;

      auditEvents.forEach(function(auditEvent) {
        if ((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)) {
          auditEventsToRender.push(FhirDehydrator.dehydrateAuditEvent(auditEvent, internalDateFormat));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  };

  if (auditEventsToRender.length === 0) {
    logger.trace('AuditEventsTable: No audit events to render.');
  } else {
    for (let i = 0; i < auditEventsToRender.length; i++) {
      const currentAuditEvent = auditEventsToRender[i];
      const auditEventId = currentAuditEvent._id;
      let selected = false;
      if (currentAuditEvent.id === selectedAuditEventId) {
        selected = true;
      }
      if (tableRowSize === 'small') {
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow
          className="auditEventRow"
          key={i}
          style={rowStyle}
          onClick={() => handleRowClick(auditEventId)}
          hover={true}
          selected={selected}
        >
          {renderCheckbox(i)}
          {renderType(get(currentAuditEvent, 'codeDisplay', '') || get(currentAuditEvent, 'codeCode', ''))}
          {renderAction(get(currentAuditEvent, 'action', ''))}
          {renderRecorded(get(currentAuditEvent, 'recorded', ''))}
          {renderOutcome(get(currentAuditEvent, 'outcomeCode', '') || get(currentAuditEvent, 'outcome', ''))}
          {renderAgent(get(currentAuditEvent, 'agentWhoDisplay', ''))}
          {renderSource(get(currentAuditEvent, 'sourceObserverDisplay', ''))}
          {renderBarcode(get(currentAuditEvent, '_id', ''))}
          {renderActionButton(get(currentAuditEvent, '_id', ''))}
        </TableRow>
      );
    }
  }

  return (
    <div id={id} className="tableWithPagination">
      <Table className="auditEventsTable" size={tableRowSize} aria-label="audit events table" {...otherProps}>
        <TableHead>
          <TableRow>
            {renderCheckboxHeader()}
            {renderTypeHeader()}
            {renderActionHeader()}
            {renderRecordedHeader()}
            {renderOutcomeHeader()}
            {renderAgentHeader()}
            {renderSourceHeader()}
            {renderBarcodeHeader()}
            {renderActionButtonHeader()}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>
      {paginationFooter}
    </div>
  );
}

AuditEventsTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  auditEvents: PropTypes.array,
  selectedAuditEventId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideType: PropTypes.bool,
  hideAction: PropTypes.bool,
  hideRecorded: PropTypes.bool,
  hideOutcome: PropTypes.bool,
  hideAgent: PropTypes.bool,
  hideSource: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  defaultCheckboxValue: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  hideActionButton: PropTypes.bool,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string
};

export default AuditEventsTable;

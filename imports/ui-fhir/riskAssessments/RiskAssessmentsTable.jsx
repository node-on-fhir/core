// imports/ui-fhir/riskAssessments/RiskAssessmentsTable.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox
} from '@mui/material';
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

function RiskAssessmentsTable(props) {
  logger.info('Rendering RiskAssessmentsTable');
  logger.verbose('RiskAssessmentsTable.props', {
    id: props.id,
    riskAssessmentsCount: props.riskAssessments ? props.riskAssessments.length : 0,
    page: props.page,
    rowsPerPage: props.rowsPerPage
  });

  const {
    id,
    riskAssessments,
    page,
    rowsPerPage,
    onRowClick,
    onSetPage,
    order,
    hideCheckbox,
    hideStatus,
    hideCode,
    hideMethod,
    hidePrediction,
    hideMitigation,
    hideDate,
    hidePerformer,
    hidePatientName,
    hidePatientReference,
    hideBarcode
  } = props;

  // Store original prop values to preserve user preferences
  const hidePatientNameFromProp = hidePatientName;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  const [currentPage, setCurrentPage] = useState(page || 0);
  const [currentRowsPerPage, setCurrentRowsPerPage] = useState(rowsPerPage || 5);

  function handleChangePage(event, newPage) {
    setCurrentPage(newPage);
    if (onSetPage) {
      onSetPage(newPage);
    }
  }

  function handleChangeRowsPerPage(event) {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setCurrentRowsPerPage(newRowsPerPage);
    setCurrentPage(0);
    if (onSetPage) {
      onSetPage(0);
    }
  }

  function handleRowClick(id) {
    if (onRowClick) {
      onRowClick(id);
    }
  }

  // Process risk assessments for display
  let riskAssessmentsToRender = [];

  if (riskAssessments && riskAssessments.length > 0) {
    riskAssessments.forEach(function(riskAssessment) {
      const flattenedRiskAssessment = FhirDehydrator.dehydrateRiskAssessment(riskAssessment);
      riskAssessmentsToRender.push(flattenedRiskAssessment);
    });

    // Sort
    if (order === 'ascending') {
      riskAssessmentsToRender = riskAssessmentsToRender.reverse();
    }
  }

  // Paginate
  const paginatedData = riskAssessmentsToRender.slice(
    currentPage * currentRowsPerPage,
    currentPage * currentRowsPerPage + currentRowsPerPage
  );

  // Render functions for columns
  function renderCheckboxHeader() {
    if (!hideCheckbox) {
      return <TableCell padding="checkbox">Select</TableCell>;
    }
  }

  function renderCheckbox(riskAssessment) {
    if (!hideCheckbox) {
      return (
        <TableCell padding="checkbox">
          <Checkbox />
        </TableCell>
      );
    }
  }

  function renderStatusHeader() {
    if (!hideStatus) {
      return <TableCell className="status">Status</TableCell>;
    }
  }

  function renderStatus(riskAssessment) {
    if (!hideStatus) {
      return (
        <TableCell className="status">
          {get(riskAssessment, 'status', '')}
        </TableCell>
      );
    }
  }

  function renderCodeHeader() {
    if (!hideCode) {
      return <TableCell className="code">Code</TableCell>;
    }
  }

  function renderCode(riskAssessment) {
    if (!hideCode) {
      return (
        <TableCell className="code">
          {get(riskAssessment, 'codeDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderMethodHeader() {
    if (!hideMethod) {
      return <TableCell className="method">Method</TableCell>;
    }
  }

  function renderMethod(riskAssessment) {
    if (!hideMethod) {
      return (
        <TableCell className="method">
          {get(riskAssessment, 'methodDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderPredictionHeader() {
    if (!hidePrediction) {
      return <TableCell className="prediction">Prediction</TableCell>;
    }
  }

  function renderPrediction(riskAssessment) {
    if (!hidePrediction) {
      return (
        <TableCell className="prediction">
          {get(riskAssessment, 'predictionOutcome', '')}
        </TableCell>
      );
    }
  }

  function renderMitigationHeader() {
    if (!hideMitigation) {
      return <TableCell className="mitigation">Mitigation</TableCell>;
    }
  }

  function renderMitigation(riskAssessment) {
    if (!hideMitigation) {
      return (
        <TableCell className="mitigation">
          {get(riskAssessment, 'mitigation', '')}
        </TableCell>
      );
    }
  }

  function renderDateHeader() {
    if (!hideDate) {
      return <TableCell className="date">Date</TableCell>;
    }
  }

  function renderDate(riskAssessment) {
    if (!hideDate) {
      return (
        <TableCell className="date">
          {get(riskAssessment, 'date', '')}
        </TableCell>
      );
    }
  }

  function renderPerformerHeader() {
    if (!hidePerformer) {
      return <TableCell className="performer">Performer</TableCell>;
    }
  }

  function renderPerformer(riskAssessment) {
    if (!hidePerformer) {
      return (
        <TableCell className="performer">
          {get(riskAssessment, 'performerDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderPatientNameHeader() {
    if (!hidePatientNameFromProp) {
      return <TableCell className="patientDisplay">Patient Name</TableCell>;
    }
  }

  function renderPatientName(riskAssessment) {
    if (!hidePatientNameFromProp) {
      return (
        <TableCell className="patientDisplay">
          {get(riskAssessment, 'subjectDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderPatientReferenceHeader() {
    if (!hidePatientReferenceFromProp) {
      return <TableCell className="patientReference">Patient Reference</TableCell>;
    }
  }

  function renderPatientReference(riskAssessment) {
    if (!hidePatientReferenceFromProp) {
      return (
        <TableCell className="patientReference">
          {get(riskAssessment, 'subjectReference', '')}
        </TableCell>
      );
    }
  }

  function renderBarcodeHeader() {
    if (!hideBarcodeFromProp) {
      return <TableCell className="barcode">System ID</TableCell>;
    }
  }

  function renderBarcode(riskAssessment) {
    if (!hideBarcodeFromProp) {
      const idString = typeof riskAssessment._id === 'object' && riskAssessment._id._str
        ? riskAssessment._id._str
        : String(riskAssessment._id || '');
      return (
        <TableCell className="barcode">
          <span className="barcode">{idString}</span>
        </TableCell>
      );
    }
  }

  // Build table rows
  const rows = [];
  for (let i = 0; i < paginatedData.length; i++) {
    const currentRiskAssessment = paginatedData[i];
    const riskAssessmentId = currentRiskAssessment._id;

    rows.push(
      <TableRow
        key={i}
        onClick={() => handleRowClick(riskAssessmentId)}
        hover
        sx={{ cursor: 'pointer' }}
      >
        {renderCheckbox(currentRiskAssessment)}
        {renderStatus(currentRiskAssessment)}
        {renderCode(currentRiskAssessment)}
        {renderMethod(currentRiskAssessment)}
        {renderPrediction(currentRiskAssessment)}
        {renderMitigation(currentRiskAssessment)}
        {renderDate(currentRiskAssessment)}
        {renderPerformer(currentRiskAssessment)}
        {renderPatientName(currentRiskAssessment)}
        {renderPatientReference(currentRiskAssessment)}
        {renderBarcode(currentRiskAssessment)}
      </TableRow>
    );
  }

  return (
    <TableContainer>
      <Table id={id || 'riskAssessmentsTable'} size="small">
        <TableHead>
          <TableRow>
            {renderCheckboxHeader()}
            {renderStatusHeader()}
            {renderCodeHeader()}
            {renderMethodHeader()}
            {renderPredictionHeader()}
            {renderMitigationHeader()}
            {renderDateHeader()}
            {renderPerformerHeader()}
            {renderPatientNameHeader()}
            {renderPatientReferenceHeader()}
            {renderBarcodeHeader()}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={riskAssessmentsToRender.length}
        page={currentPage}
        onPageChange={handleChangePage}
        rowsPerPage={currentRowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );
}

RiskAssessmentsTable.propTypes = {
  id: PropTypes.string,
  riskAssessments: PropTypes.array,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  count: PropTypes.number,
  onRowClick: PropTypes.func,
  onSetPage: PropTypes.func,
  order: PropTypes.string,
  hideCheckbox: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideMethod: PropTypes.bool,
  hidePrediction: PropTypes.bool,
  hideMitigation: PropTypes.bool,
  hideDate: PropTypes.bool,
  hidePerformer: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideBarcode: PropTypes.bool
};

RiskAssessmentsTable.defaultProps = {
  riskAssessments: [],
  page: 0,
  rowsPerPage: 5,
  hideCheckbox: true,
  hideStatus: false,
  hideCode: false,
  hideMethod: false,
  hidePrediction: false,
  hideMitigation: false,
  hideDate: false,
  hidePerformer: true,
  hidePatientName: true,
  hidePatientReference: true,
  hideBarcode: true
};

export default RiskAssessmentsTable;

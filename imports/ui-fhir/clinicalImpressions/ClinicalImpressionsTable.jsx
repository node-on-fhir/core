// imports/ui-fhir/clinicalImpressions/ClinicalImpressionsTable.jsx

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

function ClinicalImpressionsTable(props) {
  logger.info('Rendering ClinicalImpressionsTable');
  logger.verbose('ClinicalImpressionsTable.props', {
    id: props.id,
    clinicalImpressionsCount: props.clinicalImpressions ? props.clinicalImpressions.length : 0,
    page: props.page,
    rowsPerPage: props.rowsPerPage
  });

  const {
    id,
    clinicalImpressions,
    page,
    rowsPerPage,
    onRowClick,
    onSetPage,
    order,
    hideCheckbox,
    hideStatus,
    hideDescription,
    hideSummary,
    hideDate,
    hideAssessor,
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

  // Process clinical impressions for display
  let clinicalImpressionsToRender = [];

  if (clinicalImpressions && clinicalImpressions.length > 0) {
    clinicalImpressions.forEach(function(clinicalImpression) {
      const flattenedClinicalImpression = FhirDehydrator.dehydrateClinicalImpression(clinicalImpression);
      clinicalImpressionsToRender.push(flattenedClinicalImpression);
    });

    // Sort
    if (order === 'ascending') {
      clinicalImpressionsToRender = clinicalImpressionsToRender.reverse();
    }
  }

  // Paginate
  const paginatedData = clinicalImpressionsToRender.slice(
    currentPage * currentRowsPerPage,
    currentPage * currentRowsPerPage + currentRowsPerPage
  );

  // Render functions for columns
  function renderCheckboxHeader() {
    if (!hideCheckbox) {
      return <TableCell padding="checkbox">Select</TableCell>;
    }
  }

  function renderCheckbox(clinicalImpression) {
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

  function renderStatus(clinicalImpression) {
    if (!hideStatus) {
      return (
        <TableCell className="status">
          {get(clinicalImpression, 'status', '')}
        </TableCell>
      );
    }
  }

  function renderDescriptionHeader() {
    if (!hideDescription) {
      return <TableCell className="description">Description</TableCell>;
    }
  }

  function renderDescription(clinicalImpression) {
    if (!hideDescription) {
      return (
        <TableCell className="description">
          {get(clinicalImpression, 'description', '')}
        </TableCell>
      );
    }
  }

  function renderSummaryHeader() {
    if (!hideSummary) {
      return <TableCell className="summary">Summary</TableCell>;
    }
  }

  function renderSummary(clinicalImpression) {
    if (!hideSummary) {
      return (
        <TableCell className="summary">
          {get(clinicalImpression, 'summary', '')}
        </TableCell>
      );
    }
  }

  function renderDateHeader() {
    if (!hideDate) {
      return <TableCell className="date">Date</TableCell>;
    }
  }

  function renderDate(clinicalImpression) {
    if (!hideDate) {
      return (
        <TableCell className="date">
          {get(clinicalImpression, 'date', '')}
        </TableCell>
      );
    }
  }

  function renderAssessorHeader() {
    if (!hideAssessor) {
      return <TableCell className="assessor">Assessor</TableCell>;
    }
  }

  function renderAssessor(clinicalImpression) {
    if (!hideAssessor) {
      return (
        <TableCell className="assessor">
          {get(clinicalImpression, 'assessorDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderPatientNameHeader() {
    if (!hidePatientNameFromProp) {
      return <TableCell className="patientDisplay">Patient Name</TableCell>;
    }
  }

  function renderPatientName(clinicalImpression) {
    if (!hidePatientNameFromProp) {
      return (
        <TableCell className="patientDisplay">
          {get(clinicalImpression, 'subjectDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderPatientReferenceHeader() {
    if (!hidePatientReferenceFromProp) {
      return <TableCell className="patientReference">Patient Reference</TableCell>;
    }
  }

  function renderPatientReference(clinicalImpression) {
    if (!hidePatientReferenceFromProp) {
      return (
        <TableCell className="patientReference">
          {get(clinicalImpression, 'subjectReference', '')}
        </TableCell>
      );
    }
  }

  function renderBarcodeHeader() {
    if (!hideBarcodeFromProp) {
      return <TableCell className="barcode">System ID</TableCell>;
    }
  }

  function renderBarcode(clinicalImpression) {
    if (!hideBarcodeFromProp) {
      const idString = typeof clinicalImpression._id === 'object' && clinicalImpression._id._str
        ? clinicalImpression._id._str
        : String(clinicalImpression._id || '');
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
    const currentClinicalImpression = paginatedData[i];
    const clinicalImpressionId = currentClinicalImpression._id;

    rows.push(
      <TableRow
        key={i}
        onClick={() => handleRowClick(clinicalImpressionId)}
        hover
        sx={{ cursor: 'pointer' }}
      >
        {renderCheckbox(currentClinicalImpression)}
        {renderStatus(currentClinicalImpression)}
        {renderDescription(currentClinicalImpression)}
        {renderSummary(currentClinicalImpression)}
        {renderDate(currentClinicalImpression)}
        {renderAssessor(currentClinicalImpression)}
        {renderPatientName(currentClinicalImpression)}
        {renderPatientReference(currentClinicalImpression)}
        {renderBarcode(currentClinicalImpression)}
      </TableRow>
    );
  }

  return (
    <TableContainer>
      <Table id={id || 'clinicalImpressionsTable'} size="small">
        <TableHead>
          <TableRow>
            {renderCheckboxHeader()}
            {renderStatusHeader()}
            {renderDescriptionHeader()}
            {renderSummaryHeader()}
            {renderDateHeader()}
            {renderAssessorHeader()}
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
        count={clinicalImpressionsToRender.length}
        page={currentPage}
        onPageChange={handleChangePage}
        rowsPerPage={currentRowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );
}

ClinicalImpressionsTable.propTypes = {
  id: PropTypes.string,
  clinicalImpressions: PropTypes.array,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  count: PropTypes.number,
  onRowClick: PropTypes.func,
  onSetPage: PropTypes.func,
  order: PropTypes.string,
  hideCheckbox: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hideSummary: PropTypes.bool,
  hideDate: PropTypes.bool,
  hideAssessor: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideBarcode: PropTypes.bool
};

ClinicalImpressionsTable.defaultProps = {
  clinicalImpressions: [],
  page: 0,
  rowsPerPage: 5,
  hideCheckbox: true,
  hideStatus: false,
  hideDescription: false,
  hideSummary: false,
  hideDate: false,
  hideAssessor: true,
  hidePatientName: true,
  hidePatientReference: true,
  hideBarcode: true
};

export default ClinicalImpressionsTable;

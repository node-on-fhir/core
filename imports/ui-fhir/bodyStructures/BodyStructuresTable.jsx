// imports/ui-fhir/bodyStructures/BodyStructuresTable.jsx

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

function BodyStructuresTable(props) {
  logger.info('Rendering BodyStructuresTable');
  logger.verbose('BodyStructuresTable.props', {
    id: props.id,
    bodyStructuresCount: props.bodyStructures ? props.bodyStructures.length : 0,
    page: props.page,
    rowsPerPage: props.rowsPerPage
  });

  const {
    id,
    bodyStructures,
    page,
    rowsPerPage,
    onRowClick,
    onSetPage,
    order,
    hideCheckbox,
    hideActive,
    hideDescription,
    hideMorphology,
    hideStructure,
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

  // Process body structures for display
  let bodyStructuresToRender = [];

  if (bodyStructures && bodyStructures.length > 0) {
    bodyStructures.forEach(function(bodyStructure) {
      const flattenedBodyStructure = FhirDehydrator.dehydrateBodyStructure(bodyStructure);
      bodyStructuresToRender.push(flattenedBodyStructure);
    });

    // Sort
    if (order === 'ascending') {
      bodyStructuresToRender = bodyStructuresToRender.reverse();
    }
  }

  // Paginate
  const paginatedData = bodyStructuresToRender.slice(
    currentPage * currentRowsPerPage,
    currentPage * currentRowsPerPage + currentRowsPerPage
  );

  // Render functions for columns
  function renderCheckboxHeader() {
    if (!hideCheckbox) {
      return <TableCell padding="checkbox">Select</TableCell>;
    }
  }

  function renderCheckbox(bodyStructure) {
    if (!hideCheckbox) {
      return (
        <TableCell padding="checkbox">
          <Checkbox />
        </TableCell>
      );
    }
  }

  function renderActiveHeader() {
    if (!hideActive) {
      return <TableCell className="active">Active</TableCell>;
    }
  }

  function renderActive(bodyStructure) {
    if (!hideActive) {
      return (
        <TableCell className="active">
          {bodyStructure.active ? 'Yes' : 'No'}
        </TableCell>
      );
    }
  }

  function renderDescriptionHeader() {
    if (!hideDescription) {
      return <TableCell className="description">Description</TableCell>;
    }
  }

  function renderDescription(bodyStructure) {
    if (!hideDescription) {
      return (
        <TableCell className="description">
          {get(bodyStructure, 'description', '')}
        </TableCell>
      );
    }
  }

  function renderMorphologyHeader() {
    if (!hideMorphology) {
      return <TableCell className="morphology">Morphology</TableCell>;
    }
  }

  function renderMorphology(bodyStructure) {
    if (!hideMorphology) {
      return (
        <TableCell className="morphology">
          {get(bodyStructure, 'morphology', '')}
        </TableCell>
      );
    }
  }

  function renderStructureHeader() {
    if (!hideStructure) {
      return <TableCell className="structure">Structure</TableCell>;
    }
  }

  function renderStructure(bodyStructure) {
    if (!hideStructure) {
      return (
        <TableCell className="structure">
          {get(bodyStructure, 'structure', '')}
        </TableCell>
      );
    }
  }

  function renderPatientNameHeader() {
    if (!hidePatientNameFromProp) {
      return <TableCell className="patientDisplay">Patient Name</TableCell>;
    }
  }

  function renderPatientName(bodyStructure) {
    if (!hidePatientNameFromProp) {
      return (
        <TableCell className="patientDisplay">
          {get(bodyStructure, 'patientDisplay', '')}
        </TableCell>
      );
    }
  }

  function renderPatientReferenceHeader() {
    if (!hidePatientReferenceFromProp) {
      return <TableCell className="patientReference">Patient Reference</TableCell>;
    }
  }

  function renderPatientReference(bodyStructure) {
    if (!hidePatientReferenceFromProp) {
      return (
        <TableCell className="patientReference">
          {get(bodyStructure, 'patientReference', '')}
        </TableCell>
      );
    }
  }

  function renderBarcodeHeader() {
    if (!hideBarcodeFromProp) {
      return <TableCell className="barcode">System ID</TableCell>;
    }
  }

  function renderBarcode(bodyStructure) {
    if (!hideBarcodeFromProp) {
      const idString = typeof bodyStructure._id === 'object' && bodyStructure._id._str
        ? bodyStructure._id._str
        : String(bodyStructure._id || '');
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
    const currentBodyStructure = paginatedData[i];
    const bodyStructureId = currentBodyStructure._id;

    rows.push(
      <TableRow
        key={i}
        onClick={() => handleRowClick(bodyStructureId)}
        hover
        sx={{ cursor: 'pointer' }}
      >
        {renderCheckbox(currentBodyStructure)}
        {renderActive(currentBodyStructure)}
        {renderDescription(currentBodyStructure)}
        {renderMorphology(currentBodyStructure)}
        {renderStructure(currentBodyStructure)}
        {renderPatientName(currentBodyStructure)}
        {renderPatientReference(currentBodyStructure)}
        {renderBarcode(currentBodyStructure)}
      </TableRow>
    );
  }

  return (
    <TableContainer>
      <Table id={id || 'bodyStructuresTable'} size="small">
        <TableHead>
          <TableRow>
            {renderCheckboxHeader()}
            {renderActiveHeader()}
            {renderDescriptionHeader()}
            {renderMorphologyHeader()}
            {renderStructureHeader()}
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
        count={bodyStructuresToRender.length}
        page={currentPage}
        onPageChange={handleChangePage}
        rowsPerPage={currentRowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );
}

BodyStructuresTable.propTypes = {
  id: PropTypes.string,
  bodyStructures: PropTypes.array,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  count: PropTypes.number,
  onRowClick: PropTypes.func,
  onSetPage: PropTypes.func,
  order: PropTypes.string,
  hideCheckbox: PropTypes.bool,
  hideActive: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hideMorphology: PropTypes.bool,
  hideStructure: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideBarcode: PropTypes.bool
};

BodyStructuresTable.defaultProps = {
  bodyStructures: [],
  page: 0,
  rowsPerPage: 5,
  hideCheckbox: true,
  hideActive: false,
  hideDescription: false,
  hideMorphology: false,
  hideStructure: false,
  hidePatientName: true,
  hidePatientReference: true,
  hideBarcode: true
};

export default BodyStructuresTable;

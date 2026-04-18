// /imports/ui-fhir/molecularSequences/MolecularSequencesTable.jsx

import React from 'react';
import PropTypes from 'prop-types';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';

import { get, reverse } from 'lodash';

import { FhirUtilities } from '../../lib/FhirUtilities';
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

//===========================================================================
// MAIN COMPONENT

function MolecularSequencesTable(props) {
  logger.info('Rendering the MolecularSequencesTable');

  let {
    id,
    molecularSequences,
    selectedMolecularSequenceId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideType,
    hideCoordinateSystem,
    hideObservedSeq,
    hideReadCoverage,
    hidePatientName,
    hidePatientReference,
    hideBarcode,

    onRowClick,
    onSetPage,

    rowsPerPage,
    tableRowSize,
    dateFormat,
    formFactorLayout,
    count,

    page,
    order,

    ...otherProps
  } = props;

  // Form factor overrides
  const hidePatientNameFromProp = hidePatientName;
  const hideBarcodeFromProp = hideBarcode;

  if (formFactorLayout) {
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hidePatientName = true;
        hidePatientReference = true;
        hideCoordinateSystem = true;
        hideReadCoverage = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = true;
        hideReadCoverage = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "web":
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "desktop":
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "hdmi":
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
    }
  }

  //---------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(id) {
    if (props && (typeof onRowClick === "function")) {
      onRowClick(id);
    }
  }

  //---------------------------------------------------------------------
  // Column Rendering

  function renderTypeHeader() {
    if (!hideType) {
      return <TableCell className='type'>Type</TableCell>;
    }
  }
  function renderType(type) {
    if (!hideType) {
      return <TableCell className='type'>{type}</TableCell>;
    }
  }

  function renderCoordinateSystemHeader() {
    if (!hideCoordinateSystem) {
      return <TableCell className='coordinateSystem'>Coordinate System</TableCell>;
    }
  }
  function renderCoordinateSystem(coordinateSystem) {
    if (!hideCoordinateSystem) {
      return <TableCell className='coordinateSystem'>{coordinateSystem}</TableCell>;
    }
  }

  function renderObservedSeqHeader() {
    if (!hideObservedSeq) {
      return <TableCell className='observedSeq'>Observed Sequence</TableCell>;
    }
  }
  function renderObservedSeq(observedSeq) {
    if (!hideObservedSeq) {
      const truncated = observedSeq && observedSeq.length > 40
        ? observedSeq.substring(0, 40) + '...'
        : observedSeq;
      return (
        <TableCell className='observedSeq' sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {truncated}
        </TableCell>
      );
    }
  }

  function renderReadCoverageHeader() {
    if (!hideReadCoverage) {
      return <TableCell className='readCoverage'>Read Coverage</TableCell>;
    }
  }
  function renderReadCoverage(readCoverage) {
    if (!hideReadCoverage) {
      return <TableCell className='readCoverage'>{readCoverage}</TableCell>;
    }
  }

  function renderPatientNameHeader() {
    if (!hidePatientName) {
      return <TableCell className='patientDisplay'>Patient</TableCell>;
    }
  }
  function renderPatientName(patientDisplay) {
    if (!hidePatientName) {
      return <TableCell className='patientDisplay' style={{ minWidth: '140px' }}>{patientDisplay}</TableCell>;
    }
  }

  function renderPatientReferenceHeader() {
    if (!hidePatientReference) {
      return <TableCell className='patientReference'>Patient Reference</TableCell>;
    }
  }
  function renderPatientReference(patientReference) {
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference' style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {FhirUtilities.pluckReferenceId(patientReference)}
        </TableCell>
      );
    }
  }

  function renderBarcode(id) {
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell><span className="barcode helveticas">{idString}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader() {
    if (!hideBarcode) {
      return <TableCell>System ID</TableCell>;
    }
  }

  //---------------------------------------------------------------------
  // Pagination

  let paginationCount = 101;
  if (count) {
    paginationCount = count;
  }

  function handleChangePage(event, newPage) {
    if (typeof onSetPage === "function") {
      onSetPage(newPage);
    }
  }

  let paginationFooter;
  if (!disablePagination) {
    paginationFooter = <TablePagination
      component="div"
      rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      style={{ float: 'right', border: 'none' }}
    />;
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let molecularSequencesToRender = [];

  if (molecularSequences) {
    if (molecularSequences.length > 0) {
      let count = 0;

      let orderedMolecularSequences = molecularSequences;
      if (order === 'descending' || order === 'reverse') {
        orderedMolecularSequences = reverse([...molecularSequences]);
      }

      orderedMolecularSequences.forEach(function (molecularSequence) {
        if ((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)) {
          molecularSequencesToRender.push(FhirDehydrator.dehydrateMolecularSequence(molecularSequence));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  };

  if (molecularSequencesToRender.length === 0) {
    logger.trace('MolecularSequencesTable: No molecular sequences to render.');
  } else {
    for (let i = 0; i < molecularSequencesToRender.length; i++) {
      let selected = false;
      if (molecularSequencesToRender[i].id === selectedMolecularSequenceId) {
        selected = true;
      }
      if (tableRowSize === "small") {
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow className="molecularSequenceRow" key={i} style={rowStyle} onClick={handleRowClick.bind(this, molecularSequencesToRender[i]._id)} hover={true} selected={selected}>
          {renderType(get(molecularSequencesToRender[i], 'type', ''))}
          {renderCoordinateSystem(get(molecularSequencesToRender[i], 'coordinateSystem', ''))}
          {renderObservedSeq(get(molecularSequencesToRender[i], 'observedSeq', ''))}
          {renderReadCoverage(get(molecularSequencesToRender[i], 'readCoverage', ''))}
          {renderPatientName(get(molecularSequencesToRender[i], 'patientDisplay', ''))}
          {renderPatientReference(get(molecularSequencesToRender[i], 'patientReference', ''))}
          {renderBarcode(get(molecularSequencesToRender[i], '_id', ''))}
        </TableRow>
      );
    }
  }

  //---------------------------------------------------------------------
  // Actual Render Method

  return (
    <div id={id} className="tableWithPagination">
      <Table className='molecularSequencesTable' size={tableRowSize} aria-label="a dense table" {...otherProps}>
        <TableHead>
          <TableRow>
            {renderTypeHeader()}
            {renderCoordinateSystemHeader()}
            {renderObservedSeqHeader()}
            {renderReadCoverageHeader()}
            {renderPatientNameHeader()}
            {renderPatientReferenceHeader()}
            {renderBarcodeHeader()}
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

MolecularSequencesTable.propTypes = {
  id: PropTypes.string,
  molecularSequences: PropTypes.array,
  selectedMolecularSequenceId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideType: PropTypes.bool,
  hideCoordinateSystem: PropTypes.bool,
  hideObservedSeq: PropTypes.bool,
  hideReadCoverage: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onRowClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  order: PropTypes.oneOf(['ascending', 'descending', 'reverse'])
};

MolecularSequencesTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  hideCheckbox: true,
  hideType: false,
  hideCoordinateSystem: false,
  hideObservedSeq: false,
  hideReadCoverage: false,
  hidePatientName: false,
  hidePatientReference: true,
  hideBarcode: true,
  disablePagination: false,
  molecularSequences: [],
  order: 'ascending'
};

export default MolecularSequencesTable;

// /imports/ui-fhir/specimens/SpecimensTable.jsx

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

function SpecimensTable(props) {
  logger.info('Rendering the SpecimensTable');

  let {
    id,
    specimens,
    selectedSpecimenId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideStatus,
    hideType,
    hideAccessionIdentifier,
    hideCollectedDateTime,
    hideBodySite,
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
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  if (formFactorLayout) {
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hidePatientName = true;
        hidePatientReference = true;
        hideAccessionIdentifier = true;
        hideBodySite = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = true;
        hideBodySite = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "web":
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
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

  function renderStatusHeader() {
    if (!hideStatus) {
      return <TableCell className='status'>Status</TableCell>;
    }
  }
  function renderStatus(status) {
    if (!hideStatus) {
      return <TableCell className='status'>{status}</TableCell>;
    }
  }

  function renderTypeHeader() {
    if (!hideType) {
      return <TableCell className='type'>Type</TableCell>;
    }
  }
  function renderType(typeDisplay) {
    if (!hideType) {
      return <TableCell className='type'>{typeDisplay}</TableCell>;
    }
  }

  function renderAccessionIdentifierHeader() {
    if (!hideAccessionIdentifier) {
      return <TableCell className='accessionIdentifier'>Accession ID</TableCell>;
    }
  }
  function renderAccessionIdentifier(accessionIdentifier) {
    if (!hideAccessionIdentifier) {
      return <TableCell className='accessionIdentifier'>{accessionIdentifier}</TableCell>;
    }
  }

  function renderCollectedDateTimeHeader() {
    if (!hideCollectedDateTime) {
      return <TableCell className='collectedDateTime'>Collection Date</TableCell>;
    }
  }
  function renderCollectedDateTime(collectedDateTime) {
    if (!hideCollectedDateTime) {
      return <TableCell className='collectedDateTime'>{collectedDateTime}</TableCell>;
    }
  }

  function renderBodySiteHeader() {
    if (!hideBodySite) {
      return <TableCell className='bodySite'>Body Site</TableCell>;
    }
  }
  function renderBodySite(bodySite) {
    if (!hideBodySite) {
      return <TableCell className='bodySite'>{bodySite}</TableCell>;
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
  let specimensToRender = [];

  if (specimens) {
    if (specimens.length > 0) {
      let count = 0;

      let orderedSpecimens = specimens;
      if (order === 'descending' || order === 'reverse') {
        orderedSpecimens = reverse([...specimens]);
      }

      orderedSpecimens.forEach(function (specimen) {
        if ((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)) {
          specimensToRender.push(FhirDehydrator.dehydrateSpecimen(specimen));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  };

  if (specimensToRender.length === 0) {
    logger.trace('SpecimensTable: No specimens to render.');
  } else {
    for (let i = 0; i < specimensToRender.length; i++) {
      let selected = false;
      if (specimensToRender[i].id === selectedSpecimenId) {
        selected = true;
      }
      if (tableRowSize === "small") {
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow className="specimenRow" key={i} style={rowStyle} onClick={handleRowClick.bind(this, specimensToRender[i]._id)} hover={true} selected={selected}>
          {renderStatus(get(specimensToRender[i], 'status', ''))}
          {renderType(get(specimensToRender[i], 'typeDisplay', ''))}
          {renderAccessionIdentifier(get(specimensToRender[i], 'accessionIdentifier', ''))}
          {renderCollectedDateTime(get(specimensToRender[i], 'collectedDateTime', ''))}
          {renderBodySite(get(specimensToRender[i], 'bodySite', ''))}
          {renderPatientName(get(specimensToRender[i], 'patientDisplay', ''))}
          {renderPatientReference(get(specimensToRender[i], 'patientReference', ''))}
          {renderBarcode(get(specimensToRender[i], '_id', ''))}
        </TableRow>
      );
    }
  }

  //---------------------------------------------------------------------
  // Actual Render Method

  return (
    <div id={id} className="tableWithPagination">
      <Table className='specimensTable' size={tableRowSize} aria-label="a dense table" {...otherProps}>
        <TableHead>
          <TableRow>
            {renderStatusHeader()}
            {renderTypeHeader()}
            {renderAccessionIdentifierHeader()}
            {renderCollectedDateTimeHeader()}
            {renderBodySiteHeader()}
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

SpecimensTable.propTypes = {
  id: PropTypes.string,
  specimens: PropTypes.array,
  selectedSpecimenId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideType: PropTypes.bool,
  hideAccessionIdentifier: PropTypes.bool,
  hideCollectedDateTime: PropTypes.bool,
  hideBodySite: PropTypes.bool,
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

SpecimensTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  hideCheckbox: true,
  hideStatus: false,
  hideType: false,
  hideAccessionIdentifier: false,
  hideCollectedDateTime: false,
  hideBodySite: false,
  hidePatientName: false,
  hidePatientReference: true,
  hideBarcode: true,
  disablePagination: false,
  specimens: [],
  order: 'ascending'
};

export default SpecimensTable;

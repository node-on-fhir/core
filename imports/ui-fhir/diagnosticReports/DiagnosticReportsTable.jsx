// /imports/ui-fhir/diagnosticReports/DiagnosticReportsTable.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Button,
  Typography,
  IconButton
} from '@mui/material';

import moment from 'moment';
import { get, has } from 'lodash';

import { FhirUtilities } from '/imports/lib/FhirUtilities';
import { FhirDehydrator } from '/imports/lib/FhirDehydrator';

import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import { Session } from 'meteor/session';

function DiagnosticReportsTable(props){
  // Apply default props
  const {
    hideCheckbox = true,
    hideActionIcons = false,
    hideCode = false,
    hideCategory = false,
    hideStatus = false,
    hideEffectiveDate = false,
    hideSubject = true,
    hidePerformer = false,
    hideConclusion = false,
    hideBarcode = true,
    hidePatientReference = true,
    multiline = false,
    tableRowSize = 'medium',
    rowsPerPage: initialRowsPerPage = 5,
    dateFormat = "YYYY-MM-DD hh:mm a",
    ...otherProps
  } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  function handleChangePage(event, newPage){
    setPage(newPage);
    if(otherProps.onSetPage){
      otherProps.onSetPage(newPage);
    }
  }

  function handleChangeRowsPerPage(event){
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  function handleRowClick(id){
    console.log('DiagnosticReportsTable.handleRowClick', id);
    if(otherProps.onRowClick){
      otherProps.onRowClick(id);
    }
  }

  function renderActionIcons(diagnosticReport){
    if(!hideActionIcons){
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          <IconButton
            onClick={() => handleRowClick(get(diagnosticReport, '_id'))}
            size="small"
            aria-label="Preview"
          >
            <PreviewIcon style={iconStyle} />
          </IconButton>
          <IconButton
            onClick={() => handleRowClick(get(diagnosticReport, '_id'))}
            size="small"
            aria-label="Edit"
          >
            <EditIcon style={iconStyle} />
          </IconButton>
        </TableCell>
      );
    }
  }

  function renderStatus(status){
    if(status){
      return status;
    } else {
      return '';
    }
  }

  function renderDate(date){
    if(date){
      return moment(date).format('YYYY-MM-DD');
    } else {
      return '';
    }
  }

  function renderCode(diagnosticReport){
    // After dehydration, code is flattened to a simple string
    return get(diagnosticReport, 'code', '');
  }

  function renderCategory(diagnosticReport){
    // After dehydration, category is flattened to a simple string
    return get(diagnosticReport, 'category', '');
  }

  function renderConclusion(diagnosticReport){
    const conclusion = get(diagnosticReport, 'conclusion', '');
    if(conclusion){
      return <DescriptionIcon fontSize="small" color="action" titleAccess="Has conclusion" />;
    }
    return '';
  }

  function renderPerformer(diagnosticReport){
    let performer = get(diagnosticReport, 'performer[0].display', '');
    if(!performer){
      performer = get(diagnosticReport, 'performer[0].reference', '');
    }
    return performer;
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell><span className="barcode">{idString}</span></TableCell>
      );
    }
  }

  function renderPatientReference(diagnosticReport){
    if (!hidePatientReference) {
      return (
        <TableCell>
          {get(diagnosticReport, 'subject.reference', '')}
        </TableCell>
      );
    }
  }

  let tableRows = [];
  let diagnosticReportsToRender = [];
  let internalDateFormat = 'YYYY-MM-DD';

  if(otherProps.diagnosticReports){
    if(otherProps.diagnosticReports.length > 0){
      let count = 0;

      otherProps.diagnosticReports.forEach(function(diagnosticReport){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          diagnosticReportsToRender.push(FhirDehydrator.dehydrateDiagnosticReport(diagnosticReport));
        }
        count++;
      });

      diagnosticReportsToRender.forEach(function(diagnosticReport){
        let rowStyle = {
          cursor: 'pointer',
          height: '52px'
        }
        if(get(diagnosticReport, '_id') === otherProps.selectedDiagnosticReportId){
          rowStyle.backgroundColor = 'rgba(0,0,0,0.05)';
        }

        tableRows.push(
          <TableRow 
            key={get(diagnosticReport, '_id')} 
            style={rowStyle} 
            onClick={() => handleRowClick(get(diagnosticReport, '_id'))}
            hover
          >
            {renderActionIcons(diagnosticReport)}
            {renderBarcode(get(diagnosticReport, '_id'))}
            {multiline && (
              <TableCell style={{paddingTop: '16px'}}>
                <Typography variant="body1" gutterBottom>
                  {renderCode(diagnosticReport)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {renderCategory(diagnosticReport)} | {renderStatus(get(diagnosticReport, 'status'))}
                </Typography>
              </TableCell>
            )}
            {!multiline && !hideCode && (
              <TableCell style={{paddingTop: '16px'}}>
                {renderCode(diagnosticReport)}
              </TableCell>
            )}
            {!multiline && !hideCategory && (
              <TableCell>
                {renderCategory(diagnosticReport)}
              </TableCell>
            )}
            {!multiline && !hideStatus && (
              <TableCell style={{paddingTop: '16px'}}>
                {renderStatus(get(diagnosticReport, 'status'))}
              </TableCell>
            )}
            {!hideEffectiveDate && (
              <TableCell style={{paddingTop: '16px', minWidth: '140px'}}>
                {renderDate(get(diagnosticReport, 'effectiveDate'))}
              </TableCell>
            )}
            {!hideSubject && (
              <TableCell>
                {get(diagnosticReport, 'subjectDisplay', '')}
              </TableCell>
            )}
            {renderPatientReference(diagnosticReport)}
            {!hidePerformer && (
              <TableCell>
                {renderPerformer(diagnosticReport)}
              </TableCell>
            )}
            {!hideConclusion && (
              <TableCell>
                {renderConclusion(diagnosticReport)}
              </TableCell>
            )}
          </TableRow>
        );
      });
    }
  }

  let paginationFooter;
  if(!otherProps.disablePagination){
    paginationFooter = <TablePagination
      component="div"
      count={otherProps.count}
      page={page}
      onPageChange={handleChangePage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={[5, 10, 25, 100]}
    />
  }

  return(
    <div id={otherProps.id} className="tableWithPagination">
      <Table id='diagnosticReportsTable' size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {!hideActionIcons && (
              <TableCell className='actionIcons' style={{minWidth: '120px'}}>Actions</TableCell>
            )}
            {!hideBarcode && (
              <TableCell className='barcode'>System ID</TableCell>
            )}
            {multiline && (
              <TableCell>Report</TableCell>
            )}
            {!multiline && !hideCode && (
              <TableCell>Code</TableCell>
            )}
            {!multiline && !hideCategory && (
              <TableCell>Category</TableCell>
            )}
            {!multiline && !hideStatus && (
              <TableCell>Status</TableCell>
            )}
            {!hideEffectiveDate && (
              <TableCell style={{minWidth: '140px'}}>Date</TableCell>
            )}
            {!hideSubject && (
              <TableCell>Subject</TableCell>
            )}
            {!hidePatientReference && (
              <TableCell>Patient Reference</TableCell>
            )}
            {!hidePerformer && (
              <TableCell>Performer</TableCell>
            )}
            {!hideConclusion && (
              <TableCell style={{minWidth: '80px'}}>Notes</TableCell>
            )}
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

DiagnosticReportsTable.propTypes = {
  id: PropTypes.string,
  barcodes: PropTypes.bool,
  diagnosticReports: PropTypes.array,
  selectedDiagnosticReportId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideEffectiveDate: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hidePerformer: PropTypes.bool,
  hideConclusion: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  onRowClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,
  showMinutes: PropTypes.bool,
  dateFormat: PropTypes.string,
  showBarcode: PropTypes.bool,
  rowsPerPage: PropTypes.number,
  count: PropTypes.number,
  page: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,
  multiline: PropTypes.bool,
  order: PropTypes.string
};

export default DiagnosticReportsTable;
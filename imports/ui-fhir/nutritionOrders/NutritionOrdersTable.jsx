import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Chip,
  Box,
  Typography
} from '@mui/material';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import FhirUtilities from '../../lib/FhirUtilities';

function NutritionOrdersTable(props){
  const { 
    nutritionOrders = [],
    hideCheckbox = true,
    hideActionIcons = true,
    hideIdentifier = true,
    hideStatus = false,
    hideName = false,
    paginationLimit = 10,
    rowsPerPage = 10,
    page = 0,
    onSetPage,
    onSetRowsPerPage,
    onRowClick,
    ...otherProps
  } = props;

  const [currentPage, setCurrentPage] = useState(0);
  const [currentRowsPerPage, setCurrentRowsPerPage] = useState(rowsPerPage);

  // Data subscription would go here in a real implementation
  const data = useTracker(() => {
    // This would normally fetch from the NutritionOrders collection
    return [];
  }, []);

  const handleChangePage = (event, newPage) => {
    if(onSetPage){
      onSetPage(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if(onSetRowsPerPage){
      onSetRowsPerPage(newRowsPerPage);
    } else {
      setCurrentRowsPerPage(newRowsPerPage);
      setCurrentPage(0);
    }
  };

  const renderRows = () => {
    const startIndex = currentPage * currentRowsPerPage;
    const endIndex = startIndex + currentRowsPerPage;
    const displayData = nutritionOrders.slice(startIndex, endIndex);

    return displayData.map((nutritionOrder, index) => (
      <TableRow 
        key={nutritionOrder.id || nutritionOrder._id || index}
        hover
        sx={{ 
          '&:last-child td, &:last-child th': { border: 0 },
          cursor: onRowClick ? 'pointer' : 'default'
        }}
        onClick={() => {
          if(onRowClick && typeof onRowClick === 'function'){
            onRowClick(nutritionOrder.id || nutritionOrder._id);
          }
        }}
      >
        {!hideCheckbox && (
          <TableCell padding="checkbox">
            <Checkbox />
          </TableCell>
        )}
        {!hideIdentifier && (
          <TableCell>{get(nutritionOrder, 'identifier[0].value', get(nutritionOrder, 'id', ''))}</TableCell>
        )}
        {!hideStatus && (
          <TableCell>
            <Chip 
              label={get(nutritionOrder, 'status', '')}
              size="small"
              color={get(nutritionOrder, 'status') === 'active' ? 'success' : 'default'}
              variant={get(nutritionOrder, 'status') === 'active' ? 'filled' : 'outlined'}
            />
          </TableCell>
        )}
        {!hideName && (
          <TableCell>{get(nutritionOrder, 'patient.display', get(nutritionOrder, 'patient.reference', ''))}</TableCell>
        )}
        <TableCell>{get(nutritionOrder, 'dateTime', '')}</TableCell>
        <TableCell>{get(nutritionOrder, 'orderer.display', get(nutritionOrder, 'orderer.reference', ''))}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {get(nutritionOrder, 'oralDiet.type', []).map((type, idx) => (
              type.coding?.map((coding, cidx) => (
                <Chip 
                  key={`${idx}-${cidx}`}
                  label={coding.display || type.text || 'N/A'}
                  size="small"
                  sx={{ mb: 0.5 }}
                />
              ))
            ))}
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {get(nutritionOrder, 'supplement', []).map((supp, idx) => (
              <Chip 
                key={idx}
                label={get(supp, 'type.coding[0].display', get(supp, 'type.text', 'N/A'))}
                size="small"
                color="secondary"
                sx={{ mb: 0.5 }}
              />
            ))}
          </Box>
        </TableCell>
        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {get(nutritionOrder, 'oralDiet.instruction', '')}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div id="nutritionOrdersTable" className="tableWithPagination">
      <Table className='nutritionOrdersTable' size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              {!hideCheckbox && <TableCell padding="checkbox"></TableCell>}
              {!hideIdentifier && <TableCell>Identifier</TableCell>}
              {!hideStatus && <TableCell>Status</TableCell>}
              {!hideName && <TableCell>Patient</TableCell>}
              <TableCell>Date/Time</TableCell>
              <TableCell>Orderer</TableCell>
              <TableCell>Diet Type</TableCell>
              <TableCell>Supplement</TableCell>
              <TableCell>Instructions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nutritionOrders.length > 0 ? 
              renderRows() : 
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No nutrition orders found
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 100]}
          colSpan={3}
          count={nutritionOrders.length}
          rowsPerPage={currentRowsPerPage}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          style={{float: 'right', border: 'none'}}
        />
    </div>
  );
}

export default NutritionOrdersTable;
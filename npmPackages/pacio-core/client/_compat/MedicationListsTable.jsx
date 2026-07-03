// npmPackages/pacio-core/client/_compat/MedicationListsTable.jsx
//
// Compatibility shim. The Atmosphere pacio-core imported MedicationListsTable
// from the host app (/imports/ui-fhir/Lists/MedicationListsTable), which no
// longer exists. This is a minimal, functional replacement: a theme-compliant
// MUI table over the FHIR List resources, preserving the props the page passes
// (lists, selectedListId, onRowClick, showStatus).

import React from 'react';
import { get } from 'lodash';
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Typography
} from '@mui/material';

export function MedicationListsTable(props) {
  const { lists = [], selectedListId, onRowClick, showStatus = true } = props;

  if (!lists.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No medication lists found for this patient.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table id="medicationListsTable" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell>Date</TableCell>
            {showStatus && <TableCell>Status</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {lists.map(function(list) {
            const id = get(list, '_id', get(list, 'id'));
            return (
              <TableRow
                key={id}
                hover
                selected={id === selectedListId}
                onClick={function() { if (onRowClick) onRowClick(list); }}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{get(list, 'title', get(list, 'code.text', 'Medication List'))}</TableCell>
                <TableCell>{get(list, 'mode', '')}</TableCell>
                <TableCell>{get(list, 'date', '')}</TableCell>
                {showStatus && <TableCell>{get(list, 'status', '')}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default MedicationListsTable;

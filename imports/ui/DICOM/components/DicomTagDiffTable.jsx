// imports/ui/DICOM/components/DicomTagDiffTable.jsx
// Compact before/after review table for DicomProcessing.diffDicomTags()
// output — shows exactly what a de-identification / filter pass changed
// before any bytes leave the browser.

import React from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Typography
} from '@mui/material';

const ACTION_COLORS = {
  emptied: 'default',
  replaced: 'warning',
  dropped: 'error',
  remapped: 'info'
};

function DicomTagDiffTable({ diffs }) {
  if (!diffs || diffs.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
        No tag changes.
      </Typography>
    );
  }

  return (
    <Box sx={{ maxHeight: 320, overflow: 'auto', mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Table id="dicomTagDiffTable" size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Before</TableCell>
            <TableCell>After</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {diffs.map(function(diff) {
            return (
              <TableRow key={diff.name}>
                <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{diff.tag}</TableCell>
                <TableCell>{diff.name}</TableCell>
                <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{diff.before}</TableCell>
                <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{diff.after}</TableCell>
                <TableCell>
                  <Chip
                    label={diff.action}
                    size="small"
                    color={ACTION_COLORS[diff.action] || 'default'}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

export default DicomTagDiffTable;

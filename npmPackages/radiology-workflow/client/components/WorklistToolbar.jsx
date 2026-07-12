// npmPackages/radiology-workflow/client/components/WorklistToolbar.jsx

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// =============================================================================
// WORKLIST TOOLBAR - Bottom toolbar with pagination and refresh
// =============================================================================

function WorklistToolbar({
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRefresh
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: 1,
        borderColor: 'divider',
        px: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {onRefresh && (
          <Tooltip title="Refresh worklist">
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Typography variant="caption" color="text.secondary">
          {totalCount} total
        </Typography>
      </Box>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={function(e, newPage) {
          onPageChange(newPage);
        }}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={function(e) {
          onRowsPerPageChange(parseInt(e.target.value, 10));
        }}
        rowsPerPageOptions={[25, 50, 100]}
        sx={{
          '& .MuiTablePagination-toolbar': {
            minHeight: 40
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: '0.75rem'
          }
        }}
      />
    </Box>
  );
}

export default WorklistToolbar;

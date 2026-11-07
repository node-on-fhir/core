// npmPackages/radiology-workflow/client/components/WorklistToolbar.jsx

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  TablePagination,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// =============================================================================
// WORKLIST TOOLBAR - Bottom toolbar with pagination and refresh
// =============================================================================
//
// `actions` (optional ReactNode) renders table-scoped controls — column
// visibility toggles, density toggle — immediately left of the pagination.
// =============================================================================

function WorklistToolbar({
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  actions
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
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {actions}
        {actions && <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />}
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
    </Box>
  );
}

export default WorklistToolbar;

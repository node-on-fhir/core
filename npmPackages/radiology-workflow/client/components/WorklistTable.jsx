// npmPackages/radiology-workflow/client/components/WorklistTable.jsx

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  Box,
  Typography,
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useTheme, alpha } from '@mui/material/styles';
import { ColumnFilterControl } from './WorklistFilterRow.jsx';
import WorklistToolbar from './WorklistToolbar.jsx';

// =============================================================================
// WORKLIST TABLE - Shared dense data grid with filters, sorting, pagination
// =============================================================================
//
// Data-driven table used by both TechDashboard and ReadingDashboard.
// Columns are configured via a column definition array.
//
// Column definition:
// {
//   key: 'fieldName',           // Field key in row data
//   label: 'Column Header',     // Display label
//   width: 100,                 // Optional fixed width
//   sortable: true,             // Enable column sorting
//   filterable: true,           // Enable column filter
//   filterType: 'text'|'select',
//   filterOptions: [{value, label}],
//   render: (value, row) => <Component />  // Custom cell renderer
// }
// =============================================================================

function WorklistTable({
  columns,
  data,
  isLoading,
  emptyMessage,
  selectedRowId,
  onRowClick,
  onRefresh,
  highlightRow,   // (row) => boolean, for STAT row highlighting
  density = 'compact',
  renderExpandedContent,   // (row) => ReactNode, enables accordion rows
  defaultFilters   // { [colKey]: value } initial filter values
}) {
  const theme = useTheme();

  // -------------------------------------------------------------------------
  // Local state
  // -------------------------------------------------------------------------
  const [filters, setFilters] = useState(defaultFilters || {});
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [expandedRows, setExpandedRows] = useState({});

  // -------------------------------------------------------------------------
  // Filter + sort + paginate
  // -------------------------------------------------------------------------
  const processedData = useMemo(function() {
    let rows = data || [];

    // Apply filters
    const activeFilters = Object.entries(filters).filter(function(entry) {
      return entry[1] && entry[1].length > 0;
    });

    if (activeFilters.length > 0) {
      rows = rows.filter(function(row) {
        return activeFilters.every(function(entry) {
          const key = entry[0];
          const filterVal = entry[1].toLowerCase();
          const cellVal = String(row[key] || '').toLowerCase();

          // Find the column definition for this key
          const colDef = columns.find(function(c) { return c.key === key; });
          if (colDef && colDef.filterType === 'select') {
            return cellVal === filterVal;
          }
          // Text filter: substring match
          return cellVal.includes(filterVal);
        });
      });
    }

    // Apply sort
    if (sortKey) {
      rows = [...rows].sort(function(a, b) {
        const aVal = a[sortKey] || '';
        const bVal = b[sortKey] || '';
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, filters, sortKey, sortDirection, columns]);

  const totalCount = processedData.length;
  const paginatedData = processedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function setColumnFilter(key, value) {
    setFilters(function(prev) {
      const updated = Object.assign({}, prev);
      updated[key] = value;
      return updated;
    });
    setPage(0);
  }

  function toggleRowExpansion(rowId, event) {
    event.stopPropagation();
    setExpandedRows(function(prev) {
      return { ...prev, [rowId]: !prev[rowId] };
    });
  }

  const totalColSpan = columns.length + (renderExpandedContent ? 1 : 0);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TableContainer sx={{
        flex: 1,
        overflow: 'auto',
        ...(density === 'standard' && {
          border: 1,
          borderColor: 'divider',
          borderRadius: 1
        })
      }}>
        <Table
          size={density === 'compact' ? 'small' : 'medium'}
          stickyHeader
          sx={{
            '& .MuiTableCell-root': {
              py: density === 'compact' ? 0.5 : 1,
              px: density === 'compact' ? 1 : 1.5,
              fontSize: density === 'compact' ? '0.8rem' : '0.875rem',
              whiteSpace: 'nowrap'
            },
            '& .MuiTableCell-head': {
              fontWeight: 700,
              fontSize: density === 'compact' ? '0.75rem' : '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              backgroundColor: 'background.default'
            }
          }}
        >
          <TableHead>
            <TableRow>
              {renderExpandedContent && (
                <TableCell padding="checkbox" sx={{ width: 48, backgroundColor: 'background.default' }} />
              )}
              {columns.map(function(col) {
                return (
                  <TableCell
                    key={col.key}
                    sx={{ width: col.width || 'auto', minWidth: col.minWidth || 'auto', verticalAlign: 'top' }}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortKey === col.key}
                        direction={sortKey === col.key ? sortDirection : 'asc'}
                        onClick={function() { handleSort(col.key); }}
                        sx={{ fontSize: 'inherit' }}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                    {/* Filter control merged into the header cell */}
                    {col.filterable && (
                      <Box sx={{ mt: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                        <ColumnFilterControl
                          col={col}
                          value={filters[col.key]}
                          onChange={setColumnFilter}
                        />
                      </Box>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={totalColSpan} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColSpan} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage || 'No records found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(function(row) {
                const isSelected = selectedRowId && row._id === selectedRowId;
                const isHighlighted = highlightRow ? highlightRow(row) : false;
                const isExpanded = !!expandedRows[row._id];

                return (
                  <React.Fragment key={row._id}>
                    <TableRow
                      hover
                      selected={isSelected}
                      onClick={function() {
                        if (onRowClick) onRowClick(row);
                      }}
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        backgroundColor: isHighlighted
                          ? alpha(theme.palette.error.main, 0.06)
                          : 'inherit',
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.12)
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.18)
                        },
                        '& > .MuiTableCell-root': renderExpandedContent
                          ? { borderBottom: isExpanded ? 'none' : undefined }
                          : {}
                      }}
                    >
                      {renderExpandedContent && (
                        <TableCell padding="checkbox">
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={function(e) { toggleRowExpansion(row._id, e); }}
                          >
                            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                      )}
                      {columns.map(function(col) {
                        const value = row[col.key];
                        return (
                          <TableCell key={col.key}>
                            {col.render ? col.render(value, row) : (value || '-')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {renderExpandedContent && (
                      <TableRow>
                        <TableCell
                          colSpan={totalColSpan}
                          sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}
                        >
                          <Collapse in={isExpanded} timeout={300}>
                            <Box sx={{ py: 2, px: 1 }}>
                              {renderExpandedContent(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <WorklistToolbar
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={function(newVal) {
          setRowsPerPage(newVal);
          setPage(0);
        }}
        onRefresh={onRefresh}
      />
    </Box>
  );
}

export default WorklistTable;

// imports/ui-tables/ClickableTableRow.jsx
// BRIDGE: interim keyboard-operable row for tables not yet migrated to
// imports/ui-tables/ResourceTable.jsx (see docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md Task 4).
// Retire per-file as tables convert to ResourceTable.
//
// Known tradeoff (accepted for the bridge): role="button" overrides the tr's
// implicit row role, so AT table-navigation announces the row as one button
// instead of navigable cells. Gains WCAG 2.1.1 keyboard operability now; the
// durable fix (proper row semantics + in-cell action) lands with ResourceTable.
import React from 'react';
import TableRow from '@mui/material/TableRow';

export function ClickableTableRow({ onOpen, children, ...rest }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (typeof onOpen === 'function') onOpen(event);
    }
  }
  return (
    <TableRow
      hover
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      sx={{ cursor: 'pointer', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}
      {...rest}
    >
      {children}
    </TableRow>
  );
}

export default ClickableTableRow;

// imports/ui-tables/ClickableTableRow.jsx
// BRIDGE: interim keyboard-operable row for tables not yet migrated to
// imports/ui-tables/ResourceTable.jsx (see docs/superpowers/plans/2026-07-01-dynamicfhir-enhancement.md Task 4).
// Retire per-file as tables convert to ResourceTable.
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

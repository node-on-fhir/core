// npmPackages/pacio-core/client/components/ColumnAdornment.jsx
//
// A muted flourish beneath the last card in a column: small icon, a
// one-line caption, and an optional external link. Fills the dead space
// at the bottom of a column with quiet context instead of whitespace.

import React from 'react';
import { Box, Typography, Link, Divider } from '@mui/material';

/**
 * @param {Object} props
 * @param {React.ElementType} [props.icon] - MUI icon component
 * @param {string} props.caption - one-line muted caption
 * @param {string} [props.linkLabel] - optional external link text
 * @param {string} [props.href] - optional external link target (new tab)
 */
export function ColumnAdornment(props) {
  const IconComponent = props.icon || null;

  return (
    <Box sx={{ mt: 2, px: 2, textAlign: 'center' }}>
      <Divider sx={{ mb: 2, borderColor: 'divider' }} />
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
        {props.caption}
      </Typography>
      {props.href && props.linkLabel && (
        <Link
          href={props.href}
          target="_blank"
          rel="noopener"
          variant="caption"
          underline="hover"
          sx={{ display: 'inline-block', mt: 0.5 }}
        >
          {props.linkLabel}
        </Link>
      )}
      {IconComponent && (
        <IconComponent sx={{ display: 'block', mx: 'auto', fontSize: 20, color: 'text.disabled', mt: 0.75 }} />
      )}
    </Box>
  );
}

export default ColumnAdornment;

// imports/ui-fhir/visualizations/Sparkline.jsx

import React from 'react';
import { Box } from '@mui/material';

// Simple sparkline component placeholder
export function Sparkline({ data, width = 60, height = 20, color = '#4caf50' }) {
  if (!data || data.length === 0) {
    return <Box width={width} height={height} bgcolor="grey.200" />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  // Generate simple SVG path
  const pathData = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  return (
    <Box width={width} height={height}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <path
          d={pathData}
          stroke={color}
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </Box>
  );
}

export default Sparkline;
// imports/ui-fhir/visualizations/MiniChart.jsx

import React from 'react';
import { Box, Typography } from '@mui/material';

// Simple mini chart component placeholder
export function MiniChart({ data, type = 'line', showGrid = false, referenceRange }) {
  if (!data || data.length === 0) {
    return (
      <Box 
        width="100%" 
        height="100%" 
        bgcolor="grey.100" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <Typography variant="caption" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const values = data.map(d => typeof d.y === 'number' ? d.y : parseFloat(d.y) || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const width = 300;
  const height = 200;
  const padding = 20;

  // Generate path for line chart
  const pathData = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((values[index] - min) / range) * (height - 2 * padding);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  return (
    <Box width="100%" height="100%">
      <svg width={width} height={height} style={{ display: 'block', width: '100%', height: '100%' }}>
        {/* Grid lines */}
        {showGrid && (
          <g stroke="#e0e0e0" strokeWidth="0.5">
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + ratio * (height - 2 * padding)}
                x2={width - padding}
                y2={padding + ratio * (height - 2 * padding)}
              />
            ))}
          </g>
        )}
        
        {/* Reference range */}
        {referenceRange && (
          <rect
            x={padding}
            y={height - padding - ((referenceRange.high - min) / range) * (height - 2 * padding)}
            width={width - 2 * padding}
            height={((referenceRange.high - referenceRange.low) / range) * (height - 2 * padding)}
            fill="rgba(76, 175, 80, 0.1)"
            stroke="rgba(76, 175, 80, 0.3)"
            strokeWidth="1"
          />
        )}

        {/* Data line */}
        <path
          d={pathData}
          stroke="#2196f3"
          strokeWidth="2"
          fill="none"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((values[index] - min) / range) * (height - 2 * padding);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="#2196f3"
            />
          );
        })}
      </svg>
    </Box>
  );
}

export default MiniChart;
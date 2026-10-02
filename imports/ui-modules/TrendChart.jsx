// imports/ui-modules/TrendChart.jsx
//
// Lightweight SVG trend chart for the Inline Instruments family (blood
// pressure archetype): a reference band at a 6% text tint with dashed bounds,
// a 2px accent polyline, and an r3.5 endpoint dot. viewBox 0 0 520 110 with
// preserveAspectRatio "none" so it stretches to the card width, exactly like
// the design handoff. Deliberately NOT Nivo — BiomarkerTrendlineChart
// (imports/ui-modules/BiomarkerTrendline.jsx) remains the full-featured
// charting tool; this is the minimal in-stream sparkline+band rendition.
// Pure leaf: values in, JSX out.

import React from 'react';
import { useTheme, alpha } from '@mui/material/styles';

const VIEW_WIDTH = 520;
const VIEW_HEIGHT = 110;
const PAD_Y = 8;

export function TrendChart(props) {
  const theme = useTheme();
  const { values, low, high, height, ariaLabel } = props || {};
  const series = (values || []).filter(function (v) {
    return typeof v === 'number' && isFinite(v);
  });

  if (series.length === 0) { return null; }

  // Y domain spans the data and the reference band, padded 10%.
  const domainCandidates = series.slice();
  if (typeof low === 'number') { domainCandidates.push(low); }
  if (typeof high === 'number') { domainCandidates.push(high); }
  let min = Math.min.apply(null, domainCandidates);
  let max = Math.max.apply(null, domainCandidates);
  let span = max - min;
  if (!(span > 0)) { span = Math.abs(max) || 1; }
  min -= span * 0.1;
  max += span * 0.1;

  function yPix(v) {
    return PAD_Y + (1 - (v - min) / (max - min)) * (VIEW_HEIGHT - PAD_Y * 2);
  }

  const step = series.length > 1 ? VIEW_WIDTH / (series.length - 1) : 0;
  const points = series.map(function (v, i) {
    return (Math.round(i * step * 10) / 10) + ',' + (Math.round(yPix(v) * 10) / 10);
  }).join(' ');
  const lastX = series.length > 1 ? VIEW_WIDTH : 0;
  const lastY = yPix(series[series.length - 1]);

  const bandColor = alpha(theme.palette.text.primary, 0.06);
  const boundColor = alpha(theme.palette.text.primary, 0.15);
  const accent = theme.palette.primary.main;
  const hasBand = typeof low === 'number' && typeof high === 'number';

  return (
    <svg
      width="100%"
      height={height || 110}
      viewBox={'0 0 ' + VIEW_WIDTH + ' ' + VIEW_HEIGHT}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel || (series.length + ' values, latest ' + series[series.length - 1])}
    >
      {hasBand && (
        <rect x="0" y={yPix(high)} width={VIEW_WIDTH} height={Math.max(0, yPix(low) - yPix(high))} fill={bandColor} />
      )}
      {typeof high === 'number' && (
        <line x1="0" y1={yPix(high)} x2={VIEW_WIDTH} y2={yPix(high)} stroke={boundColor} strokeDasharray="3 4" />
      )}
      {typeof low === 'number' && (
        <line x1="0" y1={yPix(low)} x2={VIEW_WIDTH} y2={yPix(low)} stroke={boundColor} strokeDasharray="3 4" />
      )}
      <polyline points={points} fill="none" stroke={accent} strokeWidth="2" />
      <circle cx={lastX} cy={lastY} r="3.5" fill={accent} />
    </svg>
  );
}

export default TrendChart;

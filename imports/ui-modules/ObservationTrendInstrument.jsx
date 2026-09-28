// imports/ui-modules/ObservationTrendInstrument.jsx
//
// Inline Instrument card 2 — folded observation trend (blood pressure
// archetype). A group of consecutive Observations sharing a code renders as a
// TrendChart with a reference band, a tab per component series (Systolic /
// Diastolic / HR), avg·peak·out-of-range stats, and an "expand N rows" action
// that hands control back to the consumer (this component never fetches or
// reveals the raw rows itself).
//
// Presentational-first: pass `observations` (+ `tabs` with componentCode) and
// the series is computed via observationsToTrendSeries, or pass a pre-built
// `series` directly.

import React, { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { InstrumentCard } from './InstrumentCard';
import { TrendChart } from './TrendChart';
import { TrendBadge } from './TrendBadge';
import { observationsToTrendSeries } from './instrumentHelpers';
import TrendDetection from '/imports/lib/trendDetection.js';

function Tab({ label, selected, onClick }) {
  return (
    <Box
      component="span"
      role="tab"
      aria-selected={selected ? 'true' : 'false'}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={function (event) {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick(event);
        }
      }}
      sx={theme => ({
        cursor: 'pointer',
        px: 1,
        py: '3px',
        borderRadius: '6px',
        fontSize: 12,
        transition: 'all .15s',
        ...(selected ? {
          color: 'primary.main',
          boxShadow: 'inset 0 0 0 1px ' + theme.palette.primary.dark
        } : {
          color: 'text.secondary',
          '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
        })
      })}
    >
      {label}
    </Box>
  );
}

export function ObservationTrendInstrument(props) {
  const {
    kicker, title, observations, series, tabs, low, high,
    count, onExpand, meta, sx
  } = props || {};

  const tabList = tabs || [];
  const [activeTabKey, setActiveTabKey] = useState(tabList.length > 0 ? tabList[0].key : null);
  const activeTab = tabList.find(function (t) { return t.key === activeTabKey; }) || tabList[0];

  const computedSeries = useMemo(function () {
    if (series) { return series; }
    return observationsToTrendSeries(observations, {
      componentCode: activeTab ? activeTab.componentCode : undefined,
      low: low,
      high: high
    });
  }, [series, observations, activeTab, low, high]);

  const rowCount = count || (computedSeries ? computedSeries.count : 0);
  const defaultKicker = kicker || ('Observation ×' + rowCount.toLocaleString());

  // Clinically significant trend over the active series (PHR IG algorithm) —
  // renders as a badge over the chart only when it clears every gate.
  const trend = useMemo(function () {
    if (!computedSeries || !computedSeries.points) { return null; }
    return TrendDetection.detectTrend(
      computedSeries.points.map(function (point) {
        return { time: point.date, value: point.value };
      })
    );
  }, [computedSeries]);

  const stats = computedSeries ? [
    'Avg ' + Math.round(computedSeries.avg),
    'Peak ' + Math.round(computedSeries.peak),
    computedSeries.outOfRangeCount > 0 ? (computedSeries.outOfRangeCount + ' out of range') : null
  ].filter(Boolean) : [];

  return (
    <InstrumentCard
      kicker={defaultKicker}
      kickerRight={tabList.length > 0 && (
        <Box role="tablist" sx={{ display: 'flex', gap: '2px' }}>
          {tabList.map(function (tab) {
            return (
              <Tab
                key={tab.key}
                label={tab.label}
                selected={activeTab && tab.key === activeTab.key}
                onClick={function () { setActiveTabKey(tab.key); }}
              />
            );
          })}
        </Box>
      )}
      title={title}
      meta={meta || (stats.length > 0 && stats.map(function (stat, index) {
        return (
          <React.Fragment key={stat}>
            {index > 0 && <span>·</span>}
            <span>{stat}</span>
          </React.Fragment>
        );
      }))}
      action={onExpand && rowCount > 0 ? {
        label: 'expand ' + rowCount.toLocaleString() + ' rows',
        onClick: function () { onExpand(rowCount); }
      } : undefined}
      sx={sx}
    >
      {computedSeries ? (
        <Box sx={{ position: 'relative' }}>
          <TrendBadge trend={trend} sx={{ position: 'absolute', top: 4, right: 4 }} />
          <TrendChart
            values={computedSeries.points.map(function (point) { return point.value; })}
            low={computedSeries.low}
            high={computedSeries.high}
            ariaLabel={(title || 'Trend') + ': ' + computedSeries.count + ' values, avg ' + Math.round(computedSeries.avg)}
          />
        </Box>
      ) : (
        <Box sx={{ fontSize: 12, color: 'text.secondary', py: 2 }}>No plottable values</Box>
      )}
    </InstrumentCard>
  );
}

export default ObservationTrendInstrument;

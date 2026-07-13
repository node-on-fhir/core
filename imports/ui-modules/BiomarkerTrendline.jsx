// imports/ui-modules/BiomarkerTrendline.jsx
//
// Reusable Nivo line chart for a single biomarker series, plus a self-contained
// container that draws whichever biomarker the user has "featured" (starred) on
// /biomarkers-charting.
//
// Two exports:
//   - BiomarkerTrendlineChart (named): presentational. Given a pre-built series
//     object, renders just the <ResponsiveLine> body (no Card framing). Shared
//     with BiomarkerChartingPage so the ~120-line chart config lives in one place.
//   - BiomarkerTrendline (default): container. Reads the selected patient and the
//     featured biomarker code from Session, subscribes to Observations, builds the
//     series, and renders the chart. This is what App.jsx attaches as
//     Meteor.BiomarkerTrendline so extension packages (e.g. @orbital/chronicle)
//     can drop it in as <Meteor.BiomarkerTrendline />.

import React, { useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import { get } from 'lodash';
import moment from 'moment';

import { ResponsiveLine } from '@nivo/line';

import { Observations } from '../lib/schemas/SimpleSchemas/Observations';
import { FhirUtilities } from '/imports/lib/FhirUtilities';
import { SELECTED_BIOMARKER_CODE } from '/imports/lib/SessionKeys.js';

import {
  getObservationValue,
  getObservationValueLabel,
  getObservationDate,
  getObservationComponents,
  findPredominantUnit,
  getNormalizedValue
} from './biomarkerHelpers';

// Theme from Honeycomb's custom hook, captured at startup (Meteor.useTheme is
// not defined at module-load). Mirrors BiomarkerChartingPage's pattern.
let useAppTheme;
if (Meteor.isClient) {
  Meteor.startup(function() {
    useAppTheme = Meteor.useTheme;
  });
}

// Build the nivo series array for a biomarker series object.
// Component-based observations (e.g. PROMIS-10 summary scores) chart one
// series per distinct component; everything else charts a single series
// (with valueLabel carried through for coded/Likert answers).
function buildChartSeries(series, colorIndex) {
  if (series.hasComponents) {
    var seriesMap = new Map();
    series.observations.forEach(function(obs) {
      var date = getObservationDate(obs);
      if (!date) return;
      getObservationComponents(obs).forEach(function(component) {
        if (!seriesMap.has(component.key)) {
          seriesMap.set(component.key, { id: component.label, data: [] });
        }
        seriesMap.get(component.key).data.push({
          x: moment(date).format('YYYY-MM-DD'),
          y: component.value,
          sampleCount: null,
          valueLabel: null
        });
      });
    });
    return Array.from(seriesMap.values()).map(function(s, seriesIndex) {
      s.color = 'hsl(' + ((colorIndex * 60 + seriesIndex * 30) % 360) + ', 70%, 50%)';
      return s;
    });
  }

  return [{
    id: series.display,
    color: 'hsl(' + (colorIndex * 60) + ', 70%, 50%)',
    data: series.observations
      .filter(function(obs) {
        return getObservationDate(obs) && getObservationValue(obs) !== null;
      })
      .map(function(obs) {
        var sampledDataStr = get(obs, 'valueSampledData.data');
        var sampleCount = sampledDataStr ? sampledDataStr.split(' ').length : null;
        return {
          x: moment(getObservationDate(obs)).format('YYYY-MM-DD'),
          y: getNormalizedValue(obs, series.unit, series.isPercentageFraction),
          sampleCount: sampleCount,
          valueLabel: getObservationValueLabel(obs)
        };
      })
  }];
}

// ── Presentational: a single biomarker's Nivo line chart (no Card framing) ────
// Props:
//   series       { code, display, unit, isPercentageFraction, hasComponents, observations[] }
//   colorIndex   number — drives the series hue (default 0)
//   chartHeight  number(px) | string (e.g. '100%') for the chart container
//   isDark, cardBgColor, cardTextColor, borderColor — theme values
export function BiomarkerTrendlineChart(props) {
  const series = props.series;
  const colorIndex = props.colorIndex || 0;
  const chartHeight = props.chartHeight || 180;
  const cardBgColor = props.cardBgColor;
  const cardTextColor = props.cardTextColor;
  const borderColor = props.borderColor;

  const chartSeries = buildChartSeries(series, colorIndex);

  // Y-axis range with padding, spanning all series.
  const values = chartSeries.reduce(function(acc, s) {
    return acc.concat(s.data.map(function(point) { return point.y || 0; }));
  }, []);
  const minValue = values.length ? Math.min.apply(null, values) : 0;
  const maxValue = values.length ? Math.max.apply(null, values) : 0;
  const padding = (maxValue - minValue) * 0.1;

  // Date span for tick density.
  const filteredDates = series.observations
    .map(function(obs) { return getObservationDate(obs); })
    .filter(Boolean)
    .map(function(d) { return new Date(d).getTime(); });
  const dateSpanDays = filteredDates.length >= 2
    ? (Math.max.apply(null, filteredDates) - Math.min.apply(null, filteredDates)) / 86400000
    : 0;

  return (
    <div style={{ width: '100%', height: chartHeight }}>
      <ResponsiveLine
        data={chartSeries}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: cardTextColor,
                fontSize: 11
              },
              line: {
                stroke: borderColor
              }
            },
            legend: {
              text: {
                fill: cardTextColor,
                fontSize: 12
              }
            }
          },
          grid: {
            line: {
              stroke: borderColor
            }
          },
          crosshair: {
            line: {
              stroke: cardTextColor,
              strokeWidth: 1,
              strokeOpacity: 0.5
            }
          }
        }}
        margin={{
          top: 20,
          right: 40,
          bottom: 60,
          left: 60
        }}
        xScale={{
          type: 'time',
          format: '%Y-%m-%d',
          precision: 'day',
          useUTC: false
        }}
        yScale={{
          type: 'linear',
          min: minValue - padding,
          max: maxValue + padding,
          stacked: false,
          reverse: false
        }}
        yFormat=" >-.2f"
        axisBottom={{
          format: dateSpanDays > 730 ? '%b %Y' : '%b %d, %Y',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: 'Date',
          legendOffset: 50,
          legendPosition: 'middle',
          tickValues: dateSpanDays > 1825 ? 'every 1 year' :
                      dateSpanDays > 730 ? 'every 6 months' :
                      dateSpanDays > 365 ? 'every 3 months' :
                      dateSpanDays > 180 ? 'every 1 month' :
                      dateSpanDays > 60 ? 'every 2 weeks' :
                      dateSpanDays > 30 ? 'every 1 week' :
                      undefined
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: series.unit || 'Value',
          legendOffset: -45,
          legendPosition: 'middle',
          format: v => `${v}`
        }}
        curve='monotoneX'
        pointSize={6}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        useMesh={true}
        enableGridX={false}
        enableGridY={true}
        enableArea={false}
        animate={true}
        motionConfig="gentle"
        tooltip={({ point }) => (
          <div style={{
            background: cardBgColor,
            color: cardTextColor,
            padding: '9px 12px',
            border: `1px solid ${borderColor}`,
            borderRadius: '3px'
          }}>
            <div><strong>{point.data.xFormatted}</strong></div>
            {chartSeries.length > 1 && (
              <div style={{ fontSize: '0.85em' }}>{point.serieId}</div>
            )}
            <div>
              {point.data.valueLabel
                ? `${point.data.valueLabel} (${point.data.yFormatted})`
                : `${point.data.yFormatted} ${series.unit}`}
            </div>
            {point.data.sampleCount && (
              <div style={{ fontSize: '0.8em', opacity: 0.7 }}>
                Mean of {point.data.sampleCount} samples
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}

// Small centered hint used for every empty/loading state.
function TrendlineHint(props) {
  return (
    <Box sx={{
      height: '100%',
      minHeight: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        {props.children}
      </Typography>
    </Box>
  );
}

// ── Container: draws the featured biomarker for the selected patient ──────────
// Self-contained — reads patient + featured code from Session, subscribes to
// Observations, builds the series. Pass `embedded` so the chart fills its host
// card (height 100%) instead of the fixed 180px the charting page uses.
export function BiomarkerTrendline(props) {
  const embedded = props.embedded;

  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  const selectedPatient = useTracker(function() { return Session.get('selectedPatient'); }, []);
  const selectedPatientId = useTracker(function() { return Session.get('selectedPatientId'); }, []);
  const featuredCode = useTracker(function() { return Session.get(SELECTED_BIOMARKER_CODE); }, []);

  // Same Observations subscription as BiomarkerChartingPage (patient-filtered,
  // honoring the autoSubscribe setting).
  useTracker(function() {
    const selectedPatientTracker = Session.get('selectedPatient');
    const selectedPatientIdTracker = Session.get('selectedPatientId');
    const autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};
    if (selectedPatientTracker || selectedPatientIdTracker) {
      const fhirId = get(selectedPatientTracker, 'id');
      if (fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if (selectedPatientIdTracker) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientIdTracker);
      }
    }

    if (autoSubscribeEnabled) {
      const handle = Meteor.subscribe('autopublish.Observations', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Observations', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [selectedPatientId]);

  const observations = useTracker(function() {
    if (!selectedPatientId) return [];
    return Observations.find({}, { sort: { effectiveDateTime: -1 } }).fetch();
  }, [selectedPatientId]);

  // Build the single series for the featured code (mirrors the charting page's
  // per-code chartData construction).
  const series = useMemo(function() {
    if (!featuredCode || !observations.length) return null;

    const matched = observations.filter(function(obs) {
      const hasCode = get(obs, 'code.coding', []).some(function(c) { return c.code === featuredCode; });
      const hasText = get(obs, 'code.text') === featuredCode;
      return hasCode || hasText;
    });

    if (matched.length < 2) return null;

    const first = matched[0];
    const display = get(first, 'code.text') || get(first, 'code.coding.0.display') || featuredCode;
    const predominantUnit = findPredominantUnit(matched) || '';

    const maxVal = Math.max.apply(null, matched.map(function(o) { return getObservationValue(o) || 0; }));
    const isPercentageFraction = predominantUnit === '%' && maxVal > 0 && maxVal <= 1;

    const sorted = matched.slice().sort(function(a, b) {
      const dateA = getObservationDate(a);
      const dateB = getObservationDate(b);
      if (!dateA && !dateB) return 0;
      if (!dateA) return -1;
      if (!dateB) return 1;
      return new Date(dateA) - new Date(dateB);
    });

    const hasComponents = sorted.some(function(obs) {
      return getObservationComponents(obs).length > 0;
    });

    return {
      code: featuredCode,
      display: display,
      unit: predominantUnit,
      isPercentageFraction: isPercentageFraction,
      hasComponents: hasComponents,
      observations: sorted
    };
  }, [featuredCode, observations]);

  if (!selectedPatient && !selectedPatientId) {
    return <TrendlineHint>Select a patient to see biomarker trends.</TrendlineHint>;
  }

  if (!featuredCode) {
    return (
      <TrendlineHint>
        Feature a biomarker on the Biomarker Charting page to see its trend here.
      </TrendlineHint>
    );
  }

  if (!series) {
    return (
      <TrendlineHint>
        The featured biomarker has fewer than two measurements to chart for this patient.
      </TrendlineHint>
    );
  }

  return (
    <BiomarkerTrendlineChart
      series={series}
      colorIndex={0}
      chartHeight={embedded ? '100%' : 180}
      isDark={isDark}
      cardBgColor={cardBgColor}
      cardTextColor={cardTextColor}
      borderColor={borderColor}
    />
  );
}

export default BiomarkerTrendline;

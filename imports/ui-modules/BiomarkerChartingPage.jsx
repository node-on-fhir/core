// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-modules/BiomarkerChartingPage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Button, 
  Grid, 
  Card,
  CardHeader, 
  CardContent, 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Tooltip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { get, groupBy, orderBy, uniqBy } from 'lodash';
import moment from 'moment';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Observations } from '../lib/schemas/SimpleSchemas/Observations';
import { FhirUtilities } from '/imports/lib/FhirUtilities';
import { SELECTED_BIOMARKER_CODE } from '/imports/lib/SessionKeys.js';

import { ResponsiveLine } from '@nivo/line'

// Get theme from Honeycomb's custom hook
let useAppTheme;
if (Meteor.isClient) {
  Meteor.startup(function(){
    useAppTheme = Meteor.useTheme;
  });
}

// Helper functions to replace clinical:hl7-fhir-data-infrastructure components
function DynamicSpacer() {
  return <div style={{ height: 20 }} />;
}

function calcHeaderHeight() {
  return get(Meteor, 'settings.public.defaults.prominentHeader') ? 148 : 84;
}

function calcCanvasPaddingWidth() {
  return Session.get('appWidth') < 768 ? 20 : 40;
}

// Extract a chartable numeric value from any Observation type.
// valueQuantity → returns value directly.
// valueSampledData → returns mean of all sample points.
// valueInteger → returns the integer.
// valueCodeableConcept → returns the ordinalValue extension when present
//   (PROMIS/survey Likert answers carry ordinal scores on the answer coding).
// component[] → falls back to the first numeric component valueQuantity
//   (e.g. PROMIS-10 summary observations score via components).
// valueString → parsed when purely numeric.
function getObservationValue(obs) {
  var quantityValue = get(obs, 'valueQuantity.value');
  if (quantityValue !== undefined && quantityValue !== null) {
    return Number(quantityValue);
  }

  var sampledDataStr = get(obs, 'valueSampledData.data');
  if (sampledDataStr && typeof sampledDataStr === 'string') {
    var samples = sampledDataStr.split(' ').map(Number).filter(function(v) {
      return !isNaN(v);
    });
    if (samples.length > 0) {
      var sum = samples.reduce(function(acc, val) { return acc + val; }, 0);
      return sum / samples.length;
    }
  }

  var integerValue = get(obs, 'valueInteger');
  if (typeof integerValue === 'number' && isFinite(integerValue)) {
    return integerValue;
  }

  var codingExtensions = get(obs, 'valueCodeableConcept.coding[0].extension', []);
  var ordinalExt = codingExtensions.find(function(ext) {
    return (get(ext, 'url', '') + '').indexOf('ordinalValue') !== -1;
  });
  var ordinalValue = get(ordinalExt, 'valueDecimal');
  if (typeof ordinalValue === 'number' && isFinite(ordinalValue)) {
    return ordinalValue;
  }

  var components = get(obs, 'component', []);
  for (var i = 0; i < components.length; i++) {
    var componentValue = get(components[i], 'valueQuantity.value');
    if (componentValue !== undefined && componentValue !== null && isFinite(Number(componentValue))) {
      return Number(componentValue);
    }
  }

  var stringValue = get(obs, 'valueString');
  if (typeof stringValue === 'string' && stringValue.trim() !== '' && isFinite(Number(stringValue))) {
    return Number(stringValue);
  }

  return null;
}

// Human-readable label for coded answers ("Good", "Fair", ...); null when the
// observation carries a plain numeric value.
function getObservationValueLabel(obs) {
  return get(obs, 'valueCodeableConcept.coding[0].display')
    || get(obs, 'valueCodeableConcept.text')
    || null;
}

// Extract unit from valueQuantity, valueSampledData, or the first component.
function getObservationUnit(obs) {
  return get(obs, 'valueQuantity.unit')
    || get(obs, 'valueSampledData.origin.unit')
    || get(obs, 'component[0].valueQuantity.unit')
    || null;
}

// Extract per-component numeric series definitions from an observation.
// Returns [{ key, label, value, unit }] for numeric components; [] otherwise.
function getObservationComponents(obs) {
  var components = get(obs, 'component', []);
  var result = [];
  components.forEach(function(component) {
    var value = get(component, 'valueQuantity.value');
    if (value === undefined || value === null || !isFinite(Number(value))) { return; }
    var label = get(component, 'code.text')
      || get(component, 'code.coding[0].display')
      || get(component, 'code.coding[0].code', 'Component');
    var key = get(component, 'code.coding[0].code') || label;
    result.push({
      key: key,
      label: label,
      value: Number(value),
      unit: get(component, 'valueQuantity.unit') || null
    });
  });
  return result;
}

// Extract date from either effectiveDateTime or effectivePeriod.start.
function getObservationDate(obs) {
  return get(obs, 'effectiveDateTime') || get(obs, 'effectivePeriod.start') || null;
}

// Known unit conversions: key = "fromUnit→toUnit"
var UNIT_CONVERSIONS = {
  '[lb_av]→kg': function(v) { return v / 2.20462; },
  'lbs→kg': function(v) { return v / 2.20462; },
  'lb→kg': function(v) { return v / 2.20462; },
  'kg→[lb_av]': function(v) { return v * 2.20462; },
  'kg→lbs': function(v) { return v * 2.20462; },
  '[degF]→Cel': function(v) { return (v - 32) * 5 / 9; },
  'Cel→[degF]': function(v) { return v * 9 / 5 + 32; },
  '[in_i]→cm': function(v) { return v * 2.54; },
  'cm→[in_i]': function(v) { return v / 2.54; }
};

// Find the most common unit among observations
function findPredominantUnit(observations) {
  var unitCounts = {};
  observations.forEach(function(obs) {
    var unit = getObservationUnit(obs);
    if (unit) {
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    }
  });
  var predominant = null;
  var maxCount = 0;
  Object.keys(unitCounts).forEach(function(unit) {
    if (unitCounts[unit] > maxCount) {
      maxCount = unitCounts[unit];
      predominant = unit;
    }
  });
  return predominant;
}

// Get observation value normalized to targetUnit
function getNormalizedValue(obs, targetUnit, isPercentageFraction) {
  var rawValue = getObservationValue(obs);
  if (rawValue === null) return null;

  // Handle percentage values stored as fractions (SpO2: 0.95 → 95%)
  if (isPercentageFraction) {
    return rawValue * 100;
  }

  var obsUnit = getObservationUnit(obs);

  // Same unit or missing unit info — return as-is
  if (!obsUnit || !targetUnit || obsUnit === targetUnit) return rawValue;

  // Try direct conversion
  var key = obsUnit + '→' + targetUnit;
  if (UNIT_CONVERSIONS[key]) {
    return UNIT_CONVERSIONS[key](rawValue);
  }

  // No conversion available — return as-is
  return rawValue;
}

// Safely compute date range string from array of date strings.
function formatDateRange(dates) {
  var validTimestamps = dates
    .filter(function(d) { return d; })
    .map(function(d) { return new Date(d).getTime(); })
    .filter(function(t) { return !isNaN(t); });
  if (validTimestamps.length === 0) return 'No dates';
  return moment(Math.min.apply(null, validTimestamps)).format('MMM YYYY')
    + ' - '
    + moment(Math.max.apply(null, validTimestamps)).format('MMM YYYY');
}

var BIOMARKER_PANELS = [
  {
    label: 'Blood Panel',
    codes: [
      '2345-7',   // Glucose
      '3094-0',   // BUN
      '2160-0',   // Creatinine
      '2951-2',   // Sodium
      '2823-3',   // Potassium
      '2075-0',   // Chloride
      '2028-9',   // CO2/Bicarbonate
      '17861-6',  // Calcium
      '1751-7',   // Albumin
      '2885-2',   // Total Protein
      '1975-2',   // Bilirubin total
      '6768-6',   // Alkaline phosphatase
      '1920-8',   // AST
      '1742-6',   // ALT
      '33914-3',  // GFR
      '789-8',    // Erythrocytes/RBC
      '777-3',    // Platelets
      '6690-2',   // WBC
      '718-7',    // Hemoglobin
      '4544-3'    // Hematocrit
    ],
    textPatterns: ['glucose', 'urea nitrogen', 'creatinine', 'sodium', 'potassium',
      'chloride', 'carbon dioxide', 'calcium', 'albumin', 'protein', 'bilirubin',
      'alkaline phosphatase', 'aminotransferase', 'glomerular', 'erythrocyte',
      'platelet', 'leukocyte', 'hemoglobin', 'hematocrit']
  },
  {
    label: 'Lipid Panel',
    codes: ['2093-3', '2085-9', '18262-6', '2571-8', '13457-7'],
    textPatterns: ['cholesterol', 'ldl', 'hdl', 'triglyceride', 'lipoprotein']
  },
  {
    label: 'Hormone Panel',
    codes: [
      '3016-3',   // TSH
      '3053-6',   // Free T3
      '3024-7',   // Free T4
      '2986-8',   // Testosterone
      '14715-7',  // Estradiol
      '2143-6',   // Cortisol
      '2484-4',   // Insulin
      '4548-4',   // HbA1c (%)
      '83036-9',  // HbA1c (IFCC)
      '83088-2',  // DHEA-S
      '10501-5',  // Vitamin D 25-OH
      '2132-9'    // Vitamin B12
    ],
    textPatterns: ['thyroid', 'tsh', 'testosterone', 'estradiol', 'cortisol',
      'insulin', 'hemoglobin a1c', 'hba1c', 'dhea', 'vitamin d', 'vitamin b12',
      'progesterone', 'follicle stimulating', 'luteinizing']
  },
  {
    label: 'Vital Signs',
    codes: ['85354-9', '8480-6', '8462-4', '8867-4', '9279-1', '8310-5',
      '59408-5', '2708-6'],
    textPatterns: ['blood pressure', 'systolic', 'diastolic', 'heart rate',
      'respiratory rate', 'body temperature', 'oxygen saturation', 'spo2',
      'pulse']
  },
  {
    label: 'Fitness',
    codes: ['29463-7', '8302-2', '39156-5', '8867-4', '41950-7'],
    textPatterns: ['body weight', 'body height', 'body mass index', 'bmi',
      'heart rate', 'step', 'distance', 'energy burned', 'exercise',
      'vo2 max', 'active energy', 'basal energy', 'walking']
  },
  {
    label: 'Diving',
    codes: [],
    textPatterns: ['dive', 'depth', 'underwater', 'water temperature',
      'ascent rate', 'descent rate', 'surface interval']
  },
  {
    label: 'Metabolic',
    codes: ['2345-7', '4548-4', '83036-9', '2484-4', '29463-7', '39156-5',
      '2093-3', '2571-8'],
    textPatterns: ['glucose', 'hemoglobin a1c', 'hba1c', 'insulin',
      'body weight', 'body mass index', 'bmi', 'cholesterol', 'triglyceride',
      'fasting']
  },
  {
    label: 'Renal',
    codes: ['2160-0', '3094-0', '33914-3', '2951-2', '2823-3', '2075-0',
      '2028-9', '1751-7', '2885-2', '17861-6'],
    textPatterns: ['creatinine', 'urea nitrogen', 'bun', 'glomerular',
      'gfr', 'sodium', 'potassium', 'chloride', 'carbon dioxide',
      'bicarbonate', 'albumin', 'protein', 'calcium', 'phosphorus',
      'cystatin']
  },
  {
    label: 'Sleep',
    codes: [],
    textPatterns: ['sleep', 'resting heart rate', 'heart rate variability',
      'hrv', 'rem', 'deep sleep', 'awake', 'time in bed',
      'respiratory rate']
  }
];

// Given a panel definition and the discovered codeAnalysis array,
// return the code keys (code || text) that match the panel.
function getMatchingCodesForPanel(panel, codeAnalysis) {
  if (!codeAnalysis) return [];
  var chartable = codeAnalysis.filter(function(c) {
    return c.latestValue !== null && c.count >= 2;
  });
  return chartable
    .filter(function(c) {
      // Match by LOINC code
      if (c.code && panel.codes.indexOf(c.code) !== -1) return true;
      // Match by display text pattern (case-insensitive)
      var displayLower = ((c.display || '') + ' ' + (c.text || '')).toLowerCase();
      return panel.textPatterns.some(function(pat) {
        return displayLower.indexOf(pat.toLowerCase()) !== -1;
      });
    })
    .map(function(c) { return c.code || c.text; });
}

export function BiomarkerChartingPage(props){
  const navigate = useNavigate();

  // State management
  const [timescale, setTimescale] = useState(0);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [codeAnalysis, setCodeAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLoadingWarning, setShowLoadingWarning] = useState(false);
  const [starredCode, setStarredCode] = useState(function() {
    return Session.get(SELECTED_BIOMARKER_CODE) || null;
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const userHasCustomizedCodes = useRef(false);

  // Get current theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  // Layout calculations
  const headerHeight = calcHeaderHeight();
  const paddingWidth = calcCanvasPaddingWidth();
  const chartHeight = 180;
  
  // Get selected patient
  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  const selectedPatient = useTracker(() => Session.get('selectedPatient'), []);
  
  // Subscribe to Observations for the selected patient (matches ObservationsPage pattern)
  const isLoadingSubscription = useTracker(() => {
    const selectedPatientTracker = Session.get('selectedPatient');
    const selectedPatientIdTracker = Session.get('selectedPatientId');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

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
  
  // Fetch observations from local collection (subscription handles server-side filtering)
  const observations = useTracker(() => {
    if (!selectedPatientId) return [];
    const patientObs = Observations.find({}, { sort: { effectiveDateTime: -1 } }).fetch();
    console.log('Observations for patient:', patientObs.length);
    return patientObs;
  }, [selectedPatientId]);

  // Client-side date range filter
  const filteredObservations = useMemo(() => {
    if (!startDate && !endDate) return observations;
    return observations.filter(function(obs) {
      var dateStr = getObservationDate(obs);
      if (!dateStr) return false;
      var obsDate = dateStr.substring(0, 10); // YYYY-MM-DD
      if (startDate && obsDate < startDate) return false;
      if (endDate && obsDate > endDate) return false;
      return true;
    });
  }, [observations, startDate, endDate]);

  // Track loading duration and show warning if stuck
  useEffect(() => {
    const isLoading = !codeAnalysis && (isLoadingSubscription || isAnalyzing);
    if (isLoading && selectedPatientId) {
      setShowLoadingWarning(false);
      const timer = setTimeout(() => {
        setShowLoadingWarning(true);
      }, 15000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingWarning(false);
    }
  }, [isLoadingSubscription, isAnalyzing, codeAnalysis, selectedPatientId]);

  // Analyze observations to discover unique codes
  useEffect(() => {
    if (filteredObservations.length > 0) {
      console.log('Starting analysis of', filteredObservations.length, 'observations...');
      analyzeObservationCodes(filteredObservations);
    }
  }, [filteredObservations]);
  
  function analyzeObservationCodes(observationsToAnalyze) {
    console.log('Analyzing observation codes for', observationsToAnalyze.length, 'observations');
    
    try {
      const codeMap = new Map();
      
      observationsToAnalyze.forEach(obs => {
        // Extract code information
        let codeInfo = {
          system: null,
          code: null,
          display: null,
          text: get(obs, 'code.text'),
          count: 0,
          latestValue: null,
          latestValueLabel: null,
          unit: null,
          dates: []
        };
        
        // Try to get SNOMED code
        const snomedCoding = get(obs, 'code.coding', []).find(c => 
          c.system && c.system.includes('snomed')
        );
        
        // Try to get LOINC code
        const loincCoding = get(obs, 'code.coding', []).find(c => 
          c.system && c.system.includes('loinc')
        );
        
        // Use whichever coding we found
        const coding = snomedCoding || loincCoding || get(obs, 'code.coding[0]', {});
        
        if (coding.code) {
          codeInfo.system = coding.system;
          codeInfo.code = coding.code;
          codeInfo.display = coding.display || codeInfo.text;
        }
        
        // Create unique key for this code
        const codeKey = codeInfo.code || codeInfo.text || 'unknown';
        
        if (codeMap.has(codeKey)) {
          const existing = codeMap.get(codeKey);
          existing.count++;
          existing.dates.push(getObservationDate(obs));
          if (existing.latestValue === null) {
            var extractedValue = getObservationValue(obs);
            if (extractedValue !== null) {
              existing.latestValue = extractedValue;
              existing.latestValueLabel = getObservationValueLabel(obs);
              existing.unit = getObservationUnit(obs);
            }
          }
        } else {
          codeInfo.count = 1;
          codeInfo.dates = [getObservationDate(obs)];
          codeInfo.latestValue = getObservationValue(obs);
          codeInfo.latestValueLabel = getObservationValueLabel(obs);
          codeInfo.unit = getObservationUnit(obs);
          codeMap.set(codeKey, codeInfo);
        }
      });
      
      console.log('Code analysis complete. Found', codeMap.size, 'unique codes');
      
      // Convert map to array and sort by count
      const codeArray = Array.from(codeMap.values());
      const sortedCodes = orderBy(codeArray, ['count'], ['desc']);
      
      console.log('Top 5 codes:', sortedCodes.slice(0, 5).map(c => ({
        code: c.code || c.text,
        count: c.count,
        hasValue: c.latestValue !== null
      })));
      
      setCodeAnalysis(sortedCodes);
      
      // Auto-select top 6 codes with values and at least 2 measurements
      if (!userHasCustomizedCodes.current) {
        const topCodes = sortedCodes
          .filter(c => c.latestValue !== null && c.count >= 2)
          .slice(0, 6)
          .map(c => c.code || c.text);

        console.log('Auto-selected codes:', topCodes);
        setSelectedCodes(topCodes);
      }
      
    } catch (error) {
      console.error('Error analyzing observations:', error);
      setCodeAnalysis([]);
      setSelectedCodes([]);
    } finally {
      setIsAnalyzing(false);
      console.log('Analysis state set to false');
    }
  }
  
  // Get data for selected codes - only include codes with 2+ measurements
  const chartData = useMemo(() => {
    if (!selectedCodes.length || !filteredObservations.length) return [];

    return selectedCodes.map(codeId => {
      // Find observations for this code
      const codeObs = filteredObservations.filter(obs => {
        const hasCode = get(obs, 'code.coding', []).some(c => c.code === codeId);
        const hasText = get(obs, 'code.text') === codeId;
        return hasCode || hasText;
      });
      
      // Get display name
      const codeInfo = codeAnalysis?.find(c => c.code === codeId || c.text === codeId);
      const displayName = codeInfo?.display || codeInfo?.text || codeId;
      
      // Determine predominant unit for this code
      const predominantUnit = findPredominantUnit(codeObs) || codeInfo?.unit || '';

      // Detect percentage-as-fraction (SpO2 stored as 0.95 instead of 95%)
      const maxVal = Math.max(...codeObs.map(function(o) { return getObservationValue(o) || 0; }));
      const isPercentageFraction = predominantUnit === '%' && maxVal > 0 && maxVal <= 1;

      const sortedObs = codeObs.slice().sort(function(a, b) {
        var dateA = getObservationDate(a);
        var dateB = getObservationDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return -1;
        if (!dateB) return 1;
        return new Date(dateA) - new Date(dateB);
      });

      // Component-based observations (e.g. PROMIS-10 summary scores) chart one
      // series per distinct component; everything else charts a single series.
      const hasComponents = sortedObs.some(function(obs) {
        return getObservationComponents(obs).length > 0;
      });

      return {
        code: codeId,
        display: displayName,
        unit: predominantUnit,
        isPercentageFraction: isPercentageFraction,
        hasComponents: hasComponents,
        observations: sortedObs
      };
    }).filter(data => data.observations.length >= 2); // Only show graphs with 2+ data points
  }, [selectedCodes, filteredObservations, codeAnalysis]);

  // Float the starred biomarker's chart to the top; otherwise preserve order.
  const orderedChartData = useMemo(() => {
    if (!starredCode) return chartData;
    const idx = chartData.findIndex(d => d.code === starredCode);
    if (idx <= 0) return chartData;
    const copy = chartData.slice();
    const [featured] = copy.splice(idx, 1);
    copy.unshift(featured);
    return copy;
  }, [chartData, starredCode]);

  // Build the nivo series array for a chartData entry.
  function buildChartSeries(data, index) {
    if (data.hasComponents) {
      var seriesMap = new Map();
      data.observations.forEach(function(obs) {
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
      return Array.from(seriesMap.values()).map(function(series, seriesIndex) {
        series.color = 'hsl(' + ((index * 60 + seriesIndex * 30) % 360) + ', 70%, 50%)';
        return series;
      });
    }

    return [{
      id: data.display,
      color: 'hsl(' + (index * 60) + ', 70%, 50%)',
      data: data.observations
        .filter(function(obs) {
          return getObservationDate(obs) && getObservationValue(obs) !== null;
        })
        .map(function(obs) {
          var sampledDataStr = get(obs, 'valueSampledData.data');
          var sampleCount = sampledDataStr ? sampledDataStr.split(' ').length : null;
          return {
            x: moment(getObservationDate(obs)).format('YYYY-MM-DD'),
            y: getNormalizedValue(obs, data.unit, data.isPercentageFraction),
            sampleCount: sampleCount,
            valueLabel: getObservationValueLabel(obs)
          };
        })
    }];
  }
  
  // Format data for time display
  function getTimeFormat() {
    switch (timescale) {
      case 0: return 'MMM DD, YYYY';  // all
      case 1: return 'YYYY';           // year
      case 2: return 'YYYY [Q]Q';      // season/quarter
      case 3: return 'YYYY-MM';        // month
      case 4: return 'YYYY [W]ww';     // week
      case 5: return 'YYYY-MM-DD';     // day
      case 6: return 'HH:00';          // hour
      case 7: return 'HH:mm';          // minute
      default: return 'MMM DD, YYYY';
    }
  }
  
  function handleCodeToggle(codeId) {
    userHasCustomizedCodes.current = true;
    setSelectedCodes(prev => {
      if (prev.includes(codeId)) {
        return prev.filter(c => c !== codeId);
      } else {
        return [...prev, codeId];
      }
    });
  }

  // Star a single code as the "featured" biomarker. Starring auto-adds the code
  // to the charted set (if absent) and floats its card to the top. Clicking the
  // already-starred row unstars it but leaves its chart in place.
  function handleStarToggle(codeId) {
    userHasCustomizedCodes.current = true;
    if (starredCode === codeId) {
      setStarredCode(null);
      Session.set(SELECTED_BIOMARKER_CODE, null);
      return;
    }
    setStarredCode(codeId);
    Session.set(SELECTED_BIOMARKER_CODE, codeId);
    setSelectedCodes(prev => (prev.includes(codeId) ? prev : [...prev, codeId]));
  }
  
  function handleTimescaleChange(event) {
    setTimescale(event.target.value);
  }
  
  // Render content
  if (!selectedPatient) {
    const NoPatientSelectedCard = Meteor.NoPatientSelectedCard;
    if (NoPatientSelectedCard) {
      return <NoPatientSelectedCard />;
    }
    return null;
  }
  
  // Check if we're still loading
  const subscriptionLoading = isLoadingSubscription;
  

  
  // Don't show loading if we have already analyzed the data
  // The subscription might stay "loading" but if we have data, show it
  if (!codeAnalysis && (subscriptionLoading || isAnalyzing)) {
    return (
      <div style={{paddingTop: 40, paddingLeft: paddingWidth, paddingRight: paddingWidth}}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <Box display="flex" alignItems="center">
            <CircularProgress />
            <Typography variant="h6" style={{marginLeft: 20}}>
              {isAnalyzing ? `Analyzing ${observations.length} observations...` : 'Loading observations...'}
            </Typography>
          </Box>
          {showLoadingWarning && (
            <Alert severity="warning" sx={{ mt: 3, maxWidth: 600 }}>
              <AlertTitle>Loading is taking longer than expected</AlertTitle>
              This may happen if the patient has no observations, or the subscription is not responding.
              Try selecting a different patient, or check the browser console for errors.
            </Alert>
          )}
        </Box>
      </div>
    );
  }
  
  return (
    <div id='biomarkerChartingPage' style={{paddingTop: 40, paddingLeft: paddingWidth, paddingRight: paddingWidth}}>

      {/* Settings Modal */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: cardBgColor,
            color: cardTextColor
          },
          '& .MuiDialogTitle-root': { color: cardTextColor },
          '& .MuiDialogContent-root': {
            borderColor: borderColor
          },
          '& .MuiInputLabel-root': { color: cardTextColor },
          '& .MuiSelect-root': { color: cardTextColor },
          '& .MuiSelect-icon': { color: cardTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
          '& .MuiMenuItem-root': {
            color: cardTextColor
          },
          '& .MuiIconButton-root': { color: cardTextColor },
          '& .MuiButton-root': { color: cardTextColor }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            Biomarker Charting Settings
            <IconButton onClick={() => setSettingsOpen(false)} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="timescale-label">Timescale</InputLabel>
                <Select
                  labelId="timescale-label"
                  value={timescale}
                  onChange={handleTimescaleChange}
                  label="Timescale"
                >
                  <MenuItem value={0}>All</MenuItem>
                  <MenuItem value={1}>Year</MenuItem>
                  <MenuItem value={2}>Quarter</MenuItem>
                  <MenuItem value={3}>Month</MenuItem>
                  <MenuItem value={4}>Week</MenuItem>
                  <MenuItem value={5}>Day</MenuItem>
                  <MenuItem value={6}>Hour</MenuItem>
                  <MenuItem value={7}>Minute</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Panels:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {BIOMARKER_PANELS.map(function(panel) {
                  var matchCount = getMatchingCodesForPanel(panel, codeAnalysis).length;
                  return (
                    <Button
                      key={panel.label}
                      variant="outlined"
                      size="small"
                      disabled={matchCount === 0}
                      onClick={function() {
                        userHasCustomizedCodes.current = true;
                        setSelectedCodes(getMatchingCodesForPanel(panel, codeAnalysis));
                      }}
                      sx={{
                        textTransform: 'none',
                        borderColor: borderColor,
                        color: cardTextColor,
                        '&:hover': {
                          borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
                        },
                        '&.Mui-disabled': {
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                        }
                      }}
                    >
                      {panel.label} ({matchCount})
                    </Button>
                  );
                })}
                {/* Utility buttons separated by a small divider */}
                <Box sx={{ borderLeft: `1px solid ${borderColor}`, mx: 0.5 }} />
                <Button variant="text" size="small"
                  onClick={function() {
                    userHasCustomizedCodes.current = true;
                    var all = codeAnalysis
                      .filter(function(c) { return c.latestValue !== null && c.count >= 2; })
                      .map(function(c) { return c.code || c.text; });
                    setSelectedCodes(all);
                  }}
                  sx={{ textTransform: 'none', color: cardTextColor }}
                >
                  Select All
                </Button>
                <Button variant="text" size="small"
                  onClick={function() { userHasCustomizedCodes.current = true; setSelectedCodes([]); }}
                  sx={{ textTransform: 'none', color: cardTextColor }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Select Biomarkers to Display:
              </Typography>
              <Typography variant="body2" sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }} gutterBottom>
                Click chips to toggle biomarkers on/off. Only biomarkers with 2+ measurements will display charts.
              </Typography>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                maxHeight: '300px',
                overflow: 'auto',
                padding: '12px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5'
              }}>
                {codeAnalysis?.filter(c => c.latestValue !== null && c.count >= 2).map(code => (
                  <Chip
                    key={code.code || code.text}
                    label={`${code.display || code.text} (${code.count})`}
                    onClick={() => handleCodeToggle(code.code || code.text)}
                    variant={selectedCodes.includes(code.code || code.text) ? "filled" : "outlined"}
                    color={selectedCodes.includes(code.code || code.text) ? "primary" : "default"}
                    size="small"
                    sx={!selectedCodes.includes(code.code || code.text) ? {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                      color: cardTextColor,
                      borderColor: borderColor
                    } : {}}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3} style={{marginBottom: '84px'}}>
        
        {/* Two column layout - Table on left, Graphs on right */}
        {codeAnalysis && codeAnalysis.length > 0 && (
          <>
            {/* Date Range Filter */}
            <Grid item xs={12}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                border: `1px solid ${borderColor}`,
                bgcolor: cardBgColor
              }}>
                <Typography variant="body2" sx={{ color: cardTextColor, fontWeight: 500, mr: 0.5 }}>
                  Date Range:
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  label="From"
                  value={startDate}
                  onChange={function(e) { setStartDate(e.target.value); }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: 170,
                    '& .MuiInputBase-input': { color: cardTextColor },
                    '& .MuiInputLabel-root': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
                    '& .MuiInputBase-input::-webkit-calendar-picker-indicator': isDark ? { filter: 'invert(1)' } : {}
                  }}
                />
                <TextField
                  type="date"
                  size="small"
                  label="To"
                  value={endDate}
                  onChange={function(e) { setEndDate(e.target.value); }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: 170,
                    '& .MuiInputBase-input': { color: cardTextColor },
                    '& .MuiInputLabel-root': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
                    '& .MuiInputBase-input::-webkit-calendar-picker-indicator': isDark ? { filter: 'invert(1)' } : {}
                  }}
                />
                {(startDate || endDate) && (
                  <>
                    <Tooltip title="Clear date range">
                      <IconButton
                        size="small"
                        onClick={function() { setStartDate(''); setEndDate(''); }}
                        sx={{ color: cardTextColor }}
                        aria-label="Clear date range"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                      Showing {filteredObservations.length} of {observations.length} observations
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>

            {/* Left Column - Discovered Observation Codes Table */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                bgcolor: cardBgColor,
                color: cardTextColor,
                '& .MuiCardHeader-title': { color: cardTextColor },
                '& .MuiTableCell-root': {
                  color: cardTextColor,
                  borderColor: borderColor
                },
                '& .MuiTableCell-head': {
                  bgcolor: cardBgColor,
                  color: cardTextColor,
                  fontWeight: 'bold'
                },
                '& .MuiTypography-root': {
                  color: cardTextColor
                },
                '& .MuiTypography-colorTextSecondary': {
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                },
                '& .MuiIconButton-root': {
                  color: cardTextColor,
                  borderColor: borderColor
                }
              }}>
                <CardHeader
                  title="Discovered Observation Codes"
                  action={
                    <IconButton
                      onClick={() => setSettingsOpen(true)}
                      aria-label="settings"
                      sx={{
                        border: `1px solid ${borderColor}`,
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <SettingsIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <TableContainer component={Paper} variant="outlined" sx={{
                    bgcolor: cardBgColor,
                    borderColor: borderColor
                  }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 1, width: 48 }} align="center" padding="none">
                            <Tooltip title="Feature a biomarker">
                              <StarBorderIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>Code / System</TableCell>
                          <TableCell sx={{ py: 1 }}>Display Name / Date Range</TableCell>
                          <TableCell sx={{ py: 1 }} align="right">Latest Value</TableCell>
                          <TableCell sx={{ py: 1 }}>Unit</TableCell>
                          <TableCell sx={{ py: 1 }} align="center">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {codeAnalysis.slice(0, 20).map((code, index) => {
                          const codeKey = code.code || code.text;
                          const isChartable = code.latestValue !== null && code.count >= 2;
                          const isStarred = starredCode === codeKey;
                          return (
                          <TableRow key={index}>
                            <TableCell sx={{ py: '10px', width: 48 }} align="center" padding="none">
                              <Tooltip title={isChartable ? (isStarred ? 'Unfeature' : 'Feature this biomarker') : 'Needs 2+ measurements to chart'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={!isChartable}
                                    onClick={function() { handleStarToggle(codeKey); }}
                                    aria-label={isStarred ? 'Unfeature biomarker' : 'Feature biomarker'}
                                    sx={{ color: isStarred ? 'primary.main' : cardTextColor }}
                                  >
                                    {isStarred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {code.code || 'N/A'}
                                </Typography>
                                <Typography variant="caption" sx={{
                                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                                }}>
                                  {code.system ? code.system.split('/').pop() : 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }}>
                              <Box>
                                <Typography variant="body2">
                                  {code.display || code.text || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" sx={{
                                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                                }}>
                                  {formatDateRange(code.dates)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }} align="right">
                              <Typography variant="body2">
                                {code.latestValue === null ? 'N/A'
                                  : (code.latestValueLabel
                                      ? `${code.latestValueLabel} (${code.latestValue})`
                                      : code.latestValue)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }}>
                              <Typography variant="body2">
                                {code.unit || ''}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }} align="center">
                              <Chip
                                label={code.count}
                                size="small"
                                color={code.count >= 10 ? "primary" : "default"}
                                variant={code.count >= 10 ? "filled" : "outlined"}
                                sx={code.count < 10 ? {
                                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                                  color: cardTextColor,
                                  borderColor: borderColor
                                } : {}}
                              />
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Right Column - All Charts */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {chartData.map((data, index) => {
                  const series = buildChartSeries(data, index);

                  // Calculate Y-axis range with some padding, spanning all series
                  const values = series.reduce(function(acc, s) {
                    return acc.concat(s.data.map(function(point) { return point.y || 0; }));
                  }, []);
                  const minValue = values.length ? Math.min(...values) : 0;
                  const maxValue = values.length ? Math.max(...values) : 0;
                  const padding = (maxValue - minValue) * 0.1;

                  // Calculate date span for tick density
                  const filteredDates = data.observations
                    .map(function(obs) { return getObservationDate(obs); })
                    .filter(Boolean)
                    .map(function(d) { return new Date(d).getTime(); });
                  const dateSpanDays = filteredDates.length >= 2
                    ? (Math.max.apply(null, filteredDates) - Math.min.apply(null, filteredDates)) / 86400000
                    : 0;

                  return (
                    <Grid item xs={12} key={data.code}>
                      <Card sx={{
                        bgcolor: cardBgColor,
                        color: cardTextColor,
                        '& .MuiCardHeader-title': { color: cardTextColor },
                        '& .MuiCardHeader-subheader': {
                          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                        }
                      }}>
                <CardHeader
                  title={data.display}
                  subheader={`${data.observations.length} measurements`}
                  style={{paddingBottom: '0px'}}
                />
                <CardContent style={{paddingTop: '0px'}}>
                  <div style={{ width: '100%', height: chartHeight }}>
                    <ResponsiveLine
                      data={series}
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
                        legend: data.unit || 'Value',
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
                          {series.length > 1 && (
                            <div style={{ fontSize: '0.85em' }}>{point.serieId}</div>
                          )}
                          <div>
                            {point.data.valueLabel
                              ? `${point.data.valueLabel} (${point.data.yFormatted})`
                              : `${point.data.yFormatted} ${data.unit}`}
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
                </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
                
                {chartData.length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{
                      bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                      color: cardTextColor,
                      '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
                      '& .MuiAlertTitle-root': { color: cardTextColor }
                    }}>
                      <AlertTitle>No Charts Selected</AlertTitle>
                      Select biomarkers from the chips above to display their charts. Only biomarkers with 2 or more measurements can be charted.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </div>
  );
}

export default BiomarkerChartingPage;
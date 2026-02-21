// packages/international-patient-summary/client/IpsContent.jsx

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Meteor } from 'meteor/meteor';

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Collapse,
  useTheme
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import WarningIcon from '@mui/icons-material/Warning';
import MedicationIcon from '@mui/icons-material/Medication';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DevicesIcon from '@mui/icons-material/Devices';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PeopleIcon from '@mui/icons-material/People';
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman';
import GavelIcon from '@mui/icons-material/Gavel';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';

import IPSProblemsSection from './sections/IPSProblemsSection';
import IPSAllergiesSection from './sections/IPSAllergiesSection';
import IPSMedicationsSection from './sections/IPSMedicationsSection';
import IPSImmunizationsSection from './sections/IPSImmunizationsSection';
import IPSDiagnosticResultsSection from './sections/IPSDiagnosticResultsSection';
import IPSProceduresSection from './sections/IPSProceduresSection';
import IPSMedicalDevicesSection from './sections/IPSMedicalDevicesSection';
import IPSVitalSignsSection from './sections/IPSVitalSignsSection';
import IPSSocialHistorySection from './sections/IPSSocialHistorySection';
import IPSPregnancySection from './sections/IPSPregnancySection';
import IPSAdvanceDirectivesSection from './sections/IPSAdvanceDirectivesSection';
import IPSFunctionalStatusSection from './sections/IPSFunctionalStatusSection';
import IPSPlanOfCareSection from './sections/IPSPlanOfCareSection';
import IPSPastProblemsSection from './sections/IPSPastProblemsSection';

// Use Meteor.useTheme pattern for Honeycomb dark mode support
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

// IPS Sections according to the specification
export const ipsSections = [
  { label: 'Problems',            key: 'problems',          required: true,      icon: <LocalHospitalIcon /> },
  { label: 'Allergies',           key: 'allergies',         required: true,      icon: <WarningIcon /> },
  { label: 'Medications',         key: 'medications',       required: true,      icon: <MedicationIcon /> },
  { label: 'Immunizations',       key: 'immunizations',     recommended: true,   icon: <VaccinesIcon /> },
  { label: 'Diagnostic Results',  key: 'diagnosticResults', recommended: true,   icon: <BiotechIcon /> },
  { label: 'Procedures',          key: 'procedures',        recommended: true,   icon: <MedicalServicesIcon /> },
  { label: 'Medical Devices',     key: 'medicalDevices',    recommended: true,   icon: <DevicesIcon /> },
  { label: 'Vital Signs',         key: 'vitalSigns',        optional: true,      icon: <MonitorHeartIcon /> },
  { label: 'Social History',      key: 'socialHistory',     optional: true,      icon: <PeopleIcon /> },
  { label: 'Pregnancy',           key: 'pregnancy',         optional: true,      icon: <PregnantWomanIcon /> },
  { label: 'Advance Directives',  key: 'advanceDirectives', optional: true,      icon: <GavelIcon /> },
  { label: 'Functional Status',   key: 'functionalStatus',  optional: true,      icon: <AccessibilityIcon /> },
  { label: 'Plan of Care',        key: 'planOfCare',        optional: true,      icon: <AssignmentIcon /> },
  { label: 'Past Problems',       key: 'pastProblems',      optional: true,      icon: <HistoryIcon /> }
];

const sectionComponents = [
  <IPSProblemsSection />,
  <IPSAllergiesSection />,
  <IPSMedicationsSection />,
  <IPSImmunizationsSection />,
  <IPSDiagnosticResultsSection />,
  <IPSProceduresSection />,
  <IPSMedicalDevicesSection />,
  <IPSVitalSignsSection />,
  <IPSSocialHistorySection />,
  <IPSPregnancySection />,
  <IPSAdvanceDirectivesSection />,
  <IPSFunctionalStatusSection />,
  <IPSPlanOfCareSection />,
  <IPSPastProblemsSection />
];

function buildInitialExpanded(expanded) {
  if (expanded) {
    const all = {};
    ipsSections.forEach(function(s) {
      all[s.key] = true;
    });
    return all;
  }
  return {
    problems: true,
    allergies: true,
    medications: true,
    immunizations: false,
    diagnosticResults: false,
    procedures: false,
    medicalDevices: false,
    vitalSigns: false,
    socialHistory: false,
    pregnancy: false,
    advanceDirectives: false,
    functionalStatus: false,
    planOfCare: false,
    pastProblems: false
  };
}

const IpsContent = forwardRef(function IpsContent(props, ref) {
  const { expanded } = props;
  const theme = useTheme();

  const [expandedSections, setExpandedSections] = useState(function() {
    return buildInitialExpanded(expanded);
  });

  // Honeycomb dark mode
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  function toggleSection(sectionKey) {
    setExpandedSections(function(prev) {
      return { ...prev, [sectionKey]: !prev[sectionKey] };
    });
  }

  function expandAll() {
    const all = {};
    ipsSections.forEach(function(s) {
      all[s.key] = true;
    });
    setExpandedSections(all);
  }

  function collapseAll() {
    const all = {};
    ipsSections.forEach(function(s) {
      all[s.key] = false;
    });
    setExpandedSections(all);
  }

  useImperativeHandle(ref, function() {
    return { expandAll, collapseAll };
  });

  const requiredSections = ipsSections.filter(function(s) { return s.required; });
  const recommendedSections = ipsSections.filter(function(s) { return s.recommended; });
  const optionalSections = ipsSections.filter(function(s) { return s.optional; });

  function renderSectionCard(section) {
    const idx = ipsSections.indexOf(section);
    return (
      <Card key={section.key} sx={{
        mb: 2, borderRadius: 2,
        bgcolor: cardBgColor,
        color: cardTextColor,
        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)'
        },
        '& .MuiTableCell-root': {
          color: cardTextColor,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
        },
        '& .MuiTableCell-head': {
          bgcolor: isDark ? '#252525' : '#fafafa',
          color: cardTextColor,
          fontWeight: 'bold'
        },
        '& .MuiAlert-standardInfo': {
          bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : undefined,
          color: isDark ? cardTextColor : undefined
        },
        '& .MuiAlert-standardInfo .MuiAlert-icon': {
          color: isDark ? '#90caf9' : undefined
        },
        '& .MuiChip-colorDefault': {
          color: isDark ? cardTextColor : undefined,
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : undefined
        },
        '& .MuiChip-outlined': {
          borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined,
          color: isDark ? cardTextColor : undefined
        }
      }}>
        <CardHeader
          avatar={
            <Avatar sx={{
              bgcolor: isDark ? 'rgba(144, 202, 249, 0.15)' : alpha(theme.palette.primary.main, 0.1),
              color: isDark ? '#90caf9' : theme.palette.primary.main
            }}>
              {section.icon}
            </Avatar>
          }
          action={
            <IconButton onClick={function() { toggleSection(section.key); }} size="small" sx={{ color: cardTextColor }}>
              {expandedSections[section.key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
          title={<Typography variant="h6" sx={{ color: cardTextColor }}>{section.label}</Typography>}
          sx={{ cursor: 'pointer' }}
          onClick={function() { toggleSection(section.key); }}
        />
        <Collapse in={expandedSections[section.key]} timeout="auto" unmountOnExit>
          <Divider />
          <CardContent sx={{ pt: 2, pb: 2 }}>
            {sectionComponents[idx]}
          </CardContent>
        </Collapse>
      </Card>
    );
  }

  function renderCategoryHeader(label) {
    return (
      <Box sx={{ mb: 2, mt: 1 }}>
        <Typography variant="overline" sx={{
          fontWeight: 600,
          letterSpacing: 1.5,
          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
        }}>
          {label}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {renderCategoryHeader('Required Sections')}
      {requiredSections.map(renderSectionCard)}

      {renderCategoryHeader('Recommended Sections')}
      {recommendedSections.map(renderSectionCard)}

      {renderCategoryHeader('Optional Sections')}
      {optionalSections.map(renderSectionCard)}
    </Box>
  );
});

export default IpsContent;

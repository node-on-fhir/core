// packages/hipaa-compliance/client/PolicyPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { get } from 'lodash';
import {
  Container,
  Paper,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
// Removed dependency on hl7-fhir-data-infrastructure

// Policy definitions with titles and content
const policyDefinitions = {
  'key_definitions': {
    title: 'Key Definitions',
    description: 'Important terms and definitions used throughout HIPAA policies'
  },
  '3rd_party_policy': {
    title: '3rd Party Policy',
    description: 'Policies regarding third-party access and business associates'
  },
  'approved_tools_policy': {
    title: 'Approved Tools Policy',
    description: 'List of approved tools and software for handling PHI'
  },
  'auditing_policy': {
    title: 'Auditing Policy',
    description: 'Policies for audit logging and monitoring'
  },
  'breach_policy': {
    title: 'Breach Policy',
    description: 'Procedures for handling data breaches'
  },
  'configuration_management_policy': {
    title: 'Configuration Management Policy',
    description: 'System configuration and change management policies'
  },
  'data_integrity_policy': {
    title: 'Data Integrity Policy',
    description: 'Ensuring data accuracy and consistency'
  },
  'data_management_policy': {
    title: 'Data Management Policy',
    description: 'Data handling, storage, and lifecycle management'
  },
  'data_retention_policy': {
    title: 'Data Retention Policy',
    description: 'Policies for data retention and disposal'
  },
  'disaster_recovery_policy': {
    title: 'Disaster Recovery Policy',
    description: 'Business continuity and disaster recovery procedures'
  },
  'disposable_media_policy': {
    title: 'Disposable Media Policy',
    description: 'Handling of removable media and devices'
  },
  'employees_policy': {
    title: 'Employees Policy',
    description: 'Employee responsibilities and training'
  },
  'facility_access_policy': {
    title: 'Facility Access Policy',
    description: 'Physical access controls and facility security'
  },
  'hipaa_business_associate_agreement': {
    title: 'HIPAA Business Associate Agreement',
    description: 'Template for business associate agreements'
  },
  'incident_response_policy': {
    title: 'Incident Response Policy',
    description: 'Procedures for responding to security incidents'
  },
  'intrusion_detection_policy': {
    title: 'Intrusion Detection Policy',
    description: 'Monitoring and detection of unauthorized access'
  },
  'policy_management_policy': {
    title: 'Policy Management Policy',
    description: 'How policies are created, updated, and maintained'
  },
  'risk_management_policy': {
    title: 'Risk Management Policy',
    description: 'Risk assessment and management procedures'
  },
  'roles_policy': {
    title: 'Roles Policy',
    description: 'Roles and responsibilities for HIPAA compliance'
  },
  'systems_access_policy': {
    title: 'Systems Access Policy',
    description: 'User access controls and authentication'
  },
  'vulnerability_scanning_policy': {
    title: 'Vulnerability Scanning Policy',
    description: 'Security vulnerability assessment and remediation'
  }
};

// Dynamic spacer
let DynamicSpacer;
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
});

export default function PolicyPage(props) {
  const { policyId } = useParams();
  const [policyContent, setPolicyContent] = useState('');
  const [loading, setLoading] = useState(true);

  const policy = policyDefinitions[policyId] || {
    title: 'Policy Not Found',
    description: 'The requested policy could not be found.'
  };

  useEffect(() => {
    setLoading(true);
    
    // Fetch policy from server
    Meteor.call('hipaa.getPolicy', policyId, (error, result) => {
      if (error) {
        console.error('Error loading policy:', error);
        setPolicyContent('<p>Error loading policy. Please try again.</p>');
      } else {
        setPolicyContent(result.content);
      }
      setLoading(false);
    });
  }, [policyId]);

  return (
    <div id="policyPage" style={{ paddingLeft: 20, paddingRight: 20 }}>
      <Container maxWidth="lg">
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/hipaa/policies">
            HIPAA Policies
          </Link>
          <Typography color="text.primary">{policy.title}</Typography>
        </Breadcrumbs>

        <Card>
          <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              {policy.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              {policy.description}
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50' }}>
                <Typography 
                  component="div" 
                  sx={{ 
                    '& h1, & h2, & h3': { mt: 3, mb: 2 },
                    '& p': { mb: 2 },
                    '& ul, & ol': { mb: 2, pl: 3 },
                    '& li': { mb: 1 }
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: policyContent }} />
                </Typography>
              </Paper>
            )}
          </Box>
        </Card>
        
        <DynamicSpacer />
      </Container>
    </div>
  );
}

// Placeholder content generator
function getPolicyPlaceholder(policyId) {
  const placeholders = {
    'key_definitions': `
      <h2>Overview</h2>
      <p>This document contains key definitions for terms used throughout our HIPAA compliance documentation.</p>
      
      <h3>Protected Health Information (PHI)</h3>
      <p>Any individually identifiable health information that is transmitted or maintained in any form or medium.</p>
      
      <h3>Electronic Protected Health Information (ePHI)</h3>
      <p>Any PHI that is transmitted by or stored in electronic media.</p>
      
      <h3>Business Associate</h3>
      <p>A person or entity that performs certain functions or activities on behalf of a covered entity.</p>
    `,
    'auditing_policy': `
      <h2>Auditing Policy</h2>
      <p>This policy establishes the auditing requirements for all systems that process, store, or transmit PHI.</p>
      
      <h3>Audit Requirements</h3>
      <ul>
        <li>All access to PHI must be logged</li>
        <li>Logs must be retained for a minimum of 7 years</li>
        <li>Regular review of audit logs is required</li>
        <li>Automated alerts for suspicious activity</li>
      </ul>
      
      <h3>Implementation</h3>
      <p>The HIPAA Audit Logger automatically captures all required audit events.</p>
    `,
    'breach_policy': `
      <h2>Breach Notification Policy</h2>
      <p>This policy outlines the procedures for responding to a potential breach of PHI.</p>
      
      <h3>Breach Definition</h3>
      <p>A breach is the acquisition, access, use, or disclosure of PHI in a manner not permitted under HIPAA.</p>
      
      <h3>Response Procedures</h3>
      <ol>
        <li>Immediate containment and investigation</li>
        <li>Risk assessment</li>
        <li>Notification of affected individuals</li>
        <li>Notification of HHS</li>
        <li>Documentation and remediation</li>
      </ol>
    `
  };

  return placeholders[policyId] || `
    <h2>${policyDefinitions[policyId]?.title || 'Policy'}</h2>
    <p>Policy content would be loaded here. In production, this would fetch the actual policy document.</p>
    <p>For demonstration purposes, this shows how policies would be displayed within the application.</p>
  `;
}
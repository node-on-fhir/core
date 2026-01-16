// packages/hipaa-compliance/client/PolicyMenuPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  Description as PolicyIcon,
  Security as SecurityIcon,
  Storage as DataIcon,
  People as PeopleIcon,
  BugReport as IncidentIcon,
  Assessment as RiskIcon
} from '@mui/icons-material';
// Removed dependency on hl7-fhir-data-infrastructure

// Policy categories
const policyCategories = [
  {
    title: 'Core Policies',
    icon: <PolicyIcon />,
    policies: [
      { id: 'key_definitions', title: 'Key Definitions', required: true },
      { id: 'policy_management_policy', title: 'Policy Management', required: true },
      { id: 'hipaa_business_associate_agreement', title: 'Business Associate Agreement', required: true }
    ]
  },
  {
    title: 'Security Policies',
    icon: <SecurityIcon />,
    policies: [
      { id: 'systems_access_policy', title: 'Systems Access', required: true },
      { id: 'auditing_policy', title: 'Auditing', required: true },
      { id: 'intrusion_detection_policy', title: 'Intrusion Detection', required: false },
      { id: 'vulnerability_scanning_policy', title: 'Vulnerability Scanning', required: false }
    ]
  },
  {
    title: 'Data Management',
    icon: <DataIcon />,
    policies: [
      { id: 'data_management_policy', title: 'Data Management', required: true },
      { id: 'data_integrity_policy', title: 'Data Integrity', required: true },
      { id: 'data_retention_policy', title: 'Data Retention', required: true },
      { id: 'disposable_media_policy', title: 'Disposable Media', required: false }
    ]
  },
  {
    title: 'Personnel Policies',
    icon: <PeopleIcon />,
    policies: [
      { id: 'employees_policy', title: 'Employees', required: true },
      { id: 'roles_policy', title: 'Roles & Responsibilities', required: true },
      { id: '3rd_party_policy', title: '3rd Party Access', required: false },
      { id: 'approved_tools_policy', title: 'Approved Tools', required: false }
    ]
  },
  {
    title: 'Incident Management',
    icon: <IncidentIcon />,
    policies: [
      { id: 'breach_policy', title: 'Breach Response', required: true },
      { id: 'incident_response_policy', title: 'Incident Response', required: true },
      { id: 'disaster_recovery_policy', title: 'Disaster Recovery', required: true }
    ]
  },
  {
    title: 'Risk & Compliance',
    icon: <RiskIcon />,
    policies: [
      { id: 'risk_management_policy', title: 'Risk Management', required: true },
      { id: 'configuration_management_policy', title: 'Configuration Management', required: false },
      { id: 'facility_access_policy', title: 'Facility Access', required: false }
    ]
  }
];

// Dynamic spacer
let DynamicSpacer;
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
});

export default function PolicyMenuPage(props) {
  const navigate = useNavigate();

  const handlePolicyClick = (policyId) => {
    navigate(`/hipaa/policies/${policyId}`);
  };

  return (
    <div id="policyMenuPage" style={{ paddingLeft: 20, paddingRight: 20 }}>
      <Container maxWidth="lg">
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            HIPAA Compliance Policies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and understand our HIPAA compliance policies. Required policies are marked for your reference.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {policyCategories.map((category, index) => (
            <Grid item xs={12} key={index}>
              <Box mb={3}>
                <Box display="flex" alignItems="center" mb={2}>
                  {category.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {category.title}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  {category.policies.map((policy) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={policy.id}>
                      <Card>
                        <CardActionArea onClick={() => handlePolicyClick(policy.id)}>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {policy.title}
                            </Typography>
                            {policy.required && (
                              <Chip 
                                label="Required" 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            )}
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box mt={4} p={3} bgcolor="grey.100" borderRadius={1}>
          <Typography variant="h6" gutterBottom>
            About These Policies
          </Typography>
          <Typography variant="body2" paragraph>
            These policies are designed to ensure compliance with HIPAA regulations and protect 
            patient health information. All staff members should be familiar with these policies, 
            especially those marked as "Required."
          </Typography>
          <Typography variant="body2">
            Policies are regularly reviewed and updated. Last review: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
        
        <DynamicSpacer />
      </Container>
    </div>
  );
}
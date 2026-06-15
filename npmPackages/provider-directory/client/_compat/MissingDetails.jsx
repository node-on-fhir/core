// npmPackages/provider-directory/client/_compat/MissingDetails.jsx
//
// Compatibility shims for resource Detail components the Atmosphere package
// imported from clinical:hl7-fhir-data-infrastructure that have no home in the
// current app (never migrated into imports/ui-details or imports/ui-fhir).
// Rather than drop the DialogComponents entries for these resources, each
// renders a graceful "not available" placeholder so the dialog registry stays
// structurally intact. Also covers NewCertificateDialog (the FAST cert page was
// moved to scratch/ and disabled).

import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

function makePlaceholder(label) {
  function Placeholder() {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        <AlertTitle>{label}</AlertTitle>
        This detail view is not available in this build.
      </Alert>
    );
  }
  Placeholder.displayName = label + 'Placeholder';
  return Placeholder;
}

export const HealthcareServiceDetail = makePlaceholder('Healthcare Service');
export const InsurancePlanDetail = makePlaceholder('Insurance Plan');
export const NetworkDetail = makePlaceholder('Network');
export const OrganizationAffiliationDetail = makePlaceholder('Organization Affiliation');
export const ProvenanceDetail = makePlaceholder('Provenance');
export const RelatedPersonDetail = makePlaceholder('Related Person');
export const RestrictionDetail = makePlaceholder('Restriction');
export const SearchParameterDetail = makePlaceholder('Search Parameter');
export const StructureDefinitionDetail = makePlaceholder('Structure Definition');
export const VerificationResultDetail = makePlaceholder('Verification Result');
export const CommunicationRequestDetail = makePlaceholder('Communication Request');
export const NewCertificateDialog = makePlaceholder('New Certificate');
export const AboutNatDirDialog = makePlaceholder('About the National Directory');

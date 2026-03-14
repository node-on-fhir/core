Package.describe({
  name: 'mitre:national-directory',
  version: '0.13.10',
  summary: 'Validated Care Coordination Directory',
  // git: 'http://github.com/mitre/vhdir-core',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');

  api.use('meteor');
  api.use('webapp');
  api.use('ddp');
  api.use('livedata');
  api.use('es5-shim');
  api.use('ecmascript');
  api.use('fetch');

  api.use('session');
  api.use('react-meteor-data@4.0.1');
  api.use('simple:json-routes@2.3.1');

  api.use('clinical:hl7-resource-datatypes');
  api.use('clinical:hl7-fhir-data-infrastructure');
  api.use('clinical:vault-server');
  api.use('clinical:uscore');


  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/https.js', 'server');
  api.addFiles('server/hooks.js', 'server');

  api.addAssets('data/nppes/parsed-npi-records-100k.ndjson', 'server');
  api.addAssets('data/lantern/lantern_out.ndjson', 'server');
  
  api.addAssets('data/vhdir-definitions/CodeSystem-accessibility.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-consent.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-credentialstatus.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-digitalcertificate.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-ehrcharacteristics.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-healthcareservice-characteristic.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-healthcareservice-eligibility.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-insuranceplan.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-languageproficiency.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-network-type.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-organizationdemographics.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-payercharacteristics.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-primarysource.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-usecase.json', 'server');
  api.addAssets('data/vhdir-definitions/CodeSystem-validation.json', 'server');
  
  
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-category.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-location.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-name.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-participant.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-service.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-careteam-via-intermediary.json', 'server');
  
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-connection-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-mime-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-payload-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-usecase-standard.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-usecase-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-endpoint-via-intermediary.json', 'server');

  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-characteristic.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-coverage-area.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-eligibility.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-location.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-name.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-new-patient-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-new-patient.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-service-category.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-service-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-healthcareservice-specialty.json', 'server');
  
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-administered-by.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-area.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-benefit-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-limit-value.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-general-cost-groupsize.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-general-cost-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-general-cost-value.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-name.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-owned-by.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-plan-coverage-area.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-plan-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-plan-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-plan-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-benefit-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-category.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-cost-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-value.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-insuranceplan-type.json', 'server');

  api.addAssets('data/vhdir-definitions/SearchParameter-location-accessibility.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-address.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-contains.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-new-patient-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-new-patient.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-partof.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-location-via-intermediary.json', 'server');

  api.addAssets('data/vhdir-definitions/SearchParameter-organization-address-city.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-address-country.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-address-postalcode.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-address-state.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-address.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-coverage-area.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-name.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-partof.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-qualification-code.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-qualification-issuer.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-qualification-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-qualification-wherevalid-code.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-qualification-wherevalid-location.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organization-via-intermediary.json', 'server');

  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-location.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-participating-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-primary-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-role.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-service.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-specialty.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-organizationaffiliation-via-intermediary.json', 'server');

  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-family-name.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-given-name.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-name.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-phonetic.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-qualification-code.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-qualification-issuer.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-qualification-period.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-qualification-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-qualification-wherevalid-code.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-qualification-wherevalid-location.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitioner-via-intermediary.json', 'server');

  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-identifier-assigner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-identifier.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-location.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-new-patient-network.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-new-patient.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-practitioner.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-code.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-issuer.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-wherevalid-code.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-wherevalid-location.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-role.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-service.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-specialty.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-practitionerrole-via-intermediary.json', 'server');
  
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-attestation-method.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-attestation-onbehalfof.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-attestation-who.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-primarysource-date.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-primarysource-type.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-primarysource-who.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-status-date.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-target.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-validation-status.json', 'server');
  api.addAssets('data/vhdir-definitions/SearchParameter-verificationresult-validator-organization.json', 'server');
  
  api.addAssets('data/vhdir-definitions/StructureDefinition-accessibility.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-careteam-alias.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-communication-proficiency.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-contactpoint-availabletime.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-contactpoint-viaintermediary.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-digitalcertificate.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-ehr.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-endpoint-rank.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-endpoint-reference.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-endpoint-usecase.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-healthcareservice-reference.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-identifier-status.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-insuranceplan-reference.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-location-reference.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-network-reference.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-newpatientprofile.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-newpatients.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-org-alias-period.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-org-alias-type.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-org-description.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-practitioner-qualification.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-qualification.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-usage-restriction.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-careteam.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-endpoint.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-healthcareservice.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-insuranceplan.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-location.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-network.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-organization.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-organizationaffiliation.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-practitioner.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-practitionerrole.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-restriction.json', 'server');
  api.addAssets('data/vhdir-definitions/StructureDefinition-vhdir-validation.json', 'server');

  api.addAssets('data/vhdir-definitions/ValueSet-accessibility.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-aliastype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-attestationmethod.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-benefit-type.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-certificationedition.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-consent.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-coverage-type.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-digitalcertificatestandard.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-digitalcertificatetrustframework.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-digitalcertificatetype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-digitalcertificateuse.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-externalvalidationtype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-failureaction.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-healthcareservice-characteristic.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-healthcareservice-eligibility.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-identifier-type.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-identifierstatus.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-insuranceplan-type.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-insuranceplanbenefitcosttype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-insuranceplanbenefittype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-insuranceplancostcategory.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-insuranceplancostqualifier.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-insuranceplancosttype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-insuranceplangroupsize.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-languageproficiency.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-limit-unit.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-network-type.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-patientaccess.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-plan-type.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-primarysourcefailureaction.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-primarysourcepush.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-primarysourcepushtype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-primarysourcetype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-primarysourcevalidationprocess.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-primarysourcevalidationstatus.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-qualificationstatus.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-usecasetype.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-validationneed.json', 'server');
  api.addAssets('data/vhdir-definitions/ValueSet-validationprocess.json', 'server');

  api.addFiles('assets/SocialMedia.jpg', "client", {isAsset: true});
  api.addFiles('assets/SocialMedia-WomensShelters.jpg', "client", {isAsset: true});

  api.mainModule('index.jsx', 'client');
});


Npm.depends({
  "ndjson-parse": "1.0.4",
  "react-router-dom": "6.3.0"
  // "ipfs-daemon": "0.12.3",
  // "ipfs-http-client": "56.0.3"
})
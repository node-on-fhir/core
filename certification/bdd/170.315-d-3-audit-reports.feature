# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-3-audit-reports.feature
# § 170.315(d)(3) - Audit Report(s)

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(3)
#
# (3) Audit report(s).  Enable a user to create an audit report for a specific time period and to sort entries in the audit log according to each of the data specified in the standards in § 170.210(e).

@170.315-d-3 @audit-reports @privacy-security
Feature: Audit Report(s)
  As a compliance officer
  I want to generate audit reports
  So that I can review system access and actions

  Background:
    Given audit logs have been recorded
    And I am authorized to access audit reports

  Scenario: Enable audit report creation
    Given audit data exists in the system
    When I request an audit report
    Then the system shall enable report creation
    And report shall include all relevant audit data
    And report shall be in usable format

  Scenario: Filter audit reports by criteria
    Given I need specific audit information
    When I create an audit report
    Then the system shall allow filtering by user
    And the system shall allow filtering by date range
    And the system shall allow filtering by action type
    And the system shall allow filtering by patient

  Scenario: Review audit report content
    Given an audit report has been generated
    When I review the report
    Then the report shall display all required audit elements
    And the report shall be clear and comprehensive
    And the report shall support security investigations

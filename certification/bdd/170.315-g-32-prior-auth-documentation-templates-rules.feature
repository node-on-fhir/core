# certification/bdd/170.315-g-32-prior-auth-documentation-templates-rules.feature
# § 170.315(g)(32) - Provider Prior Authorization API: Documentation Templates and Rules

# REGULATORY CONTEXT (HTI-4 final rule — new criterion)
#
# Provider prior authorization API — documentation templates and rules.
# Implementation specification: HL7 Da Vinci Documentation Templates and
# Rules (DTR) implementation guide, using FHIR Structured Data Capture (SDC)
# Questionnaires with embedded CQL.
#
# The Health IT Module acts as a DTR CLIENT:
#
#   (A) Retrieve the payer's documentation templates by invoking the
#       Questionnaire/$questionnaire-package operation for the order and
#       coverage context (typically launched from a CRD card per
#       § 170.315(g)(31)).
#
#   (B) Pre-populate questionnaire answers from the patient's record by
#       executing the embedded CQL / FHIR queries against the EHR data.
#
#   (C) Render the questionnaire (SDC rendering) so the provider can review
#       pre-populated answers and complete the remaining items.
#
#   (D) Persist the completed QuestionnaireResponse so it can be reused for
#       subsequent requests and attached to the prior authorization request
#       per § 170.315(g)(33).
#
# IMPLEMENTATION IN THIS REPO: not yet implemented as DTR. A generic SDC
# package (npmPackages/structured-data-capture) renders FHIR Questionnaires
# with validation and conditional logic and can be reused for (C); the
# $questionnaire-package operation and CQL pre-population do not exist.

@170.315-g-32 @prior-auth @dtr @sdc @questionnaire @api @payer @da-vinci @hti-4
Feature: Provider Prior Authorization API - Documentation Templates and Rules
  As an ordering provider
  I want payer documentation templates retrieved and pre-filled from the chart
  So that prior authorization documentation takes minutes instead of phone calls and faxes

  Background:
    Given I am authenticated as a provider
    And a patient record is selected
    And an order requiring prior authorization documentation exists
    And a payer DTR service is configured

  # ------ Template Retrieval ------

  Scenario: Retrieve the documentation package for an order
    Given coverage requirements discovery indicated documentation is required
    When the system invokes the Questionnaire package operation for the order and coverage
    Then the system shall receive the payer's Questionnaire package
    And the package shall include the questionnaire and its embedded population logic

  # ------ Pre-population ------

  Scenario: Pre-populate answers from the patient record
    Given a payer questionnaire with embedded population logic has been retrieved
    When the system executes the population logic against the patient's record
    Then questionnaire items with matching clinical data shall be pre-populated
    And each pre-populated answer shall be traceable to its source data

  Scenario: Unanswerable items remain for provider completion
    Given the population logic cannot answer every questionnaire item
    When pre-population completes
    Then the remaining items shall be presented for manual completion
    And pre-populated and manually entered answers shall be distinguishable

  # ------ Rendering and Completion ------

  Scenario: Render the documentation questionnaire for review
    Given a pre-populated questionnaire is ready
    When I open the documentation form
    Then the system shall render the questionnaire per SDC rendering rules
    And I shall be able to review and correct pre-populated answers
    And required items shall be validated before completion

  Scenario: Complete and persist the QuestionnaireResponse
    Given I have completed all required questionnaire items
    When I finish the documentation
    Then the system shall persist a QuestionnaireResponse linked to the order and coverage
    And the QuestionnaireResponse shall be available for the prior authorization request per § 170.315(g)(33)

  # ------ Reuse ------

  Scenario: Reuse prior documentation for a related request
    Given a persisted QuestionnaireResponse exists for the patient and payer
    When the same documentation template is retrieved again
    Then the system shall offer the prior answers for reuse
    And reused answers shall be re-validated against the current template

  # ------ Persistence and Audit ------

  Scenario: Record the DTR exchange for audit
    Given a documentation package was retrieved and completed
    Then the retrieval, population sources, and completed response shall be recorded
    And the record shall be accessible to authorized users

  # ------ Resilience ------

  Scenario: Payer DTR service unavailable
    Given the payer DTR service is unavailable
    When I attempt to retrieve documentation templates
    Then the system shall report that templates could not be retrieved
    And I shall be able to retry or proceed with manual documentation

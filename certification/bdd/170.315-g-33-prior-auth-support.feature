# certification/bdd/170.315-g-33-prior-auth-support.feature
# § 170.315(g)(33) - Provider Prior Authorization API: Prior Authorization Support

# REGULATORY CONTEXT (HTI-4 final rule — new criterion)
#
# Provider prior authorization API — prior authorization support.
# Implementation specification: HL7 Da Vinci Prior Authorization Support
# (PAS) implementation guide.
#
# The Health IT Module acts as a PAS CLIENT:
#
#   (A) Assemble a prior authorization request Bundle containing a Claim
#       resource (use: preauthorization) with the order, patient, coverage,
#       requesting provider, and supporting information — including the
#       completed DTR QuestionnaireResponse per § 170.315(g)(32).
#
#   (B) Submit the request by invoking Claim/$submit on the payer or
#       intermediary endpoint.
#
#   (C) Receive the ClaimResponse and surface the disposition (approved,
#       denied, pended) and the authorization number to the provider.
#
#   (D) Track pended requests over time, including polling via
#       Claim/$inquire, and update the displayed disposition.
#
#   (E) Associate the authorization outcome with the originating order.
#
# IMPLEMENTATION IN THIS REPO: not yet implemented. Claim / ClaimResponse
# schemas exist (imports/lib/schemas/SimpleSchemas/Claims.js) but there are
# no REST routes and no $submit / $inquire operations.

@170.315-g-33 @prior-auth @pas @claim @api @payer @da-vinci @hti-4
Feature: Provider Prior Authorization API - Prior Authorization Support
  As an ordering provider
  I want prior authorization requests submitted and tracked electronically
  So that authorizations resolve inside the EHR without manual payer portals

  Background:
    Given I am authenticated as a provider
    And a patient record is selected
    And an order requiring prior authorization exists
    And a payer PAS endpoint is configured

  # ------ Request Assembly ------

  Scenario: Assemble the prior authorization request Bundle
    Given documentation for the order is complete per § 170.315(g)(32)
    When I initiate a prior authorization request
    Then the system shall assemble a request Bundle containing a preauthorization Claim
    And the Bundle shall include the patient, coverage, and requesting provider
    And the Bundle shall include the completed QuestionnaireResponse as supporting information

  # ------ Submission ------

  Scenario: Submit the request via Claim submit operation
    Given a prior authorization request Bundle is assembled
    When the system invokes the Claim submit operation on the payer endpoint
    Then the system shall receive a ClaimResponse from the payer
    And the response shall be linked to the originating request

  # ------ Disposition Handling ------

  Scenario: Display an approved authorization
    Given the payer response disposition is approved
    When I review the prior authorization outcome
    Then the system shall display the approved disposition
    And the system shall display the authorization number
    And the authorization shall be associated with the originating order

  Scenario: Display a denied authorization
    Given the payer response disposition is denied
    When I review the prior authorization outcome
    Then the system shall display the denied disposition with the payer's stated reason
    And I shall be able to revise and resubmit the request

  Scenario: Track a pended authorization over time
    Given the payer response disposition is pended
    When the system polls the payer via the Claim inquiry operation
    Then the displayed disposition shall update when the payer reaches a decision
    And the pending request shall appear in a work queue of open authorizations

  # ------ Persistence and Audit ------

  Scenario: Record the prior authorization exchange for audit
    Given a prior authorization request and response have been exchanged
    Then the request Bundle, responses, and disposition history shall be recorded
    And the record shall be accessible to authorized users

  # ------ Resilience ------

  Scenario: Payer endpoint unavailable
    Given the payer PAS endpoint is unavailable
    When I submit a prior authorization request
    Then the system shall report the submission failure
    And the request shall be queued for retry without loss of the assembled Bundle

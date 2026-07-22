# certification/bdd/170.315-b-4-real-time-prescription-benefit.feature
# § 170.315(b)(4) - Real-Time Prescription Benefit

# REGULATORY CONTEXT (HTI-4 final rule — new criterion; part of the updated Base EHR definition)
#
# Real-time prescription benefit. Enable a user, at the point of prescribing,
# to obtain and view patient-specific prescription benefit information in
# accordance with the NCPDP Real-Time Prescription Benefit (RTPB) standard,
# including:
#
#   (A) Compose and transmit an RTPB request for a prescribed product,
#       identifying the patient, prescriber, medication (NDC / RxNorm),
#       quantity, days supply, and dispensing pharmacy.
#
#   (B) Receive and display the RTPB response to the prescriber, including
#       patient-specific out-of-pocket cost, coverage / formulary status,
#       and coverage restrictions (e.g., prior authorization required).
#
#   (C) Display lower-cost therapeutic alternatives returned by the
#       benefit responder, including their patient-specific costs.
#
# Compliance date tracked in this repo: 1/1/2028 (Base EHR definition).
#
# IMPLEMENTATION IN THIS REPO: npmPackages/prescription-benefit
#   route /prescription-benefit, methods prescriptionBenefit.getConfig /
#   submitRequest / getStatus, PrescriptionBenefitRequest / Response
#   collections, mock PBM responders plus a configurable live endpoint
#   (settings.private.prescriptionBenefit).

@170.315-b-4 @rtpb @prescription-benefit @e-prescribing @ncpdp @hti-4 @base-ehr
Feature: Real-Time Prescription Benefit
  As a prescribing provider
  I want to see my patient's actual benefit information while I prescribe
  So that I can choose affordable, covered medications at the point of care

  Background:
    Given I am authenticated as a provider
    And a patient record is selected
    And a prescription benefit responder is configured

  # ------ Compose and Transact ------

  Scenario: Compose an RTPB request for a prescribed medication
    Given I am prescribing "Lipitor 20mg" for the patient
    When I request a real-time prescription benefit check
    Then the system shall compose an RTPB request in the NCPDP RTPB standard format
    And the request shall identify the patient, prescriber, and medication by NDC or RxNorm code
    And the request shall include quantity and days supply
    And the request shall identify the dispensing pharmacy when selected

  Scenario: Transact the RTPB request with the patient's benefit responder
    Given an RTPB request has been composed
    When the request is transmitted to the configured benefit responder
    Then the system shall receive an RTPB response from the responder
    And the response shall be linked to the originating request

  # ------ Display to the Prescriber ------

  Scenario: Display patient-specific out-of-pocket cost
    Given an RTPB response has been received
    When I review the benefit check results
    Then the system shall display the patient pay amount for the prescribed product
    And the cost shall be specific to the patient's coverage

  Scenario: Display coverage and formulary status
    Given an RTPB response has been received
    When I review the benefit check results
    Then the system shall display the coverage status of the prescribed product
    And the system shall display formulary status and any coverage restrictions
    And a prior authorization requirement shall be clearly indicated when present

  Scenario: Display lower-cost therapeutic alternatives
    Given an RTPB response includes therapeutic alternatives for a brand drug
    When I review the benefit check results
    Then the system shall display the returned alternatives with their patient-specific costs
    And I shall be able to select an alternative to prescribe instead

  # ------ Workflow Integration ------

  Scenario: Benefit check occurs within the prescribing workflow
    Given I am creating a new prescription per § 170.315(b)(3)
    When the benefit check completes
    Then the results shall be presented before the prescription is transmitted
    And the prescribing workflow shall not require leaving the ordering context

  # ------ Persistence and Audit ------

  Scenario: Record the RTPB transaction for audit
    Given an RTPB request and response have been exchanged
    Then both the request and the response shall be recorded in the system
    And the transaction history shall be accessible to authorized users

  # ------ Resilience ------

  Scenario: Responder unavailable does not block prescribing
    Given the benefit responder is unavailable
    When I request a real-time prescription benefit check
    Then the system shall report that benefit information could not be obtained
    And I shall still be able to complete the prescription

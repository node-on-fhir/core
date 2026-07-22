# certification/bdd/170.315-g-31-prior-auth-coverage-requirements-discovery.feature
# § 170.315(g)(31) - Provider Prior Authorization API: Coverage Requirements Discovery

# REGULATORY CONTEXT (HTI-4 final rule — new criterion)
#
# Provider prior authorization API — coverage requirements discovery.
# Implementation specification: HL7 Da Vinci Coverage Requirements Discovery
# (CRD) implementation guide, built on HL7 CDS Hooks.
#
# The Health IT Module acts as a CRD CLIENT:
#
#   (A) Invoke a payer CRD service at defined workflow moments (order-select,
#       order-sign, appointment-book, encounter-start) by firing the
#       corresponding CDS Hook with hook context and FHIR prefetch data
#       (Patient, Coverage, and the draft ServiceRequest / MedicationRequest /
#       DeviceRequest under consideration).
#
#   (B) Receive CDS cards from the payer service indicating whether prior
#       authorization is required for the proposed order, what documentation
#       is required, and any covering guidance.
#
#   (C) Process system actions returned by the service, including annotating
#       the draft order with the coverage-information extension.
#
#   (D) Display returned cards to the ordering provider within the ordering
#       workflow, including launch links to Documentation Templates and Rules
#       (DTR) per § 170.315(g)(32).
#
# IMPLEMENTATION IN THIS REPO: not yet implemented. A stub /cds-services
# discovery endpoint exists (server/CdsHooksEndpoints.js) and generic CDS
# Hooks proxy methods; no CRD client firing or coverage-information handling.

@170.315-g-31 @prior-auth @crd @cds-hooks @api @payer @da-vinci @hti-4
Feature: Provider Prior Authorization API - Coverage Requirements Discovery
  As an ordering provider
  I want coverage requirements discovered automatically while I order
  So that I know before signing whether prior authorization and documentation are required

  Background:
    Given I am authenticated as a provider
    And a patient record is selected
    And the patient has an active Coverage resource identifying their payer
    And a payer CRD service is configured

  # ------ Service Discovery ------

  Scenario: Discover the payer CRD service
    Given a payer CRD service endpoint is configured
    When the system queries the service discovery endpoint
    Then the system shall receive the list of CDS services offered by the payer
    And the supported hooks and prefetch requirements shall be recorded

  # ------ Hook Invocation ------

  Scenario: Fire order-select when an order is being composed
    Given I am composing a ServiceRequest for the patient
    When I select the order item
    Then the system shall invoke the payer CRD service with the order-select hook
    And the request shall include the draft order and patient coverage as FHIR prefetch data

  Scenario: Fire order-sign before orders are signed
    Given I have one or more unsigned orders for the patient
    When I initiate order signing
    Then the system shall invoke the payer CRD service with the order-sign hook
    And the request shall include all orders being signed

  # ------ Card Handling ------

  Scenario: Display a prior authorization requirement card
    Given the CRD service responds that prior authorization is required
    When I review the returned guidance
    Then the system shall display a card indicating prior authorization is required
    And the card shall identify the documentation requirements
    And the card shall be displayed within the ordering workflow

  Scenario: Annotate the order with coverage information
    Given the CRD service returns a system action with a coverage-information extension
    When the system processes the response
    Then the draft order shall be annotated with the coverage-information extension
    And the annotation shall be persisted with the order

  Scenario: Offer a DTR launch link for documentation
    Given the CRD service indicates documentation is required per § 170.315(g)(32)
    When the card is displayed
    Then the card shall include a link to launch documentation templates and rules
    And selecting the link shall carry the order and coverage context forward

  # ------ Persistence and Audit ------

  Scenario: Record the CRD exchange for audit
    Given a CRD request and response have been exchanged
    Then the invocation, returned cards, and any applied system actions shall be recorded
    And the record shall be accessible to authorized users

  # ------ Resilience ------

  Scenario: Payer service unavailable does not block ordering
    Given the payer CRD service is unavailable
    When I compose and sign an order
    Then the system shall report that coverage requirements could not be discovered
    And the ordering workflow shall complete without blocking

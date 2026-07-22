# certification/bdd/170.315-j-20-workflow-triggers-dsi-clients.feature
# § 170.315(j)(20) - Workflow Triggers for Decision Support Interventions: Clients

# REGULATORY CONTEXT (HTI-4 final rule — new criterion)
#
# Workflow triggers for decision support interventions — clients.
# Implementation specification: HL7 CDS Hooks.
#
# The Health IT Module acts as a CDS Hooks CLIENT, triggering decision
# support interventions at defined workflow moments:
#
#   (A) Discover available services from a configured CDS server via the
#       service discovery endpoint (GET {baseUrl}/cds-services).
#
#   (B) Invoke hooks at the correct workflow moments with hook context and
#       FHIR prefetch data:
#         - patient-view  when a patient chart is opened
#         - order-select  when an order is being composed
#         - order-sign    when orders are about to be signed
#
#   (C) Render returned CDS cards (information, suggestion, app-link) to the
#       user within the triggering workflow.
#
#   (D) Support card actions: accepting a suggestion applies the proposed
#       FHIR resource changes; app links launch the referenced SMART app.
#
#   (E) Record the interaction for audit and feedback.
#
# IMPLEMENTATION IN THIS REPO: partial. npmPackages/decision-support
# implements § 170.315(b)(11) DSI with SERVER-side evaluation
# (server/hooks.js fires on ServiceRequest insert and ToC incorporation);
# server/CdsHooksEndpoints.js has a stub /cds-services endpoint and proxy
# methods. The CLIENT-side workflow triggers (patient-view, order-select,
# order-sign fired from the UI) do not exist yet.

@170.315-j-20 @cds-hooks @dsi @client @workflow-triggers @decision-support @hti-4
Feature: Workflow Triggers for Decision Support Interventions - Clients
  As a healthcare provider
  I want decision support triggered automatically at the right workflow moments
  So that guidance reaches me while I can still act on it

  Background:
    Given I am authenticated as a provider
    And a CDS Hooks service endpoint is configured
    And decision support interventions are enabled

  # ------ Service Discovery ------

  Scenario: Discover services from the configured CDS server
    Given a CDS server base URL is configured
    When the system queries the service discovery endpoint
    Then the system shall receive the list of available CDS services
    And each service's hook type and prefetch requirements shall be recorded

  # ------ Hook Invocation ------

  Scenario: Fire patient-view when a chart is opened
    Given a patient record exists
    When I open the patient's chart
    Then the system shall invoke the patient-view hook against subscribed services
    And the request shall include the patient context and requested prefetch data

  Scenario: Fire order-select while composing an order
    Given a patient record is selected
    When I select a medication or service in the order composer
    Then the system shall invoke the order-select hook
    And the request shall include the draft order under composition

  Scenario: Fire order-sign before signing orders
    Given I have unsigned orders for the patient
    When I initiate order signing
    Then the system shall invoke the order-sign hook
    And the request shall include all orders being signed

  # ------ Card Rendering and Actions ------

  Scenario: Render returned CDS cards in the workflow
    Given a CDS service returns cards for a fired hook
    When the response is received
    Then the cards shall be displayed within the triggering workflow
    And each card shall show its summary, source, and indicator level

  Scenario: Accept a suggestion card
    Given a returned card contains a suggestion with proposed resource changes
    When I accept the suggestion
    Then the system shall apply the proposed FHIR resource changes
    And the applied change shall be attributed to the accepted suggestion

  Scenario: Launch a SMART app from an app-link card
    Given a returned card contains a SMART app link
    When I select the link
    Then the system shall launch the referenced SMART app with the current context

  # ------ Persistence and Audit ------

  Scenario: Record hook firings and card outcomes for audit
    Given hooks have been fired and cards displayed
    Then each invocation, returned card, and user action shall be recorded
    And the record shall be accessible to authorized users

  # ------ Resilience ------

  Scenario: CDS service unavailable does not block clinical work
    Given the CDS service is unavailable
    When a workflow moment would fire a hook
    Then the workflow shall proceed without blocking
    And the failed invocation shall be recorded

# certification/bdd/170.315-j-21-subscriptions-client.feature
# § 170.315(j)(21) - Subscriptions: Client

# REGULATORY CONTEXT (HTI-4 final rule — new criterion)
#
# Subscriptions — client. Implementation specification: HL7 FHIR
# Subscriptions R5 Backport implementation guide
# (hl7.fhir.uv.subscriptions-backport) for FHIR R4 topic-based
# subscriptions.
#
# The Health IT Module acts as a subscriptions CLIENT:
#
#   (A) Create a Subscription resource on an external FHIR server
#       referencing a SubscriptionTopic by canonical URL, with channel type
#       rest-hook pointing at the module's own notification endpoint, and a
#       requested payload content level (empty, id-only, or full-resource).
#
#   (B) Receive notification Bundles (type history, first entry
#       SubscriptionStatus) at the rest-hook endpoint, including handshake
#       and heartbeat notifications.
#
#   (C) Process event notifications: match them to the originating
#       subscription, resolve id-only payloads by fetching the referenced
#       resources, and surface the event to the user or update local data.
#
#   (D) Manage the subscription lifecycle (requested, active, error, off),
#       detect dropped events via event numbering, and query the
#       subscription $status operation to recover.
#
#   (E) Record received notifications for audit.
#
# IMPLEMENTATION IN THIS REPO: not yet implemented. Only a Subscription
# schema skeleton exists (imports/lib/schemas/SimpleSchemas/Subscriptions.js);
# no REST operations, rest-hook receiver, or SubscriptionTopic support.

@170.315-j-21 @subscriptions @fhir @client @rest-hook @backport @hti-4
Feature: Subscriptions - Client
  As a clinical system integrator
  I want this EHR to subscribe to events on external FHIR servers
  So that care teams learn of relevant changes without polling

  Background:
    Given I am authenticated as an administrator
    And an external FHIR server supporting topic-based subscriptions is configured

  # ------ Subscription Creation ------

  Scenario: Create a topic-based subscription on an external server
    Given a SubscriptionTopic canonical URL is known
    When I create a subscription for that topic
    Then the system shall POST a Subscription resource to the external server
    And the subscription shall use the rest-hook channel pointing at this system's notification endpoint
    And the subscription shall request a payload content level of id-only or full-resource

  Scenario: Complete the activation handshake
    Given a subscription has been requested
    When the external server sends a handshake notification to the rest-hook endpoint
    Then the system shall accept the handshake
    And the subscription status shall transition from requested to active

  # ------ Notification Processing ------

  Scenario: Receive an event notification Bundle
    Given an active subscription exists
    When the external server sends a notification Bundle to the rest-hook endpoint
    Then the system shall parse the SubscriptionStatus entry
    And the notification shall be matched to the originating subscription

  Scenario: Resolve an id-only payload
    Given a notification with id-only payload content is received
    When the system processes the notification
    Then the system shall fetch the referenced resources from the external server
    And the fetched resources shall be available to the receiving workflow

  Scenario: Surface a full-resource notification to the user
    Given a notification with full-resource payload content is received
    When the system processes the notification
    Then the contained resources shall be surfaced to the subscribed workflow
    And the user shall be able to review the triggering event

  # ------ Lifecycle and Recovery ------

  Scenario: Handle heartbeat notifications
    Given an active subscription with a heartbeat period exists
    When a heartbeat notification is received
    Then the system shall record the heartbeat without user-facing alerts
    And a missed heartbeat window shall mark the subscription as possibly disconnected

  Scenario: Detect dropped events via event numbering
    Given notifications carry sequential event numbers
    When a received notification's event number skips ahead
    Then the system shall detect the gap
    And the system shall query the subscription status operation to recover missed events

  Scenario: Manage subscription lifecycle states
    Given a subscription exists in any state
    When I review the subscription manager
    Then I shall see the subscription's current state among requested, active, error, and off
    And I shall be able to deactivate or re-activate the subscription

  # ------ Persistence and Audit ------

  Scenario: Record received notifications for audit
    Given notifications have been received
    Then each notification, its subscription, and its processing outcome shall be recorded
    And the record shall be accessible to authorized users

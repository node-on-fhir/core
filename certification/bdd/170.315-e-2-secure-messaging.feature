# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-e-2-secure-messaging.feature
# § 170.315(e)(2) - Secure Messaging

# REGULATORY TEXT FROM 45 CFR § 170.315(e)(2)
#
# (2) [Reserved]

@170.315-e-2 @secure-messaging @patient-engagement
Feature: Secure Messaging
  As a patient
  I want to securely message my healthcare providers
  So that I can communicate about my care electronically

  Background:
    Given I am authenticated as a patient
    And secure messaging is available

  Scenario: Send secure message to provider
    Given I have a message for my provider
    When I compose and send the message
    Then the system shall transmit securely
    And message shall be encrypted
    And provider shall receive the message

  Scenario: Receive secure message from provider
    Given my provider sends me a message
    When the message arrives
    Then I shall be notified
    And I shall be able to access the message securely
    And message content shall be protected

  Scenario: View message history
    Given I have sent and received secure messages
    When I view my message history
    Then all messages shall be accessible
    And messages shall be organized chronologically
    And I shall be able to search messages

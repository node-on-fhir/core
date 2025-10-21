# certification/bdd/170.315-h-1-direct-project.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(h)(1)
#
# (1) Direct Project —
# (i) Applicability Statement for Secure Health Transport.  Able to send and receive health information in accordance with the standard specified in § 170.202(a)(2), including formatted only as a “wrapped” message.
# (ii) Delivery Notification in Direct.  Able to send and receive health information in accordance with the standard specified in § 170.202(e)(1).

@170.315-h-1 @direct @transport
Feature: Direct Project
  As a healthcare provider
  I want to send and receive health information via Direct messaging
  So that I can securely exchange patient information with other providers

  Background:
    Given the system supports Direct Project messaging
    And I have appropriate Direct addressing

  Scenario: Send health information via Direct with wrapped message
    Given I have health information to send
    When I send information via Direct messaging
    Then the system shall send per § 170.202(a)(2)
    And the message shall be formatted as a wrapped message

  Scenario: Receive health information via Direct with wrapped message
    Given health information is being sent to me
    When I receive the Direct message
    Then the system shall receive per § 170.202(a)(2)
    And the system shall process the wrapped message

  Scenario: Send delivery notification in Direct
    Given I have sent health information via Direct
    When delivery notification is enabled
    Then the system shall send delivery notification per § 170.202(e)(1)

  Scenario: Receive delivery notification in Direct
    Given I sent health information via Direct
    When a delivery notification is sent back
    Then the system shall receive delivery notification per § 170.202(e)(1)

# certification/bdd/170.315-h-2-transport-protocols.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(h)(2)
#
# (2) Direct Project, Edge Protocol, and XDR/XDM.
# (i) Able to send and receive health information in accordance with:
# (A) The standard specified in § 170.202(a)(2), including formatted only as a “wrapped” message;
# (B) The standard specified in § 170.202(b), including support for both limited and full XDS metadata profiles; and
# (C) Both edge protocol methods specified by the standard in § 170.202(d).
# (ii) Delivery Notification in Direct.  Able to send and receive health information in accordance with the standard specified in § 170.202(e)(1).
# [80 FR 62747, Oct. 16, 2015, as amended at 80 FR 76871, Dec. 11, 2015; 85 FR 25941, May 1, 2020; 85 FR 47099, Aug. 4, 2020; 85 FR 70083, Nov. 4, 2020; 85 FR 78236, Dec. 4, 2020; 89 FR 1429, Jan. 9, 2024; 89 FR 8548, Feb. 8, 2024; 89 FR 16470, Mar. 7, 2024; 89 FR 101809, Dec. 16, 2024]

@170.315-h-2 @direct @edge @xdr @xdm @transport
Feature: Direct Project, Edge Protocol, and XDR/XDM
  As a healthcare provider
  I want to use multiple transport methods for health information exchange
  So that I can interoperate with various health information networks

  Background:
    Given the system supports multiple transport protocols

  # Direct Project with Wrapped Message

  Scenario: Send via Direct as wrapped message
    Given I am using Direct Project transport
    When I send health information
    Then the system shall send per § 170.202(a)(2)
    And the message shall be formatted as wrapped message

  Scenario: Receive via Direct as wrapped message
    Given I am using Direct Project transport
    When I receive health information
    Then the system shall receive per § 170.202(a)(2)
    And the message shall be processed as wrapped message

  # XDR/XDM Support

  Scenario: Send via XDR/XDM with limited metadata profile
    Given I am using XDR/XDM transport
    When I send health information with limited metadata
    Then the system shall send per § 170.202(b)
    And limited XDS metadata profile shall be supported

  Scenario: Send via XDR/XDM with full metadata profile
    Given I am using XDR/XDM transport
    When I send health information with full metadata
    Then the system shall send per § 170.202(b)
    And full XDS metadata profile shall be supported

  Scenario: Receive via XDR/XDM
    Given I am using XDR/XDM transport
    When I receive health information
    Then the system shall receive per § 170.202(b)
    And both metadata profiles shall be supported

  # Edge Protocol Methods

  Scenario: Send via SMTP edge protocol
    Given I am using SMTP-based edge protocol
    When I send health information
    Then the system shall send per § 170.202(d)

  Scenario: Send via SOAP edge protocol
    Given I am using SOAP-based edge protocol
    When I send health information
    Then the system shall send per § 170.202(d)

  Scenario: Receive via SMTP edge protocol
    Given I am using SMTP-based edge protocol
    When I receive health information
    Then the system shall receive per § 170.202(d)

  Scenario: Receive via SOAP edge protocol
    Given I am using SOAP-based edge protocol
    When I receive health information
    Then the system shall receive per § 170.202(d)

  # Delivery Notification

  Scenario: Send delivery notification
    Given health information has been sent
    When delivery notification is required
    Then the system shall send notification per § 170.202(e)(1)

  Scenario: Receive delivery notification
    Given I sent health information
    When delivery notification is sent back
    Then the system shall receive notification per § 170.202(e)(1)

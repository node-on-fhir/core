# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-h-transport-protocols.feature
# § 170.315(h) - Transport Methods and Other Protocols

# REGULATORY TEXT FROM 45 CFR § 170.315(h)
#
# (h) Transport methods and other protocols —
#
# (1) Direct Project —
#
# (i) Applicability Statement for Secure Health Transport.  Able to send and receive health information in accordance with the standard specified in § 170.202(a)(2), including formatted only as a "wrapped" message.
#
# (ii) Delivery Notification in Direct.  Able to send and receive health information in accordance with the standard specified in § 170.202(e)(1).
#
# (2) Direct Project, Edge Protocol, and XDR/XDM.
#
# (i) Able to send and receive health information in accordance with:
#
# (A) The standard specified in § 170.202(a)(2), including formatted only as a "wrapped" message;
#
# (B) The standard specified in § 170.202(b), including support for both limited and full XDS metadata profiles; and
#
# (C) Both edge protocol methods specified by the standard in § 170.202(d).
#
# (ii) Delivery Notification in Direct.  Able to send and receive health information in accordance with the standard specified in § 170.202(e)(1).

@170.315-h @transport @direct
Feature: Transport Methods and Other Protocols
  As a health IT developer
  I want to support standard transport methods
  So that health information can be exchanged securely

  Background:
    Given the Health IT Module exchanges health information
    And standard transport methods are required

  # ------ Direct Project ------

  Scenario: Support Direct Project SMTP
    Given I am implementing Direct messaging
    When using SMTP-based transport
    Then the system shall conform to § 170.202(d)
    And Applicability Statement for Secure Health Transport shall be supported
    And Direct messaging shall be functional

  Scenario: Support Direct Project delivery notification
    Given Direct messages are being sent
    When message delivery occurs
    Then the system shall support delivery notifications
    And notifications shall confirm receipt
    And delivery status shall be trackable

  Scenario: Process Direct message with XDM package
    Given Direct message contains XDM package
    When message is received
    Then the system shall process XDM package
    And package contents shall be accessible
    And data shall be available for use

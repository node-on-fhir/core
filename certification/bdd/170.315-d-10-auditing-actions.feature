# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-10-auditing-actions.feature
# § 170.315(d)(10) - Auditing Actions on Health Information

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(10)
#
# (10) Auditing actions on health information.
# (i) By default, be set to record actions related to electronic health information in accordance with the standard specified in § 170.210(e)(1).
# (ii) If technology permits auditing to be disabled, the ability to do so must be restricted to a limited set of users.
# (iii) Actions recorded related to electronic health information must not be capable of being changed, overwritten, or deleted by the technology.
# (iv) Technology must be able to detect whether the audit log has been altered.

@170.315-d-10 @audit-actions @privacy-security
Feature: Auditing Actions on Health Information
  As a compliance officer
  I want detailed auditing of health information actions
  So that I can track all activities related to patient data

  Background:
    Given the Health IT system is operational
    And comprehensive auditing is enabled

  Scenario: Record create actions
    Given a user creates new health information
    When the create action occurs
    Then the system shall record the action
    And audit entry shall include action type "create"
    And audit entry shall include all required metadata

  Scenario: Record read/view actions
    Given a user accesses health information
    When the read action occurs
    Then the system shall record the action
    And audit entry shall include action type "read"
    And patient information accessed shall be identified

  Scenario: Record update actions
    Given a user modifies existing health information
    When the update action occurs
    Then the system shall record the action
    And audit entry shall include action type "update"
    And changes made shall be documented

  Scenario: Record delete actions
    Given a user deletes health information
    When the delete action occurs
    Then the system shall record the action
    And audit entry shall include action type "delete"
    And deleted information shall be identifiable

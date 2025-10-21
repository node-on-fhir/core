# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-e-1-view-download-transmit.feature
# § 170.315(e)(1) - View, Download, and Transmit to 3rd Party

# REGULATORY TEXT FROM 45 CFR § 170.315(e)(1)
#
# (1) The action(s) (i.e., view, download, transmission) that occurred;

@170.315-e-1 @vdt @patient-access @patient-engagement
Feature: View, Download, and Transmit to 3rd Party
  As a patient
  I want to view, download, and transmit my health information
  So that I can access my data and share it with others

  Background:
    Given I am authenticated as a patient
    And my health information is available in the system

  Scenario: View health information online
    Given I am accessing my patient portal
    When I view my health information
    Then the system shall display my data in human readable format
    And all available USCDI data shall be viewable
    And the information shall be current and accurate

  Scenario: Download health information
    Given I am viewing my health information
    When I choose to download my data
    Then the system shall enable download
    And download shall be in machine-readable format
    And download shall include all requested data

  Scenario: Transmit to third party via encrypted email
    Given I want to share my health information
    When I transmit to a third party email address
    Then the system shall transmit encrypted
    And transmission shall be secure
    And third party shall be able to receive the data

  Scenario: Transmit to third party unencrypted with patient consent
    Given I want to share my health information
    And I accept the risks of unencrypted transmission
    When I choose unencrypted transmission
    Then the system shall warn me of risks
    And system shall transmit unencrypted only with my consent
    And my choice shall be documented

  Scenario: Access activity history log
    Given I have viewed, downloaded, or transmitted my data
    When I check my activity history
    Then the system shall display activity log
    And log shall show what data was accessed
    And log shall show when data was accessed
    And log shall show to whom data was transmitted

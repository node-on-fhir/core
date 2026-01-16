# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-14-implantable-device-list.feature
# § 170.315(a)(14) - Implantable Device List

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(14)
#
# (14) Implantable device list.
#
# (i) Record Unique Device Identifiers associated with a patient's Implantable Devices.
#
# (ii) Parse the following identifiers from a Unique Device Identifier:
#
# (A) Device Identifier; and
#
# (B) The following identifiers that compose the Production Identifier:
#
# (1) The lot or batch within which a device was manufactured;
#
# (2) The serial number of a specific device;
#
# (3) The expiration date of a specific device;
#
# (4) The date a specific device was manufactured; and
#
# (5) For an HCT/P regulated as a device, the distinct identification code required by 21 CFR 1271.290(c).
#
# (iii) Obtain and associate with each Unique Device Identifier:
#
# (A) A description of the implantable device referenced by at least one of the following:
#
# (1) The "GMDN PT Name" attribute associated with the Device Identifier in the Global Unique Device Identification Database.
#
# (2) The "SNOMED CT® Description" mapped to the attribute referenced in in paragraph (a)(14)(iii)(A)(1) of this section.
#
# (B) The following Global Unique Device Identification Database attributes:
#
# (1) "Brand Name";
#
# (2) "Version or Model";
#
# (3) "Company Name";
#
# (4) "What MRI safety information does the labeling contain?"; and
#
# (5) "Device required to be labeled as containing natural rubber latex or dry natural rubber (21 CFR 801.437)."
#
# (iv) Display to a user an implantable device list consisting of:
#
# (A) The active Unique Device Identifiers recorded for the patient;
#
# (B) For each active Unique Device Identifier recorded for a patient, the description of the implantable device specified by paragraph (a)(14)(iii)(A) of this section; and
#
# (C) A method to access all Unique Device Identifiers recorded for a patient.
#
# (v) For each Unique Device Identifier recorded for a patient, enable a user to access:
#
# (A) The Unique Device Identifier;
#
# (B) The description of the implantable device specified by paragraph (a)(14)(iii)(A) of this section;
#
# (C) The identifiers associated with the Unique Device Identifier, as specified by paragraph (a)(14)(ii) of this section; and
#
# (D) The attributes associated with the Unique Device Identifier, as specified by paragraph (a)(14)(iii)(B) of this section.
#
# (vi) Enable a user to change the status of a Unique Device Identifier recorded for a patient.

@170.315-a-14 @udi @implantable-devices @clinical
Feature: Implantable Device List
  As a healthcare provider
  I want to record and track implantable devices using Unique Device Identifiers
  So that I can ensure patient safety, support recall management, and provide accurate device information

  Background:
    Given I am authenticated as a provider
    And a patient record is selected

  # ------ Record UDI ------

  Scenario: Record Unique Device Identifier for implantable device
    Given a patient has received an implantable device
    When I record the device information
    Then the system shall enable recording of Unique Device Identifiers
    And the UDI shall be associated with the patient record
    And the UDI shall be stored in structured format

  # ------ Parse UDI Components ------

  Scenario: Parse Device Identifier from UDI
    Given a Unique Device Identifier has been recorded
    When the system processes the UDI
    Then the system shall parse the Device Identifier (DI)
    And the DI shall be stored as separate data element

  Scenario: Parse Production Identifier components from UDI
    Given a Unique Device Identifier has been recorded
    When the system processes the UDI
    Then the system shall parse lot or batch number
    And the system shall parse serial number
    And the system shall parse expiration date
    And the system shall parse manufacture date
    And all production identifiers shall be stored as separate data elements

  Scenario: Parse HCT/P distinct identification code from UDI
    Given a Unique Device Identifier for HCT/P regulated device has been recorded
    When the system processes the UDI
    Then the system shall parse distinct identification code per 21 CFR 1271.290(c)
    And the code shall be stored appropriately

  # ------ Obtain Device Information from GUDID ------

  Scenario: Obtain device description from GUDID
    Given a Unique Device Identifier has been entered
    When the system queries the Global Unique Device Identification Database
    Then the system shall obtain device description
    And description may be "GMDN PT Name" from GUDID
    Or description may be "SNOMED CT Description" mapped to GMDN PT Name

  Scenario: Obtain device brand name from GUDID
    Given a Unique Device Identifier has been entered
    When the system queries GUDID
    Then the system shall obtain "Brand Name" attribute
    And the brand name shall be associated with the UDI

  Scenario: Obtain device version or model from GUDID
    Given a Unique Device Identifier has been entered
    When the system queries GUDID
    Then the system shall obtain "Version or Model" attribute
    And the version/model shall be associated with the UDI

  Scenario: Obtain device company name from GUDID
    Given a Unique Device Identifier has been entered
    When the system queries GUDID
    Then the system shall obtain "Company Name" attribute
    And the manufacturer information shall be associated with the UDI

  Scenario: Obtain MRI safety information from GUDID
    Given a Unique Device Identifier has been entered
    When the system queries GUDID
    Then the system shall obtain MRI safety information
    And the information shall indicate MRI labeling content
    And MRI safety information shall be prominently available

  Scenario: Obtain latex allergy information from GUDID
    Given a Unique Device Identifier has been entered
    When the system queries GUDID
    Then the system shall obtain latex labeling information per 21 CFR 801.437
    And latex information shall be prominently available for patient safety

  # ------ Display Implantable Device List ------

  Scenario: Display patient's implantable device list
    Given a patient has recorded Unique Device Identifiers
    When I view the implantable device list
    Then the system shall display active Unique Device Identifiers
    And the system shall display device descriptions
    And the display shall be organized and easily reviewable

  Scenario: Display device description for each active UDI
    Given a patient has multiple active implantable devices
    When I view the implantable device list
    Then for each active UDI the system shall display device description
    And description shall be from GUDID per requirements
    And description shall be clinically meaningful

  Scenario: Provide method to access all UDIs for patient
    Given a patient has both active and inactive device records
    When I need to view complete device history
    Then the system shall provide method to access all UDIs
    And I shall be able to distinguish active from inactive devices
    And complete device history shall be accessible

  # ------ Access Individual UDI Details ------

  Scenario: Access complete UDI information
    Given a patient has a recorded Unique Device Identifier
    When I select a specific UDI to review
    Then the system shall enable access to the complete UDI
    And the system shall display the device description
    And the system shall display parsed production identifiers
    And the system shall display GUDID attributes

  Scenario: Access parsed identifiers for UDI
    Given a patient has a recorded Unique Device Identifier
    When I access the UDI details
    Then the system shall display lot/batch number
    And the system shall display serial number
    And the system shall display expiration date
    And the system shall display manufacture date
    And the system shall display HCT/P code if applicable

  Scenario: Access GUDID attributes for UDI
    Given a patient has a recorded Unique Device Identifier
    When I access the UDI details
    Then the system shall display brand name
    And the system shall display version or model
    And the system shall display company name
    And the system shall display MRI safety information
    And the system shall display latex information

  # ------ Change UDI Status ------

  Scenario: Change status of implantable device
    Given a patient has a recorded Unique Device Identifier
    When the device is explanted or status changes
    Then the system shall enable changing the status of the UDI
    And status change shall be recorded with date and reason
    And device shall move from active to inactive list

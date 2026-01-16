# certification/bdd/170.315-d-7-end-user-device-encryption.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(d)(7)
#
# (7) End-user device encryption.  The requirements specified in one of the following paragraphs (that is, paragraphs (d)(7)(i) and (d)(7)(ii) of this section) must be met to satisfy this certification criterion.
# (i) Technology that is designed to locally store electronic health information on end-user devices must encrypt the electronic health information stored on such devices after use of the technology on those devices stops.
# (A) Electronic health information that is stored must be encrypted in accordance with the standard specified in § 170.210(a)(2).
# (B) Default setting.  Technology must be set by default to perform this capability and, unless this configuration cannot be disabled by any user, the ability to change the configuration must be restricted to a limited set of identified users.
# (ii) Technology is designed to prevent electronic health information from being locally stored on end-user devices after use of the technology on those devices stops.

@170.315-d-7 @device-encryption @privacy-security
Feature: End-User Device Encryption
  As a system administrator
  I want to ensure data on end-user devices is protected
  So that health information is secured when devices are not in use

  Background:
    Given the technology stores or accesses health information on end-user devices

  # Option 1: Encrypt locally stored data

  Scenario: Encrypt stored health information after use stops
    Given the technology is designed to locally store health information
    And use of the technology has stopped
    When health information is stored on the device
    Then the system shall encrypt the information per § 170.210(a)(2)

  Scenario: Encryption enabled by default
    Given the technology stores health information locally
    When the system is configured
    Then encryption shall be set by default

  Scenario: Restrict ability to disable encryption
    Given encryption can be disabled
    When configuration changes are attempted
    Then only a limited set of identified users shall be able to change the configuration

  # Option 2: Prevent local storage

  Scenario: Prevent local storage of health information
    Given the technology is designed to prevent local storage
    When use of the technology stops
    Then electronic health information shall not be locally stored on end-user devices

# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-g-5-accessibility.feature
# § 170.315(g)(5) - Accessibility-Centered Design

# REGULATORY TEXT FROM 45 CFR § 170.315(g)(5)
#
# (5) Accessibility-centered design.  For each capability that a Health IT Module includes and for which that capability's certification is sought, the use of a health IT accessibility-centered design standard or law in the development, testing, implementation and maintenance of that capability must be identified.
# (i) When a single accessibility-centered design standard or law was used for applicable capabilities, it would only need to be identified once.
# (ii) When different accessibility-centered design standards and laws were applied to specific capabilities, each accessibility-centered design standard or law applied would need to be identified. This would include the application of an accessibility-centered design standard or law to some capabilities and none to others.
# (iii) When no accessibility-centered design standard or law was applied to all applicable capabilities such a response is acceptable to satisfy this certification criterion.

@170.315-g-5 @accessibility @wcag @design-performance
Feature: Accessibility-Centered Design
  As a health IT developer
  I want to design accessible systems
  So that users with disabilities can effectively use the system

  Background:
    Given I am developing health IT
    And accessibility is required

  Scenario: Apply accessibility standards
    Given I am designing user interfaces
    When developing the system
    Then I shall apply accessibility-centered design
    And design shall meet accessibility standards
    And system shall be usable by people with disabilities

  Scenario: Support assistive technologies
    Given users may use assistive technologies
    When designing interfaces
    Then the system shall support screen readers
    And the system shall support keyboard navigation
    And the system shall support other assistive technologies

  Scenario: Document accessibility approach
    Given accessibility standards have been applied
    When documenting the system
    Then accessibility approach shall be documented
    And standards used shall be identified
    Or statement shall be made that no accessibility standards were used

  Scenario: Test accessibility compliance
    Given the system has been developed
    When validating accessibility
    Then accessibility testing shall be conducted
    And non-compliance shall be identified and corrected
    And system shall meet accessibility requirements

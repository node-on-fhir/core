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
    And accessibility 508 compliance is required

  Scenario: Support assistive technologies
    Given users may use assistive technologies
    When designing interfaces
    Then the system shall support screen readers
    And the system shall support aria labels
    And the system shall support light/dark mode for the vision impaired
    And the system shall support keyboard navigation
    And the system shall support speach dictation
    And the system shall support agentic software agent navigation with Comet Browser

  
# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-g-6-ccda-performance.feature
# § 170.315(g)(6) - Consolidated CDA Creation Performance

# REGULATORY TEXT FROM 45 CFR § 170.315(g)(6)
#
# (6) Consolidated CDA creation performance.  The following technical and performance outcomes must be demonstrated related to Consolidated CDA creation. The capabilities required under paragraphs (g)(6)(i) through (v) of this section can be demonstrated in tandem and do not need to be individually addressed in isolation or sequentially.
# (i) This certification criterion's scope includes:
# (A) The data classes expressed in the standards in § 170.213 in accordance with § 170.205(a)(4) and (a)(5) and paragraphs (g)(6)(i)(C)(1) through (4) of this section for the time period up to and including December 31, 2025; or
# (B) The data classes expressed in the standards in § 170.213, and in accordance with § 170.205(a)(4) and (6) and paragraphs (g)(6)(i)(C)(1) through (3) of this section.
# (C) The following data classes:

@170.315-g-6 @ccda @performance @design-performance
Feature: Consolidated CDA Creation Performance
  As a health IT developer
  I want to ensure C-CDA creation performance
  So that the system creates valid C-CDA documents

  Background:
    Given the clinical:data-exporter package is installed

  Scenario: Export to CCD documents
    Given I am creating Continuity of Care Document
    When generating the CCD
    Then the document shall conform to C-CDA standards
    And the document shall be valid
    And the document shall be processable by receiving systems
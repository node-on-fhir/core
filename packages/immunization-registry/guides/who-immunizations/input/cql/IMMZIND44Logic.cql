/*
 * Library: IMMZ.IND.44 Logic
 * Adverse event following immunization (AEFI) cases
 * The total number of adverse events following the administration of vaccines during the reporting period
 * 
 * Numerator: Number of AEFI cases during the reporting period
 * Numerator Computation: COUNT of immunization events WHERE "Reaction reported" is "Yes" AND "Date and time of vaccination" is during the reporting period
 * Denominator: Not applicable
 * Denominator Computation: Not applicable
 * 
 * Disaggregation
 *  - Vaccine type: BCG, OPV, etc.
 *  - Vaccine manufacturer
 *  - Type of reaction: non-serious, disability, etc.
 *  - Administrative area
 *  - Reaction manifestation: rash, vomiting, etc.
 *
 * References: WHO Immunization facility analysis guide (5)
 * 
 * Annotations: –
 */
library IMMZIND44Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements


parameter "Measurement Period" Interval<Date> default Interval[@2025-01-01, @2025-12-31]

context Immunization

/*
 * As defined by Member State
 */
define "Initial Population":
  true

/*
@denominator: Not applicable
@pseudocode: Not applicable
*/
define "Denominator":
  true

/*
@numerator: Number of AEFI cases during the reporting period
@pseudocode: COUNT of immunization events WHERE "Reaction reported" is "Yes" AND "Date and time of vaccination" is during the reporting period
*/
define "Numerator":
  exists Elements."Adverse Events for Immunization"

/*
@disaggregation: Vaccine type: BCG, OPV, etc.
                 Vaccine manufacturer
                 Type of reaction: non-serious, disability, etc.
                 Administrative area
                 Reaction manifestation: rash, vomiting, etc.
*/
define "Stratification 1":
  First( Immunization.vaccineCode.coding )

define "Stratification 2":
  Immunization.manufacturer

define "Stratification 3":
  First( First (Elements."Adverse Events for Immunization" ).seriousness.coding )

define "Stratification 4":
  Elements.GetGeographicRegionForImmunization( Immunization )

define "Stratification 5":
  First( First (Elements."Adverse Events for Immunization" ).event.coding )  
/*
define "Stratification 1":
	Elements."By Geographic Region Stratifier"

define "Stratification 2":
	Elements."By Administrative Gender Stratifier"

define "Stratification 3":
	Elements."Age Stratifier"

define "Stratification 4":
	Elements."By Age Group Stratifier"
*/
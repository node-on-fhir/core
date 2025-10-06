/*
 * Library: IMMZ.IND.45 Logic
 * Immunization session completion rate
 * The percentage of immunization sessions completed during the reporting period
 * 
 * Numerator: Number of immunization sessions completed at the vaccination location during the reporting period
 * Numerator Computation: COUNT of immunization events WHERE "Immunization event status" = "Completed" during the reporting period
 * Denominator: Number of planned immunization sessions at the vaccination location during the reporting period
 * Denominator Computation: COUNT number of planned sessions during the reporting period
 * 
 * Disaggregation
 *  - Vaccination location
 *  - Administrative area
 *
 * References: WHO Immunization facility analysis guide (5)
 * 
 * Annotations: –
 */
library IMMZIND45Logic

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
  Immunization.occurrence is not null
  and Immunization.occurrence.toInterval() starts during "Measurement Period"

/*
@denominator: Number of planned immunization sessions at the vaccination location during the reporting period
@pseudocode: COUNT number of planned sessions during the reporting period
*/
define "Denominator":
  "Initial Population"

/*
@numerator: Number of immunization sessions completed at the vaccination location during the reporting period
@pseudocode: COUNT of immunization events WHERE "Immunization event status" = "Completed" during the reporting period
*/
define "Numerator":
  "Denominator"
    and Immunization.status = 'completed'

/*
@disaggregation: Vaccination location
                 Administrative area
*/
define "Stratification 1":
  Elements.GetLocationNameForImmunization( Immunization )

define "Stratification 2":
  Elements.GetGeographicRegionForImmunization( Immunization )

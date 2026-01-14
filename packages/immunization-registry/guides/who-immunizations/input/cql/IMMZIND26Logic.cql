/*
 * Library: IMMZ.IND.26 Logic
 * Immunization coverage for yellow fever vaccine
 * The percentage in the target population who have received one dose of yellow fever vaccine during the reporting period
 * 
 * Numerator: Number of yellow fever vaccine doses administered through routine services during the reporting period
 * Numerator Computation: COUNT of immunization events WHERE "Vaccine type" = "Yellow fever vaccines" AND "Date and time of vaccination" is during the reporting period
 * Denominator: Number in target group
 * Denominator Computation: As defined by the Member States
 * 
 * Disaggregation
 *  - Administrative area
 *  - Sex
 *  - Age in years
 *  - Age group (depending on schedule)
 *
 * References: WHO/UNICEF joint reporting form (1)
 *   WHO Immunization data portal (2)
 *   WHO Immunization facility analysis guide (5)
 *   WHO Handbook on immunization data (6)
 * 
 * Annotations: The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.
 *   As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is surviving infants for countries recommending yellow fever vaccination in the first year of life. Then, the single age cohort population estimates for the targeted cohort.
 */
library IMMZIND26Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements

include IMMZD2DTYellowfeverElements called Yellowfever

parameter "Measurement Period" Interval<Date> default Interval[@2025-01-01, @2025-12-31]

context Patient

/*
 * As defined by Member State
 */
define "Initial Population":
  true

/*
@denominator: Number in target group
@pseudocode: As defined by the Member States
*/
define "Denominator":
  true

/*
@numerator: Number of yellow fever vaccine doses administered through routine services during the reporting period
@pseudocode: COUNT of immunization events WHERE "Vaccine type" = "Yellow fever vaccines" AND "Date and time of vaccination" is during the reporting period
*/
define "Numerator":
    exists( Yellowfever."Yellow fever Doses Administered to Patient" I
      where I.occurrence.toInterval() starts during "Measurement Period" )

/*
@disaggregation: Administrative area
                 Sex
                 Age in years
                 Age group (depending on schedule)
*/
define "Stratification 1":
	Elements."By Geographic Region Stratifier"

define "Stratification 2":
	Elements."By Administrative Gender Stratifier"

define "Stratification 3":
	Elements."Age Stratifier"

define "Stratification 4":
	Elements."By Age Group Stratifier"

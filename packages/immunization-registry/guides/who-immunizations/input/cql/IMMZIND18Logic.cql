/*
 * Library: IMMZ.IND.18 Logic
 * Immunization coverage for pneumococcal conjugate vaccine, 2nd dose
 * The percentage in the target population who have received a 2nd dose of pneumococcal conjugate vaccine during the reporting period
 * 
 * Numerator: Number of pneumococcal vaccine doses (2nd dose) administered through routine services during the reporting period
 * Numerator Computation: COUNT of immunization events WHERE "Vaccine type" = "Pneumococcal vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period
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
 *   As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is surviving infants for doses recommended in the first year of life. Then, the single age cohort population estimates for the targeted cohort.
 */
library IMMZIND18Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements

include IMMZD2DTPneumococcalElements called Pneumococcal

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
@numerator: Number of pneumococcal vaccine doses (2nd dose) administered through routine services during the reporting period
@pseudocode: COUNT of immunization events WHERE "Vaccine type" = "Pneumococcal vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period
*/
define "Numerator":
  exists( (Pneumococcal."Pneumococcal Primary Series Doses Administered to Patient".getDose('2')) I
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
	Elements."Toddler By Age Stratifier"

/*
 * Library: IMMZ.IND.36 Logic
 * Drop-out rate of BCG to measles and rubella-containing vaccine 1st dose
 * The percentage in the target population who received a dose of BCG vaccine at birth (or early life) but have not received the 1st dose of measles and rubella-containing vaccine (i.e. are past due for measles and rubella-containing vaccine 1st dose) during the reporting period
 * 
 * Numerator: Number of clients who received BCG vaccine during the reporting period who should have received 1st dose of measles and rubella-containing vaccine during the reporting period but did not receive it
 * Numerator Computation: (COUNT of clients with an immunization event WHERE "Vaccine type"" = "BCG vaccines" AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an immunization event WHERE "Vaccine type" = "Measles and rubella-containing vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period)
 * Denominator: Number of clients in the target population who received BCG vaccine during the reporting period
 * Denominator Computation: COUNT clients with an immunization event WHERE "Vaccine type" = "BCG vaccines" AND "Date and time of vaccination" is during the reporting period
 * 
 * Disaggregation
 *  - Administrative area
 *  - Sex
 *  - Age in years
 *  - Age group (depending on schedule)
 *
 * References: WHO Immunization facility analysis guide (5)
 * 
 * Annotations: –
 */
library IMMZIND36Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements

include IMMZD2DTBCGElements called BCG

parameter "Measurement Period" Interval<Date> default Interval[@2025-01-01, @2025-12-31]

context Patient

/*
 * As defined by Member State
 */
define "Initial Population":
  true

/*
@denominator: Number of clients in the target population who received BCG vaccine during the reporting period
@pseudocode: COUNT clients with an immunization event WHERE "Vaccine type" = "BCG vaccines" AND "Date and time of vaccination" is during the reporting period
@note: Only including those who are eligible for first dose of Measles/rubella at 9 months and who have 
        received the BCG dose.  This is for high incidence of Measles/rubella.  For low incidence this should be 12 months.
*/
define "Denominator":
  exists( BCG."BCG Doses Administered to Patient" I )
  and Patient.birthDate + 9 months during "Measurement Period" 

/*
@numerator: Number of clients who received BCG vaccine during the reporting period who should have received 1st dose of measles and rubella-containing vaccine during the reporting period but did not receive it
@pseudocode: (COUNT of clients with an immunization event WHERE "Vaccine type"" = "BCG vaccines" AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an immunization event WHERE "Vaccine type" = "Measles and rubella-containing vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period)
@note: Only include those from the denominator that did not receive a measles/rubella 1st dose during the measurement period.
        Those where the 1st dose due date is during the period but have not received the 1st dose.
*/
define "Numerator":
  "Denominator"
  and not exists( Elements."Measles and Rubella Doses Administered to Patient During Measurement Period".getDose('1') )

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
	Elements."Infant By Age Stratifier"

/*
 * Library: IMMZ.IND.35 Logic
 * Drop-out rate of pentavalent vaccine 1st dose to pentavalent vaccine 3rd dose
 * The percentage in the target population who received a 1st dose of pentavalent vaccine but have not received the 3rd dose of pentavalent vaccine (i.e. are past due for the 3rd dose of pentavalent vaccine) during the reporting period
 * 
 * Numerator: Number of clients who received a 1st dose of pentavalent vaccine during the reporting period who should have received (via scheduling logic) the 3rd dose of pentavalent vaccine during the reporting period but did not receive it
 * Numerator Computation: (COUNT of clients with an immunization event WHERE "Vaccine type" = "Pentavalent vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an immunization event WHERE "Vaccine type" = "Pentavalent vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period)
 * Denominator: Number of clients in the target population who received dose 1 of pentavalent vaccine during the reporting period
 * Denominator Computation: Count clients with an immunization event WHERE "Vaccine type" = "pentavalent vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period
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
library IMMZIND35Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements


parameter "Measurement Period" Interval<Date> default Interval[@2025-01-01, @2025-05-31]

context Patient

/*
 * As defined by Member State
 */
define "Initial Population":
  true

/*
@denominator: Number of clients in the target population who received dose 1 of pentavalent vaccine during the reporting period
@pseudocode: Count clients with an immunization event WHERE "Vaccine type" = "pentavalent vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period
@note: Updated to match the definition to only include those who are due for the 3rd dose.
       If client ever received a 2nd dose the due date is 4 weeks after that.
       If client has only received the 1st dose, the due date is 8 weeks after that.
       Only include in the denominator those who are due during the measurement period.
*/
define "Denominator":
  if exists (Elements."Pentavalent Doses Administered to Patient".getDose('2'))
  then exists( (Elements."Pentavalent Doses Administered to Patient".getDose('2')) I
        where (start of I.occurrence.toInterval() + 4 weeks) during "Measurement Period" )
  else exists( (Elements."Pentavalent Doses Administered to Patient".getDose('1')) I
        where (start of I.occurrence.toInterval() + 8 weeks) during "Measurement Period" )


/*
@numerator: Number of clients who received a 1st dose of pentavalent vaccine during the reporting period who should have received (via scheduling logic) the 3rd dose of pentavalent vaccine during the reporting period but did not receive it
@pseudocode: (COUNT of clients with an immunization event WHERE "Vaccine type" = "Pentavalent vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an immunization event WHERE "Vaccine type" = "Pentavalent vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period)
@note: Only include those from the denominator that did not receive a 3rd dose during the measurement period.
        Those where the 3rd dose due date is during the period but have not received the 3rd dose.
*/
define "Numerator":
  "Denominator"
  and not exists( Elements."Pentavalent Doses Administered to Patient During Measurement Period".getDose('3') )

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

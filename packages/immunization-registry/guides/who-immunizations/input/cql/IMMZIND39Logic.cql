/*
 * Library: IMMZ.IND.39 Logic
 * Drop-out rate from the 3rd dose of malaria vaccines to the 4th dose
 * The percentage in the target population who received a 3rd dose of malaria vaccine but have not received the 4th dose of malaria vaccine (i.e. are past due for malaria vaccine 4th dose) during the reporting period
 * 
 * Numerator: Number of clients who received the 3rd dose of malaria vaccine during the reporting period who should have received (via scheduling logic) the 4th dose of malaria vaccine during the reporting period but did not receive it
 * Numerator Computation: (COUNT of clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 4th dose in the primary series AND "Date and time of vaccination" is during the reporting period)
 * Denominator: Number of clients in the target population who received dose 3 of malaria vaccine during the reporting period
 * Denominator Computation: COUNT clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period
 * 
 * Disaggregation
 *  - Administrative area
 *  - Sex
 *  - Age in years
 *  - Age group (depending on schedule)
 *
 * References: Guide to introduce malaria vaccine (4)
 * 
 * Annotations: –
 */
library IMMZIND39Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements

include IMMZD2DTMalariaElements called Malaria

parameter "Measurement Period" Interval<Date> default Interval[@2025-01-01, @2025-12-31]

context Patient

/*
 * As defined by Member State
 */
define "Initial Population":
  true

/*
@denominator: Number of clients in the target population who received dose 3 of malaria vaccine during the reporting period
@pseudocode: COUNT clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period
@note: Put 4 weeks as the minimum, but note the scheduling table recommends being at least a year so this may be better to be
        a 12 month for the due date or even 18 months for the overdue date.
*/
define "Denominator":
  exists( (Malaria."Malaria Primary Series Doses Administered to Patient".getDose('3')) I
    where (start of I.occurrence.toInterval() + 4 weeks) during "Measurement Period" )

/*
@numerator: Number of clients who received the 3rd dose of malaria vaccine during the reporting period who should have received (via scheduling logic) the 4th dose of malaria vaccine during the reporting period but did not receive it
@pseudocode: (COUNT of clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 4th dose in the primary series AND "Date and time of vaccination" is during the reporting period)
*/
define "Numerator":
  "Denominator"
  and not exists( (Malaria."Malaria Primary Series Doses Administered to Patient".getDose('4')) I
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
	Elements."Infant By Age Stratifier"

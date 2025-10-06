/*
 * Library: IMMZ.IND.06 Logic
 * Immunization coverage for oral polio vaccine (OPV), 1st dose
 * The percentage in the target population who have received the 1st dose of oral polio vaccine (OPV) during the reporting period
 * 
 * Numerator: Number of OPV doses (1st dose) administered through routine services during the reporting period
 * Numerator Computation: COUNT of immunization events WHERE "Vaccine type" = "Oral polio vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period
 * Denominator: Number in target group
 * Denominator Computation: As defined by the Member States
 * 
 * Disaggregation
 *  - Administrative area
 *  - Sex
 *  - Age in years
 *  - Age group (depending on schedule)
 *
 * References: WHO Immunization facility analysis guide (5)
 *   WHO Handbook on immunization data (6)
 * 
 * Annotations: –
 */
library IMMZIND06Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements

include IMMZD2DTPolioElements called Polio

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
@numerator: Number of OPV doses (1st dose) administered through routine services during the reporting period
@pseudocode: COUNT of immunization events WHERE "Vaccine type" = "Oral polio vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period
*/
define "Numerator":
  Coalesce( Polio."Polio bOPV Primary Series Doses Administered to Patient".sortedIndex(0).occurrence.toInterval() starts during "Measurement Period",
    false )

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

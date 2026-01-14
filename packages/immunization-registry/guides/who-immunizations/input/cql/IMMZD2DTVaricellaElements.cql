
/*
  * Library: IMMZD2DTVaricellaElements
  */
library IMMZD2DTVaricellaElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZElements called Elements

context Patient

/*
@internal: Varicella containing Doses Administered to Patient
*/
define "Varicella Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Varicella-containing vaccines"

/*
@internal: Varicella containing Doses Administered to Patient that are in the Primary series
*/
define "Varicella Primary Series Doses Administered to Patient":
  "Varicella Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Varicella Primary Series doses
*/
define "Number of Varicella Primary Series Doses Administered":
  Count("Varicella Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last Varicella dose
*/
define "Date of Latest Varicella Dose":
  date from start of "Varicella Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No varicella primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Varicella-containing vaccines" and "Type of dose" = "Primary series") = 0
@decision: 1-dose schedule
*/
define "No varicella primary series dose was administered":
  "Number of Varicella Primary Series Doses Administered" = 0

/*
@input: No varicella primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Varicella-containing vaccines" and "Type of dose" = "Primary serie
s") = 0
@decision: 2-dose schedule
*/
define "No varicella primary series doses were administered":
  "No varicella primary series dose was administered"

/*
@input: One varicella primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Varicella-containing vaccines" and "Type of dose" = "Primary series") = 1
@decision: 1-dose schedule
@decision: 2-dose schedule
*/
define "One varicella primary series dose was administered":
  "Number of Varicella Primary Series Doses Administered" = 1

/*
@input: Two varicella primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Varicella-containing vaccines" and "Type of dose" = "Primary serie
s") = 2
@decision: 2-dose schedule
*/
define "Two varicella primary series doses were administered":
  "Number of Varicella Primary Series Doses Administered" = 2

/*
@input: Client's age is less than 12 months
@pseudocode: Today's date − "Date of birth" < 12 months
@decision: 1-dose schedule
@decision: 2-dose schedule
*/
define "Client's age is less than 12 months":
  Elements."Current Patient Age In Months" < 12

/*
@input: Cient's age is more than or equal to 12 months
@pseudocode: Today's date − "Date of birth" ≥ 12 months
@decision: 1-dose schedule
@decision: 2-dose schedule
*/
define "Cient's age is more than or equal to 12 months":
  Elements."Current Patient Age In Months" >= 12

/*
@input: The latest varicella dose administered less than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Varicella-containing vaccines") < 4 weeks
@decision: 2-dose schedule
*/
define "The latest varicella dose administered less than 4 weeks ago":
	"Date of Latest Varicella Dose" is not null 
    and duration in weeks between "Date of Latest Varicella Dose" and Now() < 4

/*
@input: The latest varicella dose administered more than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Varicella-containing vaccines") ≥ 4 weeks
@decision: 2-dose schedule
*/
define "The latest varicella dose administered more than 4 weeks ago":
  not "The latest varicella dose administered less than 4 weeks ago"

/*
@input: Live vaccine was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
@decision: 1-dose schedule
@decision: 2-dose schedule
*/
define "Live vaccine was administered in the past 4 weeks":
  Elements."Live vaccine was administered in the last 4 weeks"

/*
@input: No live vaccine was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) ≥ 4 weeks
@decision: 1-dose schedule
@decision: 2-dose schedule
*/
define "No live vaccine was administered in the past 4 weeks":
  Elements."No live vaccine was administered in the last 4 weeks"


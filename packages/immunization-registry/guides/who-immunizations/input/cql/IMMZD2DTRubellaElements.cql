
/*
  * Library: IMMZD2DTRubellaElements
  */
library IMMZD2DTRubellaElements

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
@internal: Rubella containing Doses Administered to Patient
*/
define "Rubella Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Rubella-containing vaccines"

/*
@internal: Rubella containing Doses Administered to Patient that are in the Primary series
*/
define "Rubella Primary Series Doses Administered to Patient":
  "Rubella Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Rubella Primary Series doses
*/
define "Number of Rubella Primary Series Doses Administered":
  Count("Rubella Primary Series Doses Administered to Patient")


/*
@input: No rubella primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rubella-containing vaccines" and "Type of dose" = "Primary series") = 0
@decision: Countries with high incidence and mortality from rubella
@decision: Countries with low incidence of rubella						
*/
define "No rubella primary series dose was administered":
  "Number of Rubella Primary Series Doses Administered" = 0

/*
@input: One rubella primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rubella-containing vaccines" and "Type of dose" = "Primary series") = 1
@decision: Countries with high incidence and mortality from rubella
@decision: Countries with low incidence of rubella						
*/
define "One rubella primary series dose was administered":
  "Number of Rubella Primary Series Doses Administered" = 1

/*
@input: Client's age is less than 9 months
@pseudocode: Today's date − "Date of birth" < 9 months
@decision: Countries with high incidence and mortality from rubella
*/
define "Client's age is less than 9 months":
  Elements."Current Patient Age In Months" < 9

/*
@input: Client's age is more than or equal to 9 months
@pseudocode: Today's date − "Date of birth" ≥ 9 months
@decision: Countries with high incidence and mortality from rubella
*/
define "Client's age is more than or equal to 9 months":
  Elements."Current Patient Age In Months" >= 9

/*
@input: Client's age is less than 12 months
@pseudocode: Today's date − "Date of birth" < 12 months
@decision: Countries with low incidence of rubella						
*/
define "Client's age is less than 12 months":
  Elements."Current Patient Age In Months" < 12

/*
@input: Client's age is more than or equal to 12 months
@pseudocode: Today's date − "Date of birth" ≥ 12 months
@decision: Countries with low incidence of rubella						
*/
define "Client's age is more than or equal to 12 months":
  Elements."Current Patient Age In Months" >= 12

/*
@input: No live vaccine was administered in the last 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) ≥ 4 weeks
@decision: Countries with high incidence and mortality from rubella
@decision: Countries with low incidence of rubella						
*/
define "No live vaccine was administered in the last 4 weeks":
  Elements."No live vaccine was administered in the last 4 weeks"

/*
@input: Live vaccine was administered in the last 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
@decision: Countries with high incidence and mortality from rubella
*/
define "Live vaccine was administered in the last 4 weeks":
  Elements."Live vaccine was administered in the last 4 weeks"

/*
@input: Live vaccine was administered in the last the 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
@decision: Countries with low incidence of rubella						
*/
define "Live vaccine was administered in the last the 4 weeks":
  Elements."Live vaccine was administered in the last 4 weeks"

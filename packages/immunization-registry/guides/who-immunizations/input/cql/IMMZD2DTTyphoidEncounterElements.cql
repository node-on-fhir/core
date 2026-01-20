
/*
  * Library: IMMZD2DTTyphoidEncounterElements
  */
library IMMZD2DTTyphoidEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTTyphoidElements called TyphoidElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Typhoid containing Doses Administered to Patient
*/
define "Typhoid Doses Administered to Patient":
  Encounter."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Typhoid vaccines"

/*
@internal: Typhoid containing Doses Administered to Patient that are in the Primary series
*/
define "Typhoid Primary Series Doses Administered to Patient":
  "Typhoid Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Typhoid Primary Series doses
*/
define "Number of Typhoid Primary Series Doses Administered":
  Count("Typhoid Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last Typhoid dose
*/
define "Date of Latest Typhoid Dose":
  date from start of "Typhoid Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No typhoid primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Typhoid vaccines" and "Type of dose" = "Primary series") = 0
@decision: Typhoid conjugate vaccine (TCV) schedule
@decision: Unconjugated Vi polysaccharide (ViPS) schedule
*/
define "No typhoid primary series doses were administered":
  "Number of Typhoid Primary Series Doses Administered" = 0

/*
@input: One typhoid primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Typhoid vaccines" and "Type of dose" = "Primary series") = 1
@decision: Typhoid conjugate vaccine (TCV) schedule
@decision: Unconjugated Vi polysaccharide (ViPS) schedule
*/
define "One typhoid primary series dose was administered":
  "Number of Typhoid Primary Series Doses Administered" = 1

/*
@input: Client's age is less than 6 months
@pseudocode: Today's date − "Date of birth" < 6 months
@decision: Typhoid conjugate vaccine (TCV) schedule
*/
define "Client's age is less than 6 months":
  Encounter."Current Patient Age In Months" < 6

/*
@input: Client's age is between 6 months and 45 years
@pseudocode: 6 months ≤ Today's date − "Date of birth" < 45 years
@decision: Typhoid conjugate vaccine (TCV) schedule
*/
define "Client's age is between 6 months and 45 years":
  6 <= Encounter."Current Patient Age In Months" 
  and Encounter."Current Patient Age In Years" < 45

/*
@input: Client's age is more than or equal to 45 years
@pseudocode: Today's date − "Date of birth" ≥ 45 years
@decision: Typhoid conjugate vaccine (TCV) schedule
*/
define "Client's age is more than or equal to 45 years":
  Encounter."Current Patient Age In Years" >= 45

/*
@input: Client's age is less than 2 years
@pseudocode: Today's date − "Date of birth" < 2 years
@decision: Unconjugated Vi polysaccharide (ViPS) schedule
*/
define "Client's age is less than 2 years":
  Encounter."Current Patient Age In Years" < 2

/*
@input: Client's age is more than or equal to 2 years
@pseudocode: Today's date − "Date of birth" ≥ 2 years
@decision: Unconjugated Vi polysaccharide (ViPS) schedule
*/
define "Client's age is more than or equal to 2 years":
  Encounter."Current Patient Age In Years" >= 2

/*
@input: Client's age is less than 6 years
@pseudocode: Today's date − "Date of birth" < 6 years
@decision: Live attenuated Ty21a vaccine schedule
*/
define "Client's age is less than 6 years":
  Encounter."Current Patient Age In Years" < 6

/*
@input: Client's age is more than or equal to 6 years
@pseudocode: Today's date − "Date of birth" ≥ 6 years
@decision: Live attenuated Ty21a vaccine schedule
*/
define "Client's age is more than or equal to 6 years":
  Encounter."Current Patient Age In Years" >= 6

/*
@input: Primary series is not complete
@pseudocode: "Completed the primary vaccination series" (where "Vaccine type" = "Typhoid vaccines") ≠ TRUE
@decision: Live attenuated Ty21a vaccine schedule
*/
define "Primary series is not complete":
  not "Primary series is complete"

/*
@input: Primary series is complete
@pseudocode: "Completed the primary vaccination series" (where "Vaccine type" = "Typhoid vaccines") = TRUE
@decision: Live attenuated Ty21a vaccine schedule
*/
define "Primary series is complete":
  "One typhoid primary series dose was administered"
  or Coalesce( 
    "Typhoid Doses Administered to Patient" Dose
    aggregate Result: Encounter."Completed the primary vaccination series Observation".partOf.references(Dose) or Result, 
    false ) 

/*
@input: The latest typhoid dose was administered less than 3 years ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines") < 3 years
@decision: Unconjugated Vi polysaccharide (ViPS) schedule
*/
define "The latest typhoid dose was administered less than 3 years ago":
  "Date of Latest Typhoid Dose" is not null
    and duration in years between "Date of Latest Typhoid Dose" and Today < 3

/*
@input: The latest typhoid dose was administered more than 3 years ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines") ≥ 3 years
@decision: Unconjugated Vi polysaccharide (ViPS) schedule
*/
define "The latest typhoid dose was administered more than 3 years ago":
  not "The latest typhoid dose was administered less than 3 years ago"

/*
@input: No live vaccine, other than typhoid, was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE AND "Vaccine type" ≠ "Typhoid vaccines") ≥ 4 weeks
@decision: Live attenuated Ty21a vaccine schedule
@note: this is only ever called when Typhoid vaccine is more than 3 years old so no need to limit it to not Typhoid
*/
define "No live vaccine, other than typhoid, was administered in the past 4 weeks":
  Encounter."No live vaccine was administered in the last 4 weeks"

/*
@input: Live vaccine, other than typhoid, was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE AND "Vaccine type" ≠ "Typhoid vaccines") < 4 weeks
@decision: Live attenuated Ty21a vaccine schedule
@note: this is only ever called when Typhoid vaccine is more than 3 years old so no need to limit it to not Typhoid
*/
define "Live vaccine, other than typhoid, was administered in the past 4 weeks":
  Encounter."Live vaccine was administered in the last 4 weeks"


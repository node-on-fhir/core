
/*
  * Library: IMMZD2DTSeasonalinfluenzaEncounterElements
  */
library IMMZD2DTSeasonalinfluenzaEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTSeasonalinfluenzaElements called SeasonalinfluenzaElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Seasonal influenza containing Doses Administered to Patient
*/
define "Seasonal influenza Doses Administered to Patient":
  Encounter."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Seasonal influenza vaccines"

/*
@internal: Seasonal influenza containing Doses Administered to Patient that are in the Primary series
*/
define "Seasonal influenza Primary Series Doses Administered to Patient":
  "Seasonal influenza Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Seasonal influenza Primary Series doses
*/
define "Number of Seasonal influenza Primary Series Doses Administered":
  Count("Seasonal influenza Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last Seasonal influenza dose
*/
define "Date of Latest Seasonal influenza Dose":
  date from start of "Seasonal influenza Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No seasonal influenza primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Seasonal influenza vaccines" and "Type of dose" = "Primary series") = 0
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "No seasonal influenza primary series doses were administered":
  "Number of Seasonal influenza Primary Series Doses Administered" = 0

/*
@input: One seasonal influenza primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Seasonal influenza vaccines" and "Type of dose" = "Primary series") = 1
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "One seasonal influenza primary series doses were administered":
  "Number of Seasonal influenza Primary Series Doses Administered" = 1

/*
@input: Two seasonal influenza primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Seasonal influenza vaccines" and "Type of dose" = "Primary series") = 2
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "Two seasonal influenza primary series doses were administered":
  "Number of Seasonal influenza Primary Series Doses Administered" = 2

/*
@input: Client's age is less than 6 months
@pseudocode: Today's date − "Date of birth" < 6 months
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "Client's age is less than 6 months":
  Encounter."Current Patient Age In Months" < 6

/*
@input: Client's age is more than or equal to 6 months
@pseudocode: Today's date − "Date of birth" ≥ 6 months
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "Client's age is more than or equal to 6 months":
  Encounter."Current Patient Age In Months" >= 6

/*
@input: Client's age is less than 9 years
@pseudocode: Today's date − "Date of birth" < 9 years
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "Client's age is less than 9 years":
  Encounter."Current Patient Age In Years" < 9

/*
@input: Client's age is more than or equal to 9 years
@pseudocode: Today's date − "Date of birth" ≥ 9 years
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "Client's age is more than or equal to 9 years":
  Encounter."Current Patient Age In Years" >= 9

/*
@input: The latest seasonal influenza dose was administered less than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines") < 4 weeks
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "The latest seasonal influenza dose was administered less than 4 weeks ago":
  "Date of Latest Seasonal influenza Dose" is not null 
  and duration in weeks between "Date of Latest Seasonal influenza Dose" and Today < 4

/*
@input: The latest seasonal influenza dose was administered more than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines") ≥ 4 weeks
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "The latest seasonal influenza dose was administered more than 4 weeks ago":
  not "The latest seasonal influenza dose was administered less than 4 weeks ago"

/*
@input: The latest seasonal influenza dose was administered less than 1 year ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines") < 1 year
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "The latest seasonal influenza dose was administered less than 1 year ago":
  "Date of Latest Seasonal influenza Dose" is not null 
  and duration in years between "Date of Latest Seasonal influenza Dose" and Today < 1

/*
@input: The latest seasonal influenza dose was administered more than 1 year ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines") ≥ 1 year
@decision: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
*/
define "The latest seasonal influenza dose was administered more than 1 year ago":
  not "The latest seasonal influenza dose was administered less than 1 year ago"


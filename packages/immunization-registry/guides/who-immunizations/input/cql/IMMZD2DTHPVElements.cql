
/*
  * Library: IMMZD2DTHPVElements
  */
library IMMZD2DTHPVElements

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
@internal: HPV containing Doses Administered to Patient
*/
define "HPV Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."HPV vaccines"

/*
@internal: HPV containing Doses Administered to Patient that are in the Primary series
*/
define "HPV Primary Series Doses Administered to Patient":
  "HPV Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of HPV Primary Series doses
*/
define "Number of HPV Primary Series Doses Administered":
  Count("HPV Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last HPV dose
*/
define "Date of Latest HPV Dose":
  date from start of "HPV Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No HPV primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 0
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "No HPV primary series doses were administered":
  "Number of HPV Primary Series Doses Administered" = 0

/*
@input: One HPV primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 1
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "One HPV primary series dose was administered":
  "Number of HPV Primary Series Doses Administered" = 1

/*
@input: Two HPV primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 2
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "Two HPV primary series doses were administered":
  "Number of HPV Primary Series Doses Administered" = 2

/*
@input: Three HPV primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 3
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "Three HPV primary series doses were administered":
  "Number of HPV Primary Series Doses Administered" = 3

/*
@input: Client's age is less than 9 years
@pseudocode: Today's date − "Date of birth" < 9 years
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "Client's age is less than 9 years":
  Elements."Current Patient Age In Years" < 9

/*
@input: Client's age is between 9 and 14 years
@pseudocode: 9 years ≤ Today's date − "Date of birth" ≤ 14 years
@decision: 2-dose schedule
*/
define "Client's age is between 9 and 14 years":
  9 <= Elements."Current Patient Age In Years" 
  and Elements."Current Patient Age In Years" <= 14

/*
@input: Client's age more than or equal to 15 years
@pseudocode: Today's date − "Date of birth" ≥ 15 years
@decision: 2-dose schedule
*/
define "Client's age more than or equal to 15 years":
  Elements."Current Patient Age In Years" >= 15

/*
@input: Client's age is between 9 and 20 years
@pseudocode: 9 years ≤ Today's date − "Date of birth" ≤ 20 years
@decision: Alternative single-dose schedule
*/
define "Client's age is between 9 and 20 years":
  9 <= Elements."Current Patient Age In Years" 
  and Elements."Current Patient Age In Years" <= 20
/*
@input: Client's age is more than 20 years
@pseudocode: Today's date − "Date of birth" > 20 years
@decision: Alternative single-dose schedule
*/
define "Client's age is more than 20 years":
  Elements."Current Patient Age In Years" > 20

/*
@input: Client's biological sex is female
@pseudocode: "Sex" = "Female"
@decision: 2-dose schedule
*/
define "Client's biological sex is female":
  Patient.gender = 'female'

/*
@input: Client's biological sex is not female
@pseudocode: "Sex" ≠ "Female"
@decision: 2-dose schedule
*/
define "Client's biological sex is not female":
  not "Client's biological sex is female"

/*
@input: The latest HPV dose was administered less than 6 months ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines") < 6 months
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "The latest HPV dose was administered less than 6 months ago":
  "Date of Latest HPV Dose" is not null
    and duration in months between "Date of Latest HPV Dose" and Now() < 6

/*
@input: The latest HPV dose was administered more than 6 months ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines") ≥ 6 months
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "The latest HPV dose was administered more than 6 months ago":
  not "The latest HPV dose was administered less than 6 months ago"

/*
@input: Client is immunocompromised
@pseudocode: "Immunocompromised" = TRUE
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "Client is immunocompromised":
  Elements."Client is immunocompromised"

/*
@input: Client is not immunocompromised
@pseudocode: "Immunocompromised" ≠ TRUE
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "Client is not immunocompromised":
  Elements."Client is not immunocompromised"

/*
@input: Client's HIV status is positive
@pseudocode: "HIV status" = "HIV-positive"
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "Client's HIV status is positive":
  Elements."Client's HIV status is positive"

/*
@input: Client's HIV status is negative or unknown
@pseudocode: "HIV status" ≠ "HIV-positive"
@decision: 2-dose schedule
@decision: Alternative single-dose schedule
*/
define "Client's HIV status is negative or unknown":
  Elements."Client's HIV status is negative or unknown"


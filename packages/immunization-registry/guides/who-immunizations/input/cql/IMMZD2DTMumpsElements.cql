
/*
  * Library: IMMZD2DTMumpsElements
  */
library IMMZD2DTMumpsElements

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
@internal: Mumps containing Doses Administered to Patient
*/
define "Mumps Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Mumps-containing vaccines"

/*
@internal: Mumps containing Doses Administered to Patient that are in the Primary series
*/
define "Mumps Primary Series Doses Administered to Patient":
  "Mumps Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Mumps Primary Series doses
*/
define "Number of Mumps Primary Series Doses Administered":
  Count("Mumps Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last Mumps dose
*/
define "Date of Latest Mumps Dose":
  date from start of "Mumps Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No mumps primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Mumps-containing vaccines" and "Type of dose" = "Primary series") = 0
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "No mumps primary series doses were administered":
  "Number of Mumps Primary Series Doses Administered" = 0

/*
@input: One mumps primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Mumps-containing vaccines" and "Type of dose" = "Primary series") = 1
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "One mumps primary series dose was administered":
  "Number of Mumps Primary Series Doses Administered" = 1

/*
@input: Two mumps primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Mumps-containing vaccines" and "Type of dose" = "Primary series") = 2
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "Two mumps primary series doses were administered":
  "Number of Mumps Primary Series Doses Administered" = 2

/*
@input: Client's age is less than 12 months
@pseudocode: Today's date − "Date of birth" < 12 months
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "Client's age is less than 12 months":
  Elements."Current Patient Age In Months" < 12

/*
@input: Client's age is more than or equal to 12 months
@pseudocode: Today's date − "Date of birth" ≥ 12 months
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "Client's age is more than or equal to 12 months":
  Elements."Current Patient Age In Months" >= 12

/*
@input: The latest mumps dose was administered less than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Mumps-containing vaccines") < 4 weeks
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "The latest mumps dose was administered less than 4 weeks ago":
  "Date of Latest Mumps Dose" is not null 
  and duration in weeks between "Date of Latest Mumps Dose" and Now() < 4

/*
@input: The latest mumps dose was administered more than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Mumps-containing vaccines") ≥ 4 weeks
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "The latest mumps dose was administered more than 4 weeks ago":
  not "The latest mumps dose was administered less than 4 weeks ago"

/*
@input: Live vaccine was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "Live vaccine was administered in the past 4 weeks":
  Elements."Live vaccine was administered in the last 4 weeks"

/*
@input: No live vaccine was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) ≥ 4 weeks
@decision: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
*/
define "No live vaccine was administered in the past 4 weeks":
  Elements."No live vaccine was administered in the last 4 weeks"


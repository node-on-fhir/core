
/*
  * Library: IMMZD2DTRotavirusEncounterElements
  */
library IMMZD2DTRotavirusEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTRotavirusElements called RotavirusElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Rotavirus containing Doses Administered to Patient
*/
define "Rotavirus Doses Administered to Patient":
  Encounter."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Rotavirus vaccines"

/*
@internal: Date and time of last Rotavirus dose
*/
define "Date of Latest Rotavirus Dose":
  date from start of "Rotavirus Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: Rotavirus containing Doses Administered to Patient that are in the Primary series
*/
define "Rotavirus Primary Series Doses Administered to Patient":
  "Rotavirus Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Rotavirus Primary Series doses
*/
define "Number of Rotavirus Primary Series Doses Administered":
  Count("Rotavirus Primary Series Doses Administered to Patient")

/*
@input: No rotavirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 0
*/
define "No rotavirus primary series doses were administered":
  "Number of Rotavirus Primary Series Doses Administered" = 0

/*
@input: One rotavirus primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 1
*/
define "One rotavirus primary series dose was administered":
  "Number of Rotavirus Primary Series Doses Administered" = 1

/*
@input: Two rotavirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Two rotavirus primary series doses were administered":
  "Number of Rotavirus Primary Series Doses Administered" = 2

/*
@input: Three rotavirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 3
*/
define "Three rotavirus primary series doses were administered":
  "Number of Rotavirus Primary Series Doses Administered" = 3

/*
@input: Client's age is less than 6 weeks
@pseudocode: 'Today's date – "Date of birth" < 6 weeks
*/
define "Client's age is less than 6 weeks":
  Encounter."Current Patient Age In Weeks" < 6

/*
@input: Client's age is between 6 weeks and 24 months
@pseudocode: 6 weeks ≤ Today's date – "Date of birth" < 24 months
*/
define "Client's age is between 6 weeks and 24 months":
  6 <= Encounter."Current Patient Age In Weeks" 
  and Encounter."Current Patient Age In Months" < 24

/*
@input: Client's age is more than 24 months
@pseudocode: "Date of birth" > 24 months
@note: This is >= to be consistent
*/
define "Client's age is more than 24 months":
  Encounter."Current Patient Age In Months" >= 24

/*
@input: No live vaccine was administered in the last 4 weeks
@pseudocode: Today's date - latest "Date and time of vaccination" (where "Live vaccine" = TRUE) ≥ 4 weeks
*/
define "No live vaccine was administered in the last 4 weeks":
  Encounter."No live vaccine was administered in the last 4 weeks"

/*
@input: Live vaccine was administered in the last 4 weeks
@pseudocode: Today's date - latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
*/
define "Live vaccine was administered in the last 4 weeks":
  Encounter."Live vaccine was administered in the last 4 weeks"

/*
@input: Live vaccines was administered in the last 4 weeks
@pseudocode: Today's date - latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
*/
define "Live vaccines was administered in the last 4 weeks":
  Encounter."Live vaccine was administered in the last 4 weeks"

/*
@input: No live vaccine was administered in last 4 weeks
@pseudocode: Today's date - latest "Date and time of vaccination" (where "Live vaccine" = TRUE) ≥ 4 weeks
*/
define "No live vaccine was administered in last 4 weeks":
  Encounter."No live vaccine was administered in the last 4 weeks"

/*
@input: Live vaccine was administered in last 4 weeks
@pseudocode: Today's date - latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
*/
define "Live vaccine was administered in last 4 weeks":
  Encounter."Live vaccine was administered in the last 4 weeks"

/*
internal: The brand of the first dose given
*/
define "Brand of First Dose":
  First("Rotavirus Doses Administered to Patient".getDose('1')).brand()

/*
internal: The brand of the second dose given
*/
define "Brand of Second Dose":
  First("Rotavirus Doses Administered to Patient".getDose('2')).brand()

/*
@input: The series administered to the client is a mixed series or a series with unknown vaccine products
@pseudocode: "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 1) ≠ "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 2)
*/
define "The series administered to the client is a mixed series or a series with unknown vaccine products":
  not "The series administered to the client contains the same product"

/*
@input: The series administered to the client contains the same product
@pseudocode: "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 1) = "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 2)
*/
define "The series administered to the client contains the same product":
  "Brand of First Dose" is not null and
  "Brand of First Dose" ~ "Brand of Second Dose"

/*
@input: The series contain more than two doses
@pseudocode: "Total doses in series" > 2
*/
define "The series contain more than two doses":
  ToInteger("Rotavirus Doses Administered to Patient".mostRecent().seriesDoses()) > 2

/*
@input: The series contain less than or equal to two doses
@pseudocode: "Total doses in series" ≤ 2
*/
define "The series contain less than or equal to two doses":
  ToInteger("Rotavirus Doses Administered to Patient".mostRecent().seriesDoses()) <= 2



/*
  * Library: IMMZD2DTYellowfeverEncounterElements
  */
library IMMZD2DTYellowfeverEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTYellowfeverElements called YellowfeverElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Yellow fever containing Doses Administered to Patient
*/
define "Yellow fever Doses Administered to Patient":
  Encounter."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Yellow fever vaccines"

/*
@internal: Yellow fever containing Doses Administered to Patient that are in the Primary series
*/
define "Yellow fever Primary Series Doses Administered to Patient":
  "Yellow fever Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Yellow fever Primary Series doses
*/
define "Number of Yellow fever Primary Series Doses Administered":
  Count("Yellow fever Primary Series Doses Administered to Patient")

/*
@input: No yellow fever primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Yellow fever vaccines" and "Type of dose" = "Primary series") = 0
*/
define "No yellow fever primary series doses were administered":
  "Number of Yellow fever Primary Series Doses Administered" = 0

/*
@input: One yellow fever primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Yellow fever vaccines" and "Type of dose" = "Primary series") = 1
*/
define "One yellow fever primary series dose was administered":
  "Number of Yellow fever Primary Series Doses Administered" = 1

/*
@input: Client's age is less than 9 months
@pseudocode: Today's date − "Date of birth" < 9 months
*/
define "Client's age is less than 9 months":
  Encounter."Current Patient Age In Months" < 9

/*
@input: Client's age is more than or equal to 9 months
@pseudocode: Today's date − "Date of birth" ≥ 9 months
*/
define "Client's age is more than or equal to 9 months":
  Encounter."Current Patient Age In Months" >= 9

/*
@input: Live vaccine was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
*/
define "Live vaccine was administered in the past 4 weeks":
  Encounter."Live vaccine was administered in the last 4 weeks"

/*
@input: No live vaccine was administered in the past 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) ≥ 4 weeks
*/
define "No live vaccine was administered in the past 4 weeks":
  Encounter."No live vaccine was administered in the last 4 weeks"


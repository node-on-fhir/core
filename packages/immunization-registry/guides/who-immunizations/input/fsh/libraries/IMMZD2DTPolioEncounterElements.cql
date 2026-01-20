
/*
  * Library: IMMZD2DTPolioEncounterElements
  */
library IMMZD2DTPolioEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTPolioElements called PolioElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@input: bOPV birth dose (a zero dose) was not administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Dose 0" AND "Birth dose" = TRUE) = 0
*/
define "bOPV birth dose (a zero dose) was not administered":
  Encounter."bOPV birth dose (a zero dose) was not administered"

/*
@input: bOPV birth dose (a zero dose) was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Dose 0" AND "Birth dose" = TRUE) = 1
*/
define "bOPV birth dose (a zero dose) was administered":
  Encounter."bOPV birth dose (a zero dose) was administered"

/*
@input: Client's age is less than 1 week
@pseudocode: Today's date − "Date of birth" < 1 week
*/
define "Client's age is less than 1 week":
  Encounter."Client's age is less than 1 week"

/*
@input: Client's age is more than or equal to 1 week
@pseudocode: Today's date − "Date of birth" ≥ 1 week
*/
define "Client's age is more than or equal to 1 week":
  Encounter."Client's age is more than or equal to 1 week"



/*
  * Library: IMMZD2DTRabiesEncounterElements
  */
library IMMZD2DTRabiesEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTRabiesElements called RabiesElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Rabies containing Doses Administered to Patient
*/
define "Rabies Doses Administered to Patient":
  Encounter."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Rabies vaccines"

/*
@internal: Rabies containing Doses Administered to Patient that are in the Primary series
*/
define "Rabies Primary Series Doses Administered to Patient":
  "Rabies Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Rabies Primary Series doses
*/
define "Number of Rabies Primary Series Doses Administered":
  Count("Rabies Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last Rabies dose
*/
define "Date of Latest Rabies Dose":
  date from start of "Rabies Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No rabies primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rabies vaccines" and "Type of dose" = "Primary series") = 0
@decision: Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
*/
define "No rabies primary series doses were administered":
  "Number of Rabies Primary Series Doses Administered" = 0

/*
@input: One rabies primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rabies vaccines" and "Type of dose" = "Primary series") = 1
@decision: Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
*/
define "One rabies primary series doses were administered":
  "Number of Rabies Primary Series Doses Administered" = 1

/*
@input: Two rabies primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rabies vaccines" and "Type of dose" = "Primary series") = 2
@decision: Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
*/
define "Two rabies primary series doses were administered":
  "Number of Rabies Primary Series Doses Administered" = 2

/*
@input: The latest rabies dose was administered less than 7 days ago
@pseudocode: ''Today's date - Latest "Date of vaccination" (where "Vaccine type" = "Rabies vaccines") < 7 days
@decision: Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
*/
define "The latest rabies dose was administered less than 7 days ago":
  "Date of Latest Rabies Dose" is not null
  and duration in days between "Date of Latest Rabies Dose" and Today < 7

/*
@input: The latest rabies dose was administered more than 7 days ago
@pseudocode: ''Today's date - Latest "Date of vaccination" (where "Vaccine type" = "Rabies vaccines") ≥ 7 days
@decision: Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
*/
define "The latest rabies dose was administered more than 7 days ago":
  not "The latest rabies dose was administered less than 7 days ago"


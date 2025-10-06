
/*
  * Library: IMMZD2DTHibEncounterElements
  */
library IMMZD2DTHibEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTHibElements called HibElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Hib containing Doses Administered to Patient
*/
define "Hib Doses Administered to Patient":
  Encounter."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Hib-containing vaccines"

/*
@internal: Hib containing Doses Administered to Patient that are in the Primary series
*/
define "Hib Primary Series Doses Administered to Patient":
  "Hib Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Hib Primary Series doses
*/
define "Number of Hib Primary Series Doses Administered":
  Count("Hib Primary Series Doses Administered to Patient")

/*
@internal: Hib containing Doses Administered to Patient that are in the Booster series
*/
define "Hib Booster Series Doses Administered to Patient":
  "Hib Doses Administered to Patient".seriesBooster()

/*
@internal: Number of Hib Booster Series doses
*/
define "Number of Hib Booster Series Doses Administered":
  Count("Hib Booster Series Doses Administered to Patient")

/*
@internal: Date and time of first Hib dose
*/
define "Date of First Hib Dose":
  date from start of "Hib Doses Administered to Patient".earliest().occurrence.toInterval()

/*
@internal: Date and time of last Hib dose
*/
define "Date of Latest Hib Dose":
  date from start of "Hib Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No Hib primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose" = "Primary series") = 0
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "No Hib primary series doses were administered":
  "Number of Hib Primary Series Doses Administered" = 0

/*
@input: One Hib primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 1
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
*/
define "One Hib primary series dose was administered":
  "Number of Hib Primary Series Doses Administered" = 1

/*
@input: One Hib primary series doses was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 1
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "One Hib primary series doses was administered":
  "One Hib primary series dose was administered"

/*
@input: Two Hib primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose" = "Primary series" ) = 2
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "Two Hib primary series doses were administered":
  "Number of Hib Primary Series Doses Administered" = 2

/*
@input: Three Hib primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 3
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
*/
define "Three Hib primary series doses were administered":
  "Number of Hib Primary Series Doses Administered" = 3

/*
@input: No Hib booster doses were administered
@pseudocode: Count of vaccines administered where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"" = "Booster dose") = 0
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "No Hib booster doses were administered":
  "Number of Hib Booster Series Doses Administered" = 0

/*
@input: One Hib booster dose was administered
@pseudocode: Count of vaccines administered where "Vaccine type" = "Hib-containing vaccines" and "Type of dose" = "Booster dose") = 1
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "One Hib booster dose was administered":
  "Number of Hib Booster Series Doses Administered" = 1

/*
@input: Client's age is less than 6 weeks
@pseudocode: Today's date − "Date of birth" < 6 weeks
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "Client's age is less than 6 weeks":
  Encounter."Current Patient Age In Weeks" < 6

/*
@input: Client's age is between 6 weeks and 5 years
@pseudocode: 6 weeks ≤ Today's date − "Date of birth" ≤ 5 years
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "Client's age is between 6 weeks and 5 years":
  6 <= Encounter."Current Patient Age In Weeks" 
  and Encounter."Current Patient Age In Years" <= 5

/*
@input: Client's age is at least 6 weeks and not more than 5 years
@pseudocode: 6 weeks ≤ Today's date − "Date of birth" ≤ 5 years
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "Client's age is at least 6 weeks and not more than 5 years":
  "Client's age is between 6 weeks and 5 years"

/*
@input: Client's age is between 6 weeks and not more than 5 years
@pseudocode: 6 weeks ≤ Today's date − "Date of birth" ≤ 5 years
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
*/
define "Client's age is between 6 weeks and not more than 5 years":
  "Client's age is between 6 weeks and 5 years"

/*
@input: Client's age is more than 5 years
@pseudocode: Today's date − "Date of birth" > 5 years
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "Client's age is more than 5 years":
  Encounter."Current Patient Age In Years" > 5

/*
@input: Client's age was less than 1 year when first Hib dose was administered
@pseudocode: "Date and time of vaccination" (where "Vaccine type"= "Hib-containing vaccines" and "Dose number" = 1) − "Date of birth" < 1 year
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "Client's age was less than 1 year when first Hib dose was administered":
  AgeInYearsAt("Date of First Hib Dose") < 1

/*
@input: Client's age was more than 1 year when first Hib dose was administered
@pseudocode: "Date and time of vaccination" (where "Vaccine type"= "Hib-containing vaccines" and "Dose number" = 1) − "Date of birth" ≥ 1 year
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "Client's age was more than 1 year when first Hib dose was administered":
  AgeInYearsAt("Date of First Hib Dose") >= 1

/*
@input: The latest Hib dose was administered less than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") < 4 weeks
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
*/
define "The latest Hib dose was administered less than 4 weeks ago":
  "Date of Latest Hib Dose" is not null
    and duration in weeks between "Date of Latest Hib Dose" and Today < 4

/*
@input: The latest Hib dose was administered more than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") ≥ 4 weeks
@decision: 3 primary doses without a booster dose (3p)
@decision: 3 primary doses with a booster dose (3p+1)
*/
define "The latest Hib dose was administered more than 4 weeks ago":
  not("The latest Hib dose was administered less than 4 weeks ago")

/*
@input: The latest Hib dose was administered less than 8 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") < 8 weeks
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "The latest Hib dose was administered less than 8 weeks ago":
  "Date of Latest Hib Dose" is not null
    and duration in weeks between "Date of Latest Hib Dose" and Today < 8

/*
@input: The latest Hib dose was administered more than 8 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") ≥ 8 weeks
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "The latest Hib dose was administered more than 8 weeks ago":
  not("The latest Hib dose was administered less than 8 weeks ago")

/*
@input: The latest Hib dose was administered less than 6 months ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") < 6 months
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "The latest Hib dose was administered less than 6 months ago":
  "Date of Latest Hib Dose" is not null
    and duration in months between "Date of Latest Hib Dose" and Today < 6

/*
@input: The latest Hib dose was administered more than 6 months ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") ≥ 6 months
@decision: 3 primary doses with a booster dose (3p+1)
@decision: 2 primary doses with a booster dose (2p+1)
*/
define "The latest Hib dose was administered more than 6 months ago":
  not("The latest Hib dose was administered less than 6 months ago")


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
@internal: Polio containing Doses Administered to Patient
*/
define "Polio Doses Administered to Patient":
  PolioElements."Polio Doses Administered to Patient".onOrBefore(Today)

/*
@internal: bOPV Doses Administered to Patient
*/
define "bOPV Doses Administered to Patient":
  "Polio Doses Administered to Patient" I
  where I.typeOfDose() ~ Concepts."bOPV"

/*
@internal: IPV Doses Administered to Patient
*/
define "IPV Doses Administered to Patient":
  "Polio Doses Administered to Patient" I
  where I.typeOfDose() ~ Concepts."IPV"

/*
@internal: Date and time of last Polio dose
*/
define "Date of Latest Polio Dose":
  date from start of "Polio Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: Date and time of last bOPV dose
*/
define "Date of Latest bOPV Dose":
  date from start of "bOPV Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: Date and time of last IPV dose
*/
define "Date of Latest IPV Dose":
  date from start of "IPV Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: Polio containing Doses Administered to Patient that are in the Dose 0 (Birth) series
*/
define "Polio Dose 0 Doses Administered to Patient":
  PolioElements."Polio Dose 0 Doses Administered to Patient".onOrBefore(Today)

/*
@internal: Number of Polio Dose 0 doses
*/
define "Number of Polio Dose 0 Doses Administered":
  Count("Polio Dose 0 Doses Administered to Patient")

/*
@input: bOPV birth dose (a zero dose) was not administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Dose 0" AND "Birth dose" = TRUE) = 0
*/
define "bOPV birth dose (a zero dose) was not administered":
  "Number of Polio Dose 0 Doses Administered" = 0

/*
@input: bOPV birth dose (a zero dose) was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Dose 0" AND "Birth dose" = TRUE) = 1
*/
define "bOPV birth dose (a zero dose) was administered":
  "Number of Polio Dose 0 Doses Administered" = 1

/*
@internal: Polio containing Doses Administered to Patient that are in the Primary series
*/
define "Polio Primary Series Doses Administered to Patient":
  PolioElements."Polio Primary Series Doses Administered to Patient".onOrBefore(Today)

/*
@internal: Date and time of first Primary Series Polio dose
*/
define "Date of First Primary Series Polio Dose":
  date from start of "Polio Primary Series Doses Administered to Patient".earliest().occurrence.toInterval()

/*
@internal: Number of Polio Primary Series doses
*/
define "Number of Polio Primary Series Doses Administered":
  Count("Polio Primary Series Doses Administered to Patient")

/*
@input: No poliovirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Primary series") = 0
*/
define "No poliovirus primary series doses were administered":
  "Number of Polio Primary Series Doses Administered" = 0

/*
@input: One poliovirus primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Primary series") = 1
*/
define "One poliovirus primary series dose was administered":
  "Number of Polio Primary Series Doses Administered" = 1

/*
@input: Two poliovirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Two poliovirus primary series doses were administered":
  "Number of Polio Primary Series Doses Administered" = 2

/*
@input: Three poliovirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Primary series") = 3
*/
define "Three poliovirus primary series doses were administered":
  "Number of Polio Primary Series Doses Administered" = 3

/*
@input: Four poliovirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Primary series") = 4
*/
define "Four poliovirus primary series doses were administered":
  "Number of Polio Primary Series Doses Administered" = 4

/*
@input: Five poliovirus primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Primary series") = 5
*/
define "Five poliovirus primary series doses were administered":
  "Number of Polio Primary Series Doses Administered" = 5

/*
@internal: Polio bOPV  Doses Administered to Patient that are in the Primary series
*/
define "Polio bOPV Primary Series Doses Administered to Patient":
  "Polio Primary Series Doses Administered to Patient" I
  where I.typeOfDose() ~ Concepts."bOPV" 

/*
@internal: Polio IPV Doses Administered to Patient that are in the Primary series
*/
define "Polio IPV Primary Series Doses Administered to Patient":
  "Polio Primary Series Doses Administered to Patient" I
  where I.typeOfDose() ~ Concepts."IPV" 

/*
@internal: Number of Polio bOPV Primary Series doses
*/
define "Number of Polio bOPV Primary Series Doses Administered":
  Count("Polio bOPV Primary Series Doses Administered to Patient")

/*
@internal: Number of IPV Polio Primary Series doses
*/
define "Number of Polio IPV Primary Series Doses Administered":
  Count("Polio IPV Primary Series Doses Administered to Patient")

/*
@input: The poliovirus dose administered is bOPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 1
*/
define "The poliovirus dose administered is bOPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 1

/*
@input: The poliovirus dose administered is IPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 0
*/
define "The poliovirus dose administered is IPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 0

/*
@input: The two doses administered are bOPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 2
*/
define "The two doses administered are bOPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 2

/*
@input: From the two doses administered one is bOPV and one is IPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 1
*/
define "From the two doses administered one is bOPV and one is IPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 1

/*
@input: The two doses administered are IPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 0
*/
define "The two doses administered are IPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 0

/*
@input: The three doses administered are bOPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 3
*/
define "The three doses administered are bOPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 3

/*
@input: From the three doses administered, one is IPV and two are bOPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 2
*/
define "From the three doses administered, one is IPV and two are bOPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 2

/*
@input: From the three doses administered, one is bOPV and two are IPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 1
*/
define "From the three doses administered, one is bOPV and two are IPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 1

/*
@input: From the four doses administered, one is IPV and three are bOPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 3
*/
define "From the four doses administered, one is IPV and three are bOPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 3

/*
@input: From the four doses administered, two are IPV and two are bOPV
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV" and "Type of dose" = "Primary series") = 2
*/
define "From the four doses administered, two are IPV and two are bOPV":
  "Number of Polio bOPV Primary Series Doses Administered" = 2

/*
@internal: Polio containing Doses Administered to Patient that are in the Booster series
*/
define "Polio Booster Series Doses Administered to Patient":
  PolioElements."Polio Booster Series Doses Administered to Patient".onOrBefore(Today)
/*
@internal: Number of Polio Booster Series doses
*/
define "Number of Polio Booster Series Doses Administered":
  Count("Polio Booster Series Doses Administered to Patient")

/*
@input: No polio booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Booster dose") = 0
*/
define "No polio booster dose was administered":
  "Number of Polio Booster Series Doses Administered" = 0

/*
@input: Polio booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Booster dose") = 1
*/
define "Polio booster dose was administered":
  "Number of Polio Booster Series Doses Administered" = 1
  
/*
@input: Client's age is less than 1 week
@pseudocode: Today's date − "Date of birth" < 1 week
*/
define "Client's age is less than 1 week":
  Encounter."Current Patient Age In Weeks" < 1

/*
@input: Client's age is more than or equal to 1 week
@pseudocode: Today's date − "Date of birth" ≥ 1 week
*/
define "Client's age is more than or equal to 1 week":
  Encounter."Current Patient Age In Weeks" >= 1

/*
@input: Client's age is less than 6 weeks
@pseudocode: Today's date − "Date of birth" < 6 weeks
*/
define "Client's age is less than 6 weeks":
  Encounter."Current Patient Age In Weeks" < 6

/*
@input: Client's age is between 6 weeks and 3 months
@pseudocode: 6 weeks ≤ Today's date − "Date of birth" ≤ 3 months
*/
define "Client's age is between 6 weeks and 3 months":
  6 <= Encounter."Current Patient Age In Weeks" 
  and Encounter."Current Patient Age In Months" <= 3

/*
@input: Client's age is more than 3 months
@pseudocode: Today's date − "Date of birth" > 3 months
*/
define "Client's age is more than 3 months":
  Encounter."Current Patient Age In Months" > 3

/*
@input: Client's age is between 6 weeks and 14 weeks
@pseudocode: 6 weeks ≤ Today's date − "Date of birth" < 14 weeks
*/
define "Client's age is between 6 weeks and 14 weeks":
  6 <= Encounter."Current Patient Age In Weeks" 
  and Encounter."Current Patient Age In Weeks" < 14

/*
@input: Client's age is more than or equal to 14 weeks
@pseudocode: Today's date − "Date of birth" ≥ 14 weeks
*/
define "Client's age is more than or equal to 14 weeks":
  Encounter."Current Patient Age In Weeks" >= 14

/*
@input: Client's age is less than 14 weeks
@pseudocode: Today's date − "Date of birth" < 14 weeks
*/
define "Client's age is less than 14 weeks":
  Encounter."Current Patient Age In Weeks" < 14

/*
@input: Client's age is less than 8 weeks
@pseudocode: Today's date − "Date of birth" < 8 weeks
*/
define "Client's age is less than 8 weeks":
  Encounter."Current Patient Age In Weeks" < 8

/*
@input: Client's age is more than or equal to 8 weeks
@pseudocode: Today's date − "Date of birth" ≥ 8 weeks
*/
define "Client's age is more than or equal to 8 weeks":
  Encounter."Current Patient Age In Weeks" >= 8

/*
@input: Client's age is more than or equal to 6 weeks
@pseudocode: Today's date − "Date of birth" ≥ 6 weeks
*/
define "Client's age is more than or equal to 6 weeks":
  Encounter."Current Patient Age In Weeks" >= 6

/*
@input: The latest bOPV dose was administered less than 4 weeks ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of poliovirus dose" = "bOPV") < 4 weeks
*/
define "The latest bOPV dose was administered less than 4 weeks ago":
  "Date of Latest bOPV Dose" is not null
    and duration in weeks between "Date of Latest bOPV Dose" and Today < 4

/*
@input: The latest bOPV dose was administered more than 4 weeks ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of poliovirus dose" = "bOPV") ≥ 4 weeks
*/
define "The latest bOPV dose was administered more than 4 weeks ago":
  not("The latest bOPV dose was administered less than 4 weeks ago")

/*
@input: The latest IPV dose was administered less than 4 months ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of poliovirus dose" = "IPV") < 4 months
*/
define "The latest IPV dose was administered less than 4 months ago":
  "Date of Latest IPV Dose" is not null
    and duration in months between "Date of Latest IPV Dose" and Today < 4
/*
@input: The latest IPV dose was administered more than 4 months ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of poliovirus dose" = "IPV") ≥ 4 months
*/
define "The latest IPV dose was administered more than 4 months ago":
  not("The latest IPV dose was administered less than 4 months ago")

/*
@input: The latest poliovirus dose was administered less than 4 weeks ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines") < 4 weeks
*/
define "The latest poliovirus dose was administered less than 4 weeks ago":
  "Date of Latest Polio Dose" is not null
    and duration in weeks between "Date of Latest Polio Dose" and Today < 4
    
/*
@input: The latest poliovirus dose was administered more than 4 weeks ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines") ≥ 4 weeks
*/
define "The latest poliovirus dose was administered more than 4 weeks ago":
  not("The latest poliovirus dose was administered less than 4 weeks ago")

/*
@input: Client's age was more than 6 weeks when the primary series was started
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" AND "Dose number" = 1) − "Date of birth" > 6 weeks
@note: Dose number doesn't seem correct for this in case birth dose was given so using the series to determine primary series.
*/
define "Client's age was more than 6 weeks when the primary series was started":
  AgeInWeeksAt("Date of First Primary Series Polio Dose") > 6

/*
@input: Client's age was 6 weeks when the primary series was started
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" AND "Dose number" = 1) − "Date of birth" = 6 weeks
*/
define "Client's age was 6 weeks when the primary series was started":
  AgeInWeeksAt("Date of First Primary Series Polio Dose") = 6

/*
@input: The latest poliovirus dose was administered less than 6 months ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines") < 6 months
*/
define "The latest poliovirus dose was administered less than 6 months ago":
  "Date of Latest Polio Dose" is not null
    and duration in months between "Date of Latest Polio Dose" and Today < 6
/*
@input: The latest poliovirus dose was administered more than 6 months ago
@pseudocode: Today's date − Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines") ≥ 6 months
*/
define "The latest poliovirus dose was administered more than 6 months ago":
  not("The latest poliovirus dose was administered less than 6 months ago")



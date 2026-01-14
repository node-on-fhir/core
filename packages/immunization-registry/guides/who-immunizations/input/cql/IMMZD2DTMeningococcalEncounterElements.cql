
/*
  * Library: IMMZD2DTMeningococcalEncounterElements
  */
library IMMZD2DTMeningococcalEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD2DTMeningococcalElements called MeningococcalElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Meningococcal containing Doses Administered to Patient
*/
define "Meningococcal Doses Administered to Patient":
  Encounter."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Meningococcal vaccines"

/*
@internal: Date and time of last Meningococcal dose
*/
define "Date of Latest Meningococcal Dose":
  date from start of "Meningococcal Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: Meningococcal containing Doses Administered to Patient that are in the Primary series
*/
define "Meningococcal Primary Series Doses Administered to Patient":
  "Meningococcal Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Meningococcal Primary Series doses
*/
define "Number of Meningococcal Primary Series Doses Administered":
  Count("Meningococcal Primary Series Doses Administered to Patient")

/*
@internal: Date of First Primary Series Meningococcal Dose
*/
define "Date of First Primary Series Meningococcal Dose":
  date from start of "Meningococcal Primary Series Doses Administered to Patient".earliest().occurrence.toInterval()

/*
@internal: Meningococcal containing Doses Administered to Patient that are in the Booster series
*/
define "Meningococcal Booster Series Doses Administered to Patient":
  "Meningococcal Doses Administered to Patient".seriesBooster()

/*
@internal: Number of Meningococcal Booster Series doses
*/
define "Number of Meningococcal Booster Series Doses Administered":
  Count("Meningococcal Booster Series Doses Administered to Patient")

/*
@input: No meningococcal primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Primary series") = 0
@decision: MenA conjugate vaccine, 1-dose schedule
@decision: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
@decision: Monovalent MenC conjugate vaccine schedule
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-CRM), 1-dose schedule
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
@decision: Polysaccharide vaccines schedule
*/
define "No meningococcal primary series dose was administered":
  "Number of Meningococcal Primary Series Doses Administered" = 0

/*
@input: One meningococcal primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Primary series") = 1
@decision: MenA conjugate vaccine, 1-dose schedule
@decision: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
@decision: Monovalent MenC conjugate vaccine schedule
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-CRM), 1-dose schedule
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
@decision: Polysaccharide vaccines schedule
*/
define "One meningococcal primary series dose was administered":
  "Number of Meningococcal Primary Series Doses Administered" = 1

/*
@input: Two meningococcal primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Primary series") = 2
@decision: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
@decision: Monovalent MenC conjugate vaccine schedule
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
*/
define "Two meningococcal primary series doses were administered":
  "Number of Meningococcal Primary Series Doses Administered" = 2

/*
@input: Client's age is less than 2 months
@pseudocode: Today's date − "Date of birth" < 2 months
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "Client's age is less than 2 months":
  Encounter."Current Patient Age In Months" < 2

/*
@input: Client's age is more than or equal to 2 months
@pseudocode: Today's date − "Date of birth" ≥ 2 months
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "Client's age is more than or equal to 2 months":
  Encounter."Current Patient Age In Months" >= 2

/*
@input: Client's age is less than 3 months
@pseudocode: Today's date − "Date of birth" < 3 months
@decision: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
*/
define "Client's age is less than 3 months":
  Encounter."Current Patient Age In Months" < 3

/*
@input: Client's age is more than or equal to 3 months
@pseudocode: Today's date − "Date of birth" ≥ 3 months
@decision: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
*/
define "Client's age is more than or equal to 3 months":
  Encounter."Current Patient Age In Months" >= 3

/*
@input: Client's age is less than 9 months
@pseudocode: Today's date − "Date of birth" < 9 months
@decision: MenA conjugate vaccine, 1-dose schedule
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
*/
define "Client's age is less than 9 months":
  Encounter."Current Patient Age In Months" < 9

/*
@input: Client's age is more than 9 months
@pseudocode: Today's date − "Date of birth" ≥ 9 months
@decision: MenA conjugate vaccine, 1-dose schedule
*/
define "Client's age is more than 9 months":
  Encounter."Current Patient Age In Months" >= 9

/*
@input: Client's age is more than or equal to 9 months
@pseudocode: Today's date − "Date of birth" ≥ 9 months
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
*/
define "Client's age is more than or equal to 9 months":
  "Client's age is more than 9 months"
  
/*
@input: Client's age is less than 2 years
@pseudocode: Today's date − "Date of birth" < 2 years
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-CRM), 1-dose schedule
@decision: Polysaccharide vaccines schedule
*/
define "Client's age is less than 2 years":
  Encounter."Current Patient Age In Years" < 2

/*
@input: Client's age is more than or equal to 2 years
@pseudocode: Today's date − "Date of birth" ≥ 2 years
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-CRM), 1-dose schedule
*/
define "Client's age is more than or equal to 2 years":
  Encounter."Current Patient Age In Years" >= 2

/*
@input: Client's age is more than 2 years
@pseudocode: Today's date − "Date of birth" ≥ 2 years
@decision: Polysaccharide vaccines schedule
(Polysaccharide vaccines can be used to control outbreaks in countries where limited economic resources or insufficient supply restrict the use of meningococcal conjugate vaccine
s)
*/
define "Client's age is more than 2 years":
  "Client's age is more than or equal to 2 years"

/*
@input: Client's age was less than or equal to 11 months when the primary series was started
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") - "Date of birth" ≤ 11 months
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "Client's age was less than or equal to 11 months when the primary series was started":
  AgeInMonthsAt("Date of First Primary Series Meningococcal Dose") <= 11

/*
@input: Client's age was more than 11 months when the primary series was started
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") - "Date of birth" > 11 months
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "Client's age was more than 11 months when the primary series was started":
  AgeInMonthsAt("Date of First Primary Series Meningococcal Dose") > 11

/*
@input: Client's age was less than or equal to 23 months when the primary series was started
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") - "Date of birth" ≤ 23 months
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
*/
define "Client's age was less than or equal to 23 months when the primary series was started":
  AgeInMonthsAt("Date of First Primary Series Meningococcal Dose") <= 23

/*
@input: Client's age was more than 23 months when the primary series was started
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") - "Date of birth" > 23 months
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
*/
define "Client's age was more than 23 months when the primary series was started":
  AgeInMonthsAt("Date of First Primary Series Meningococcal Dose") > 23

/*
@input: The latest meningococcal dose was administered less than 8 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") < 8 weeks
@decision: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
*/
define "The latest meningococcal dose was administered less than 8 weeks ago":
  "Date of Latest Meningococcal Dose" is not null
  and duration in weeks between "Date of Latest Meningococcal Dose" and Today < 8

/*
@input: The latest meningococcal dose was administered more than 8 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") ≥ 8 weeks
@decision: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
*/
define "The latest meningococcal dose was administered more than 8 weeks ago":
  not "The latest meningococcal dose was administered less than 8 weeks ago"

/*
@input: The latest meningococcal dose was administered less than 2 months ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") < 2 months
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "The latest meningococcal dose was administered less than 2 months ago":
  "Date of Latest Meningococcal Dose" is not null
  and duration in months between "Date of Latest Meningococcal Dose" and Today < 2

/*
@input: The latest meningococcal dose was administered more than 2 months ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") ≥ 2 months
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "The latest meningococcal dose was administered more than 2 months ago":
  not "The latest meningococcal dose was administered less than 2 months ago"

/*
@input: The latest meningococcal dose was administered less than 3 months ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") < 3 months
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
*/
define "The latest meningococcal dose was administered less than 3 months ago":
  "Date of Latest Meningococcal Dose" is not null
  and duration in months between "Date of Latest Meningococcal Dose" and Today < 3
/*
@input: The latest meningococcal dose was administered more than 3 months ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") ≥ 3 months
@decision: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
*/
define "The latest meningococcal dose was administered more than 3 months ago":
  not "The latest meningococcal dose was administered less than 3 months ago"

/*
@input: The latest meningococcal dose was administered less than 1 year ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") < 1 year
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "The latest meningococcal dose was administered less than 1 year ago":
  "Date of Latest Meningococcal Dose" is not null
  and duration in years between "Date of Latest Meningococcal Dose" and Today < 1

/*
@input: The latest meningococcal dose was administered more than 1 year ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") ≥ 1 year
@decision: Monovalent MenC conjugate vaccine schedule
*/
define "The latest meningococcal dose was administered more than 1 year ago":
  not "The latest meningococcal dose was administered less than 1 year ago"

/*
@input: The latest meningococcal dose was administered less than 3 years ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") < 3 years
@decision: Polysaccharide vaccines schedule
(Polysaccharide vaccines can be used to control outbreaks in countries where limited economic resources or insufficient supply restrict the use of meningococcal conjugate vaccine
s)
*/
define "The latest meningococcal dose was administered less than 3 years ago":
  "Date of Latest Meningococcal Dose" is not null
  and duration in years between "Date of Latest Meningococcal Dose" and Today < 3
  
/*
@input: The latest meningococcal dose was administered more than 3 years ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") ≥ 3 years
@decision: Polysaccharide vaccines schedule
(Polysaccharide vaccines can be used to control outbreaks in countries where limited economic resources or insufficient supply restrict the use of meningococcal conjugate vaccine
s)
*/
define "The latest meningococcal dose was administered more than 3 years ago":
  not "The latest meningococcal dose was administered less than 3 years ago"

/*
@input: No meningococcal booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Booster dose") = 0
@decision: Monovalent MenC conjugate vaccine schedule
@decision: Polysaccharide vaccines schedule
*/
define "No meningococcal booster dose was administered":
  "Number of Meningococcal Booster Series Doses Administered" = 0

/*
@input: Meningococcal booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Booster dose") = 1
@decision: Monovalent MenC conjugate vaccine schedule
@decision: Polysaccharide vaccines schedule
*/
define "Meningococcal booster dose was administered":
  "Number of Meningococcal Booster Series Doses Administered" = 1


/*
  * Library: IMMZD2DTDTPElements
  */
library IMMZD2DTDTPElements

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
@internal: DTP containing Doses Administered to Patient
*/
define "DTP Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."DTP-containing vaccines"

/*
@internal: Td containing Doses Administered to Patient
*/
define "Td Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Tetanus and diphtheria-containing vaccines"

/*
@internal: Pertussis containing Doses Administered to Patient
*/
define "Pertussis Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Pertussis-containing vaccines"

/*
@internal: Date and time of last DTP dose
*/
define "Date of Latest DTP Dose":
  date from start of "DTP Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: Date and time of last Td dose
*/
define "Date of Latest Td Dose":
  date from start of "Td Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: DTP containing Doses Administered to Patient that are in the Primary series
*/
define "DTP Primary Series Doses Administered to Patient":
  "DTP Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of DTP Primary Series doses
*/
define "Number of DTP Primary Series Doses Administered":
  Count("DTP Primary Series Doses Administered to Patient")

/*
@input: No DTP primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 0
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
@decision: Determine whether DTP-containing vaccines are needed for pregnant women
*/
define "No DTP primary series doses were administered":
  "Number of DTP Primary Series Doses Administered" = 0

/*
@input: One DTP primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 1
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "One DTP primary series dose was administered":
  "Number of DTP Primary Series Doses Administered" = 1

/*
@input: Two DTP primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 2
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "Two DTP primary series doses were administered":
  "Number of DTP Primary Series Doses Administered" = 2

/*
@input: Three DTP primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 3
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
@decision: Determine whether DTP-containing vaccines are needed for pregnant women
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
*/
define "Three DTP primary series doses were administered":
  "Number of DTP Primary Series Doses Administered" = 3

/*
@internal: Td containing Doses Administered to Patient that are in the Booster series
*/
define "Td Booster Series Doses Administered to Patient":
  "Td Doses Administered to Patient".seriesBooster()

/*
@internal: Number of Td Booster Series doses
*/
define "Number of Td Booster Series Doses Administered":
  Count("Td Booster Series Doses Administered to Patient")

/*
@input: No tetanus and diphtheria booster doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 0
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
*/
define "No tetanus and diphtheria booster doses were administered":
  "Number of Td Booster Series Doses Administered" = 0

/*
@input: No tetanus and diphtheria booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 0
@decision: Determine whether DTP-containing vaccines are needed for pregnant women
*/
define "No tetanus and diphtheria booster dose was administered":
  "No tetanus and diphtheria booster doses were administered"

/*
@input: One tetanus and diphtheria booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
@decision: Determine whether DTP-containing vaccines are needed for pregnant women
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
*/
define "One tetanus and diphtheria booster dose was administered":
  "Number of Td Booster Series Doses Administered" = 1

/*
@input: One tetanus and diphtheria booster doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
*/
define "One tetanus and diphtheria booster doses were administered":
  "One tetanus and diphtheria booster dose was administered"


/*
@input: Two tetanus and diphtheria booster doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
@decision: Determine whether DTP-containing vaccines are needed for pregnant women
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
*/
define "Two tetanus and diphtheria booster doses were administered":
  "Number of Td Booster Series Doses Administered" = 2

/*
@input: Three tetanus and diphtheria booster doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 3
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: Determine whether DTP-containing vaccines are needed for pregnant women
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
*/
define "Three tetanus and diphtheria booster doses were administered":
  "Number of Td Booster Series Doses Administered" = 3

/*
@internal: Pertussis containing Doses Administered to Patient that are in the Booster series
*/
define "Pertussis Booster Series Doses Administered to Patient":
  "Pertussis Doses Administered to Patient".seriesBooster()

/*
@internal: Number of Pertussis Booster Series doses
*/
define "Number of Pertussis Booster Series Doses Administered":
  Count("Pertussis Booster Series Doses Administered to Patient")

/*
@input: No pertussis booster doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pertussis-containing vaccines" and "Type of dose" = "Booster dose") = 0
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "No pertussis booster doses were administered":
  "Number of Pertussis Booster Series Doses Administered" = 0

/*
@input: One pertussis booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pertussis-containing vaccines" and "Type of dose" = "Booster dose") = 1
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "One pertussis booster dose was administered":
  "Number of Pertussis Booster Series Doses Administered" = 1

/*
@input: Client's age is less than 6 weeks
@pseudocode: Today's date − "Date of birth" < 6 weeks
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is less than 6 weeks":
  Elements."Current Patient Age In Weeks" < 6

/*
@input: Client's age is between 6 weeks and 1 year
@pseudocode: 6 weeks ≤ Today's date − "Date of birth" < 1 year
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is between 6 weeks and 1 year":
  6 <= Elements."Current Patient Age In Weeks"
  and Elements."Current Patient Age In Years" < 1

/*
@input: Client's age is less than 12 months
@pseudocode: Today's date − "Date of birth" < 12 months
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is less than 12 months":
  Elements."Current Patient Age In Months" < 12

/*
@input: Client's age is more than or equal to 12 months
@pseudocode: Today's date − "Date of birth" ≥ 12 months
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is more than or equal to 12 months":
  Elements."Current Patient Age In Months" >= 12

/*
@input: Client's age is less than 4 years
@pseudocode: Today's date − "Date of birth" < 4 years
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is less than 4 years":
  Elements."Current Patient Age In Years" < 4

/*
@input: Client's age is more than or equal to 4 years
@pseudocode: Today's date − "Date of birth" ≥ 4 years
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is more than or equal to 4 years":
  Elements."Current Patient Age In Years" >= 4

/*
@input: Client's age is less than 9 years
@pseudocode: Today's date − "Date of birth" < 9 years
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is less than 9 years":
  Elements."Current Patient Age In Years" < 9

/*
@input: Client's age is more than or equal to 9 years
@pseudocode: Today's date − "Date of birth" ≥ 9 years
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is more than or equal to 9 years":
  Elements."Current Patient Age In Years" >= 9

/*
@input: Client's age is less than 1 year
@pseudocode: Today's date − "Date of birth" < 1 year
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
*/
define "Client's age is less than 1 year":
  Elements."Current Patient Age In Years" < 1

/*
@input: Client's age is more than 1 year
@pseudocode: Today's date − "Date of birth" >= 1 year
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "Client's age is more than 1 year":
  Elements."Current Patient Age In Years" >= 1

/*
@input: Client's age is between 1 year and 6 years
@pseudocode: 1 year ≤  Today's date − "Date of birth" ≤  6 years
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "Client's age is between 1 year and 6 years":
  1 <= Elements."Current Patient Age In Years" 
  and Elements."Current Patient Age In Years" <= 6

/*
@input: Client's age is more than 6 years
@pseudocode: Today's date − "Date of birth" >  6 years
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "Client's age is more than 6 years":
  Elements."Current Patient Age In Years" > 6

/*
@input: The latest DTP dose was administered less than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") < 4 weeks
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "The latest DTP dose was administered less than 4 weeks ago":
  "Date of Latest DTP Dose" is not null
    and duration in weeks between "Date of Latest DTP Dose" and Now() < 4
/*
@input: The latest DTP dose was administered more than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") ≥ 4 weeks
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "The latest DTP dose was administered more than 4 weeks ago":
  not("The latest DTP dose was administered less than 4 weeks ago")

/*
@input: The latest DTP dose was administered less than 6 months ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") < 6 months
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "The latest DTP dose was administered less than 6 months ago":
  "Date of Latest DTP Dose" is not null
    and duration in months between "Date of Latest DTP Dose" and Now() < 6
    
/*
@input: The latest DTP dose was administered more than 6 months ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") ≥ 6 months
@decision: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "The latest DTP dose was administered more than 6 months ago":
  not("The latest DTP dose was administered less than 6 months ago")

/*
@input: The latest DTP dose was administered less than 1 year ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") < 1 year
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "The latest DTP dose was administered less than 1 year ago":
  "Date of Latest DTP Dose" is not null
    and duration in years between "Date of Latest DTP Dose" and Now() < 1

/*
@input: The latest DTP dose was administered more than 1 year ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") ≥ 1 year
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
*/
define "The latest DTP dose was administered more than 1 year ago":
  not("The latest DTP dose was administered less than 1 year ago")

/*
@input: The latest tetanus and diphtheria dose was administered less than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing
 vaccines") < 4 weeks
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
*/
define "The latest tetanus and diphtheria dose was administered less than 4 weeks ago":
  "Date of Latest Td Dose" is not null
    and duration in weeks between "Date of Latest Td Dose" and Now() < 4

/*
@input: The latest tetanus and diphtheria dose was administered more than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing
 vaccines") > 4 weeks
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
*/
define "The latest tetanus and diphtheria dose was administered more than 4 weeks ago":
  not("The latest tetanus and diphtheria dose was administered less than 4 weeks ago")

/*
@input: The latest tetanus and diphtheria dose was administered less than 1 year ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines") < 1 year
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
*/
define "The latest tetanus and diphtheria dose was administered less than 1 year ago":
  "Date of Latest Td Dose" is not null
    and duration in years between "Date of Latest Td Dose" and Now() < 1

/*
@input: The latest tetanus and diphtheria dose was administered more than 1 year ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines") ≥ 1 year
@decision: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
*/
define "The latest tetanus and diphtheria dose was administered more than 1 year ago":
  not("The latest tetanus and diphtheria dose was administered less than 1 year ago")

/*
@input: Client is currently pregnant
@pseudocode: "Currently pregnant" = TRUE
@decision: Determine whether DTP-containing vaccines are needed for pregnant women
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
@decision: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
*/
define "Client is currently pregnant":
  Elements."The client is pregnant"
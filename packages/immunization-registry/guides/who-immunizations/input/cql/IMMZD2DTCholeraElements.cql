
/*
  * Library: IMMZD2DTCholeraElements
  */
library IMMZD2DTCholeraElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZElements called Elements

parameter CholeraLowerLimitDays Integer default 150
parameter CholeraExactIntervalDays Integer default 0

context Patient

/*
@internal: Cholera containing Doses Administered to Patient
*/
define "Cholera Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Cholera vaccines"

/*
@internal: Cholera containing Doses Administered to Patient that are in the Primary series
*/
define "Cholera Primary Series Doses Administered to Patient":
  "Cholera Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Cholera Primary Series doses
*/
define "Number of Cholera Primary Series Doses Administered":
  Count("Cholera Primary Series Doses Administered to Patient")

/*
@internal: Cholera containing Doses Administered to Patient that are in the Booster series
*/
define "Cholera Booster Series Doses Administered to Patient":
  "Cholera Doses Administered to Patient".seriesBooster()

/*
@internal: Number of Cholera Booster Series doses
*/
define "Number of Cholera Booster Series Doses Administered":
  Count("Cholera Booster Series Doses Administered to Patient")

/*
@internal: Date and time of last Cholera dose
*/
define "Date of Latest Cholera Dose":
  date from start of "Cholera Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: Client's age is less than 1 year
@pseudocode: Today's date − "Date of birth" < 1 year
@decision: Whole-cell (WC) vaccines schedule
*/
define "Client's age is less than 1 year":
  Elements."Current Patient Age In Years" < 1

/*
@input: Client's age is more than or equal to 1 year
@pseudocode: Today's date − "Date of birth" ≥ 1 year
@decision: Whole-cell (WC) vaccines schedule
*/
define "Client's age is more than or equal to 1 year":
  Elements."Current Patient Age In Years" >= 1

/*
@input: Client's age is less than 2 years
@pseudocode: Today's date − "Date of birth" < 2 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "Client's age is less than 2 years":
  Elements."Current Patient Age In Years" < 2

/*
@input: Client's age is 2–5 years
@pseudocode: 2 years ≤ Today's date − "Date of birth" ≤ 5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "Client's age is 2–5 years":
  Elements."Current Patient Age In Years" >= 2
  and Elements."Current Patient Age In Years" <= 5

/*
@input: Client's age is more than 5 years
@pseudocode: Today's date − "Date of birth" > 5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "Client's age is more than 5 years":
  Elements."Current Patient Age In Years" > 5

/*
@input: No cholera primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 0
@decision: Whole-cell (WC) vaccines schedule
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "No cholera primary series dose was administered":
  "Number of Cholera Primary Series Doses Administered" = 0

/*
@input: One cholera primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 1
@decision: Whole-cell (WC) vaccines schedule
*/
define "One cholera primary series dose was administered":
  "Number of Cholera Primary Series Doses Administered" = 1

/*
@input: At least one cholera primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") >= 1
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "At least one cholera primary series dose was administered":
  "Number of Cholera Primary Series Doses Administered" >= 1

/*
@input: Two cholera primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 2
@decision: Whole-cell (WC) vaccines schedule
*/
define "Two cholera primary series doses were administered":
  "Number of Cholera Primary Series Doses Administered" = 2

/*
@input: Dose number of the latest primary series dose is one
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 1
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "Dose number of the latest primary series dose is one":
  "Cholera Primary Series Doses Administered to Patient".mostRecent().getDose('1') is not null

/*
@input: Dose number of the latest primary series dose is two
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 2
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "Dose number of the latest primary series dose is two":
  "Cholera Primary Series Doses Administered to Patient".mostRecent().getDose('2') is not null

/*
@input: Dose number of the latest primary series dose is less than three
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") < 3
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "Dose number of the latest primary series dose is less than three":
  (("Cholera Primary Series Doses Administered to Patient".mostRecent()) I
    where exists( I.protocolApplied pa where ToInteger(pa.doseNumber) < 3)) is not null

/*
@input: Dose number of the latest primary series dose is more than or equal to two
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") >= 2
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "Dose number of the latest primary series dose is more than or equal to two":
  (("Cholera Primary Series Doses Administered to Patient".mostRecent()) I
    where exists( I.protocolApplied pa where ToInteger(pa.doseNumber) >= 2)) is not null


/*
@input: Dose number of the latest primary series dose is three
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 3
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "Dose number of the latest primary series dose is three":
  "Cholera Primary Series Doses Administered to Patient".mostRecent().getDose('3') is not null

/*
@input: No cholera booster series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Booster dose") = 0
@decision: Whole-cell (WC) vaccines schedule
*/
define "No cholera booster series dose was administered":
  "Number of Cholera Booster Series Doses Administered" = 0

/*
@input: At least one booster series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Booster dose") >= 1
@decision: Whole-cell (WC) vaccines schedule
*/
define "At least one booster series dose was administered":
  "Number of Cholera Booster Series Doses Administered" >= 1

/*
@input: Dose number of the latest dose is one
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 1
@decision: Whole-cell (WC) vaccines schedule
*/
define "Dose number of the latest dose is one":
  "Cholera Doses Administered to Patient".mostRecent().getDose('1') is not null

/*
@input: Dose number of the latest dose is two
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 2
@decision: Whole-cell (WC) vaccines schedule
*/
define "Dose number of the latest dose is two":
  "Cholera Doses Administered to Patient".mostRecent().getDose('2') is not null

/*
@input: The latest cholera dose was administered less than 14 days ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") < 14 days
@decision: Whole-cell (WC) vaccines schedule
*/
define "The latest cholera dose was administered less than 14 days ago":
  "Date of Latest Cholera Dose" is not null
  and duration in days between "Date of Latest Cholera Dose" and Now() < 14

/*
@input: The latest cholera dose was administered more than 14 days ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 14 days
@decision: Whole-cell (WC) vaccines schedule
*/
define "The latest cholera dose was administered more than 14 days ago":
  not "The latest cholera dose was administered less than 14 days ago"

/*
@input: The latest cholera dose was administered less than 1 week ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") < 1 week
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "The latest cholera dose was administered less than 1 week ago":
  "Date of Latest Cholera Dose" is not null
  and duration in weeks between "Date of Latest Cholera Dose" and Now() < 1

/*
@input: The latest cholera dose was administered more than 1 week and less than 6 weeks ago
@pseudocode: 1 week ≤ Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") < 6 weeks
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "The latest cholera dose was administered more than 1 week and less than 6 weeks ago":
  "Date of Latest Cholera Dose" is not null
  and duration in weeks between "Date of Latest Cholera Dose" and Now() >= 1
  and duration in weeks between "Date of Latest Cholera Dose" and Now() < 6

/*
@input: The latest cholera dose was administered more than 6 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 6 weeks
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "The latest cholera dose was administered more than 6 weeks ago":
  "Date of Latest Cholera Dose" is not null
  and duration in weeks between "Date of Latest Cholera Dose" and Now() >= 6

/*
@input: The latest cholera dose was administered less than {Member States defined lower limit} days ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≤ Member States defined lower limit
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "The latest cholera dose was administered less than {Member States defined lower limit} days ago":
  "Date of Latest Cholera Dose" is not null
  and duration in days between "Date of Latest Cholera Dose" and Now() <= CholeraLowerLimitDays

/*
@input: The latest cholera dose was administered approximately less than 6 months ago {Member States defined exact interval}
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≤ 6 months
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "The latest cholera dose was administered approximately less than 6 months ago {Member States defined exact interval}":
  "Date of Latest Cholera Dose" is not null
  and duration in days between "Date of Latest Cholera Dose" and Now() > CholeraLowerLimitDays
  and duration in days between ("Date of Latest Cholera Dose" + 6 months) and Now() <= CholeraExactIntervalDays

/*
@input: The latest cholera dose was administered approximately more than 6 months ago {Member States defined exact interval}
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") > 6 months
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
*/
define "The latest cholera dose was administered approximately more than 6 months ago {Member States defined exact interval}":
  "Date of Latest Cholera Dose" is not null
  and duration in days between ("Date of Latest Cholera Dose" + 6 months) and Now() > CholeraExactIntervalDays

/*
@input: The latest cholera dose was administered approximately less than 2 years ago {Member States defined interval}
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≤ 2 years ± Member States defined interval
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "The latest cholera dose was administered approximately less than 2 years ago {Member States defined interval}":
  "Date of Latest Cholera Dose" is not null
  and duration in months between "Date of Latest Cholera Dose" and Now() > 21
  and duration in days between ("Date of Latest Cholera Dose" + 2 years) and Now() <= CholeraExactIntervalDays

/*
@input: The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") > 2 years ± Member States defined interval
@decision: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
*/
define "The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}":
  "Date of Latest Cholera Dose" is not null
  and duration in days between ("Date of Latest Cholera Dose" + 2 years) and Now() > CholeraExactIntervalDays

/*
@input: The latest cholera dose was administered less than 3 years ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") < 3 years
@decision: Whole-cell (WC) vaccines schedule
*/
define "The latest cholera dose was administered less than 3 years ago":
  "Date of Latest Cholera Dose" is not null
  and duration in years between "Date of Latest Cholera Dose" and Now() < 3

/*
@input: The latest cholera dose was administered more than 3 years ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 3 years
@decision: Whole-cell (WC) vaccines schedule
*/
define "The latest cholera dose was administered more than 3 years ago":
  not "The latest cholera dose was administered less than 3 years ago"

/*
@input: The latest cholera dose was administered more than 14 days ago and less than 3 years ago
@pseudocode: 14 days <= Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") <= 3 years
@decision: Whole-cell (WC) vaccines schedule
*/
define "The latest cholera dose was administered more than 14 days ago and less than 3 years ago":
  "The latest cholera dose was administered more than 14 days ago"
  and "The latest cholera dose was administered less than 3 years ago"


/*
  * Library: IMMZD2DTHepatitisBElements
  */
library IMMZD2DTHepatitisBElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZElements called Elements

parameter HepBBirthDoseAgeLimitDays Integer default 1
parameter HepBLowerLimitWeeks Integer default 4

context Patient

/*
@internal: Hepatitis B containing Doses Administered to Patient
*/
define "Hepatitis B Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Hepatitis B-containing vaccines"

/*
@internal: Hepatitis B containing Doses Administered to Patient that are in the Primary series
*/
define "Hepatitis B Primary Series Doses Administered to Patient":
  "Hepatitis B Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Hepatitis B Primary Series doses
*/
define "Number of Hepatitis B Primary Series Doses Administered":
  Count("Hepatitis B Primary Series Doses Administered to Patient")

/*
@input: Hepatitis B birth dose was not administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Birth dose" = TRUE) = 0
@code: Hepatitis B birth dose was not administered-117
@decision: IMMZ.D2.DT.Hepatitis B.Birth dose: Birth dose administration
*/
define "Hepatitis B birth dose was not administered":
  "Number of Hepatitis B Dose 0 Doses Administered" = 0

/*
@input: Client's age is less than {Member States defined upper limit}
@pseudocode: Today's date − "Date of birth" < Member States defined upper limit
@code: Client's age is less than {Member States defined upper limit}-66
@decision: IMMZ.D2.DT.Hepatitis B.Birth dose: Birth dose administration
*/
define "Client's age is less than {Member States defined upper limit}":
  Elements."Current Patient Age In Days" < HepBBirthDoseAgeLimitDays

/*
@input: Client's age is more than {Member States defined upper limit}
@pseudocode: Today's date - "Date of birth" > Member States defined upper limit
@code: Client's age is more than {Member States defined upper limit}-66
@decision: IMMZ.D2.DT.Hepatitis B.Birth dose: Birth dose administration
*/
define "Client's age is more than {Member States defined upper limit}":
  Elements."Current Patient Age In Days" >= HepBBirthDoseAgeLimitDays

/*
@input: Hepatitis B birth dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Birth dose" = TRUE) = 1
@code: Hepatitis B birth dose was administered-117
@decision: IMMZ.D2.DT.Hepatitis B.Birth dose: Birth dose administration
*/
define "Hepatitis B birth dose was administered":
  "Number of Hepatitis B Dose 0 Doses Administered" = 1

/*
@input: No hepatitis B primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines"and "Type of dose" = "Primary series") = 0
@code: No hepatitis B primary series doses were administered-130
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
*/
define "No hepatitis B primary series doses were administered":
  "Number of Hepatitis B Primary Series Doses Administered" = 0

/*
@input: Client's age is less than {Member States defined lower limit}
@pseudocode: Today's date − "Date of birth" < Member States defined lower limit
@code: Client's age is less than {Member States defined lower limit}-66
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
*/
define "Client's age is less than {Member States defined lower limit}":
  Elements."Current Patient Age In Weeks" < HepBLowerLimitWeeks

/*
@input: Client's age is more than or equal to {Member States defined lower limit}
@pseudocode: Today's date − "Date of birth" ≥ Member States defined lower limit
@code: Client's age is more than or equal to {Member States defined lower limit}-66
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
*/
define "Client's age is more than or equal to {Member States defined lower limit}":
  Elements."Current Patient Age In Weeks" >= HepBLowerLimitWeeks

/*
@input: One hepatitis B primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose" = "Primary series") = 1
@code: One hepatitis B primary series dose was administered-131
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
*/
define "One hepatitis B primary series dose was administered":
  "Number of Hepatitis B Primary Series Doses Administered" = 1

/*
@input: The latest hepatitis B dose was administered less than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines") < 4 weeks
@code: The latest hepatitis B dose was administered less than 4 weeks ago-121
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "The latest hepatitis B dose was administered less than 4 weeks ago":
  "Date of Latest Hepatitis B Dose" is not null
    and duration in weeks between "Date of Latest Hepatitis B Dose" and Now() < 4

/*
@input: The latest hepatitis B dose was administered more than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines") ≥ 4 weeks
@code: The latest hepatitis B dose was administered more than 4 weeks ago-121
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "The latest hepatitis B dose was administered more than 4 weeks ago":
  not("The latest hepatitis B dose was administered less than 4 weeks ago")

/*
@input: Two hepatitis B primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose" = "Primary series") = 2
@code: Two hepatitis B primary series doses were administered-131
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
*/
define "Two hepatitis B primary series doses were administered":
  "Number of Hepatitis B Primary Series Doses Administered" = 2

/*
@input: Client's weight at birth was over 2000 g
@pseudocode: "Birth weight in grams" ≥ 2000
@code: Client's weight at birth was over 2000 g-30
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
*/
define "Client's weight at birth was over 2000 g":
  Elements."Client's weight at birth was over 2000 g"

/*
@input: Client was not a premature infant at birth
@pseudocode: "Preterm birth" ≠ TRUE
@code: Client was not a premature infant at birth-22
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
*/
define "Client was not a premature infant at birth":
  Elements."Client was not a premature infant at birth"

/*
@input: Client's weight at birth was below 2000 g
@pseudocode: "Birth weight in grams" < 2000
@code: Client's weight at birth was below 2000 g-30
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
*/
define "Client's weight at birth was below 2000 g":
  Elements."Client's weight at birth was below 2000 g"

/*
@input: Client was a premature infant at birth
@pseudocode: "Preterm birth" = TRUE
@code: Client was a premature infant at birth-22
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
*/
define "Client was a premature infant at birth":
  Elements."Client was a premature infant at birth"

/*
@input: Three hepatitis B primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose" = "Primary series") = 3
@code: Three hepatitis B primary series doses were administered-131
@decision: IMMZ.D2.DT.Hepatitis B.3 doses: 3-dose schedule (birth dose + 2 primary series doses), on-time start
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
*/
define "Three hepatitis B primary series doses were administered":
  "Number of Hepatitis B Primary Series Doses Administered" = 3

/*
@input: One hepatitis B primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose" = "Primary series") = 1
@code: One hepatitis B primary series doses were administered-131
@decision: IMMZ.D2.DT.Hepatitis B.4 doses: 4-dose schedule (birth dose + 3 primary series doses), on-time start
*/
define "One hepatitis B primary series doses were administered":
  "One hepatitis B primary series dose was administered"

/*
@input: No hepatitis B doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 0
@code: No hepatitis B doses were administered-93
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "No hepatitis B doses were administered":
  "Number of Hepatitis B Doses Administered" = 0

/*
@input: Client's age is more than {Member States defined lower limit}
@pseudocode: Today's date − "Date of birth" > Member States defined lower limit
@code: Client's age is more than {Member States defined lower limit}-66
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "Client's age is more than {Member States defined lower limit}":
  Elements."Current Patient Age In Days" >= HepBBirthDoseAgeLimitDays

/*
@input: One hepatitis B dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 1
@code: One hepatitis B dose was administered-93
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "One hepatitis B dose was administered":
  "Number of Hepatitis B Doses Administered" = 1

/*
@input: Two hepatitis B doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 2
@code: Two hepatitis B doses were administered-93
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "Two hepatitis B doses were administered":
  "Number of Hepatitis B Doses Administered" = 2

/*
@input: The first hepatitis B dose was administered less than 6 months ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Dose number" = 1) < 6 months
@code: The first hepatitis B dose was administered less than 6 months ago-137
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "The first hepatitis B dose was administered less than 6 months ago":
  "Date of First Hepatitis B Dose" is not null
    and duration in months between "Date of First Hepatitis B Dose" and Now() < 6

/*
@input: The first hepatitis B dose was administered more than 6 months ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Dose number" = 1) ≥ 6 months
@code: The first hepatitis B dose was administered more than 6 months ago-137
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "The first hepatitis B dose was administered more than 6 months ago":
  not("The first hepatitis B dose was administered less than 6 months ago")

/*
@input: Three hepatitis B doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 3
@code: Three hepatitis B doses were administered-93
@decision: IMMZ.D2.DT.Hepatitis B.Delayed start: 3-dose schedule (no birth dose + 3 doses), delayed start
*/
define "Three hepatitis B doses were administered":
  "Number of Hepatitis B Doses Administered" = 3

/*
@internal: Date of Latest Hepatitis B Dose
*/
define "Date of Latest Hepatitis B Dose":
  date from start of "Hepatitis B Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@internal: Date of First Hepatitis B Dose
*/
define "Date of First Hepatitis B Dose":
  date from start of "Hepatitis B Doses Administered to Patient".earliest().occurrence.toInterval()

/*
@internal: Hepatitis B Dose 0 Doses Administered to Patient
*/
define "Hepatitis B Dose 0 Doses Administered to Patient":
  "Hepatitis B Doses Administered to Patient".seriesDose0()

/*
@internal: Number of Hepatitis B Dose 0 Doses Administered
*/
define "Number of Hepatitis B Dose 0 Doses Administered":
  Count("Hepatitis B Dose 0 Doses Administered to Patient")

/*
@internal: Number of Hepatitis B Doses Administered
*/
define "Number of Hepatitis B Doses Administered":
  Count("Hepatitis B Doses Administered to Patient")

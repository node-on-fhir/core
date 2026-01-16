
/*
  * Library: IMMZD2DTDengueElements
  */
library IMMZD2DTDengueElements

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
@internal: Dengue containing Doses Administered to Patient
*/
define "Dengue Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Dengue vaccines"

/*
@internal: Dengue containing Doses Administered to Patient that are in the Primary series
*/
define "Dengue Primary Series Doses Administered to Patient":
  "Dengue Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Dengue Primary Series doses
*/
define "Number of Dengue Primary Series Doses Administered":
  Count("Dengue Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last Dengue dose
*/
define "Date of Latest Dengue Dose":
  date from start of "Dengue Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No dengue primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 0
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "No dengue primary series doses were administered":
  "Number of Dengue Primary Series Doses Administered" = 0

/*
@input: One dengue primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 1
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "One dengue primary series dose was administered":
  "Number of Dengue Primary Series Doses Administered" = 1

/*
@input: Two dengue primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 2
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "Two dengue primary series doses were administered":
  "Number of Dengue Primary Series Doses Administered" = 2

/*
@input: Three dengue primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 3
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "Three dengue primary series doses were administered":
  "Number of Dengue Primary Series Doses Administered" = 3

/*
@input: Client's age is less than 9 years
@pseudocode: Today's date − "Date of birth" <  9 years
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "Client's age is less than 9 years":
  Elements."Current Patient Age In Years" < 9

/*
@input: Client's age is more than 45 years
@pseudocode: Today's date − "Date of birth" > 45 years
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "Client's age is more than 45 years":
  Elements."Current Patient Age In Years" > 45

/*
@input: Client's age is between 9 years and 45 years
@pseudocode: 9 years ≤ Today's date − "Date of birth" ≤  45 years
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "Client's age is between 9 years and 45 years":
  Elements."Current Patient Age In Years" >= 9 
  and Elements."Current Patient Age In Years" <= 45

/*
@internal: Dengue serostatus Observation
*/
define "Dengue serostatus Observation":
  ([Observation: Concepts."Dengue serostatus"] O
    sort by end of effective.toInterval() desc).complete()

/*
@input: Client's dengue serostatus is negative
@pseudocode: "Dengue serostatus" = "Negative"
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
*/
define "Client's dengue serostatus is negative":
  First( "Dengue serostatus Observation" ).value ~ Concepts."Dengue-Negative"

/*
@input: Client's dengue serostatus is positive
@pseudocode: "Dengue serostatus" = "Positive"
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
*/
define "Client's dengue serostatus is positive":
  First( "Dengue serostatus Observation" ).value ~ Concepts."Dengue-Positive"

/*
@input: The latest dengue dose was administered less than 6 months ago
@pseudocode: Today's date - Latest "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines") < 6 months
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "The latest dengue dose was administered less than 6 months ago":
  "Date of Latest Dengue Dose" is not null
  and duration in months between "Date of Latest Dengue Dose" and Now() < 6

/*
@input: The latest dengue dose was administered more than 6 months ago
@pseudocode: Today's date - Latest "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines") ≥ 6 months
@decision: CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
@decision: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
*/
define "The latest dengue dose was administered more than 6 months ago":
  "Date of Latest Dengue Dose" is not null
  and duration in months between "Date of Latest Dengue Dose" and Now() >= 6

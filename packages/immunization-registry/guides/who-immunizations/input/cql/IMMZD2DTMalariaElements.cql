
/*
  * Library: IMMZD2DTMalariaElements
  */
library IMMZD2DTMalariaElements

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
@internal: Malaria containing Doses Administered to Patient
*/
define "Malaria Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."Malaria vaccines"

/*
@internal: Malaria containing Doses Administered to Patient that are in the Primary series
*/
define "Malaria Primary Series Doses Administered to Patient":
  "Malaria Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of Malaria Primary Series doses
*/
define "Number of Malaria Primary Series Doses Administered":
  Count("Malaria Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last Malaria dose
*/
define "Date of Latest Malaria Dose":
  date from start of "Malaria Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No malaria primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 0
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "No malaria primary series doses were administered":
  "Number of Malaria Primary Series Doses Administered" = 0

/*
@input: One malaria primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 1
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "One malaria primary series dose was administered":
  "Number of Malaria Primary Series Doses Administered" = 1

/*
@input: Two malaria primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 2
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "Two malaria primary series doses were administered":
  "Number of Malaria Primary Series Doses Administered" = 2

/*
@input: Three malaria primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 3
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "Three malaria primary series doses were administered":
  "Number of Malaria Primary Series Doses Administered" = 3

/*
@input: Four malaria primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 4
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "Four malaria primary series doses were administered":
  "Number of Malaria Primary Series Doses Administered" = 4

/*
@input: Client's age is less than 5 months
@pseudocode: Today's date − "Date of birth" < 5 months
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "Client's age is less than 5 months":
  Elements."Current Patient Age In Months" < 5

/*
@input: Client's age is more than or equal to 5 months
@pseudocode: Today's date − "Date of birth" ≥ 5 months
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "Client's age is more than or equal to 5 months":
  Elements."Current Patient Age In Months" >= 5

/*
@input: The latest malaria dose was administered less than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines") < 4 weeks
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "The latest malaria dose was administered less than 4 weeks ago":
	"Date of Latest Malaria Dose" is not null 
    and duration in weeks between "Date of Latest Malaria Dose" and Now() < 4

/*
@input: The latest malaria dose was administered more than 4 weeks ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines") ≥ 4 weeks
@decision: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)									
*/
define "The latest malaria dose was administered more than 4 weeks ago":
  not "The latest malaria dose was administered less than 4 weeks ago"


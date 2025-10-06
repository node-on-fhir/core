Instance: Example.IMMZ.D1.QuestionnaireResponse.Measles
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireReponse for Capture Client History for Measles"
Description: """
Example QuestionnaireReponse for IMMZ.D1.Capture or update client history.
For patient receiving Measles vaccine.
"""
Usage: #example
* status = #completed
* authored = "2025-01-13T19:20:20.913Z"
* questionnaire = Canonical(QIMMZD1)
* subject = Reference(IMMZ.C.Patient.1)

* insert QRItem( Coding, typeOfDose, IMMZ.D#DE259 "Primary series" )
* insert QRItem( Boolean, completedThePrimaryVaccinationSeries, false )
* insert QRItem( Boolean, completedTheBoosterSeries, false )
* insert QRItem( Coding, hivStatus, IMMZ.D#DE205 "HIV-positive" )
* insert QRItem( Boolean, currentlyOnArt, true ) //
* insert QRItem( Boolean, pretermBirth, false )
* insert QRItem( Boolean, immunocompromised, true )
* insert QRItem( Date, artStartDate, "2020-12-18" ) //
* insert QRItem( Coding, vaccineType, IMMZ.Z#DE9 "Measles-containing vaccines" )
* insert QRItem( DateTime, dateAndTimeOfVaccination, "2021-04-01T04:00:00Z")
* insert QRItem( Date, contactDate, "2021-04-01" )
* insert QRItem( Integer, doseNumber, 1 )

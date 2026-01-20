Instance: Example.IMMZ.D1.QuestionnaireResponse.DTP
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireReponse for Capture Client History for DTP"
Description: """
Example QuestionnaireReponse for IMMZ.D1.Capture or update client history.
For patient receiving DTP vaccine.
"""
Usage: #example
* status = #completed
* authored = "2025-01-13T19:20:20.913Z"
* questionnaire = Canonical(QIMMZD1)
* subject = Reference(IMMZ.C.Patient.2)

* insert QRItem( Coding, typeOfDose, IMMZ.D#DE259 "Primary series" )
* insert QRItem( Boolean, completedThePrimaryVaccinationSeries, true )
* insert QRItem( Boolean, completedTheBoosterSeries, true )
* insert QRItem( Coding, hivStatus, IMMZ.D#DE206 "HIV-negative" )
* insert QRItem( Boolean, pretermBirth, false )
* insert QRItem( Boolean, immunocompromised, false )
* insert QRItem( Coding, vaccineType, IMMZ.Z#DE24 "DTP-containing vaccines" )
* insert QRItem( DateTime, dateAndTimeOfVaccination, "2020-08-05T04:00:00Z")
* insert QRItem( Date, contactDate, "2020-08-05" )
* insert QRItem( Integer, ancContactNumber, 5 )
* insert QRItem( Integer, doseNumber, 1 )

Instance: Example.IMMZ.D1.QuestionnaireResponse.Rabies
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireReponse for Capture Client History for Rabies"
Description: """
Example QuestionnaireReponse for IMMZ.D1.Capture or update client history.
For patient receiving Rabies vaccine.
"""
Usage: #example
* status = #completed
* authored = "2025-01-13T19:20:20.913Z"
* questionnaire = Canonical(QIMMZD1)
* subject = Reference(IMMZ.C.Patient.1)

* insert QRItem( Coding, typeOfDose, IMMZ.D#DE259 "Primary series" )
* insert QRItem( Boolean, completedThePrimaryVaccinationSeries, false )
* insert QRItem( Boolean, completedTheBoosterSeries, false )
* insert QRItem( Coding, hivStatus, IMMZ.D#DE206 "HIV-negative" )
* insert QRItem( Boolean, pretermBirth, false )
* insert QRItem( Boolean, immunocompromised, false )
* insert QRItem( Decimal, vnaLevel, 0.0) //
* insert QRItem( Boolean, riskOfOccupationalExposureToRabiesVirus, true ) //
* insert QRItem( Coding, vaccineType, IMMZ.Z#DE15 "Rabies vaccines" )
* insert QRItem( DateTime, dateAndTimeOfVaccination, "2020-12-18T04:00:00Z")
* insert QRItem( Date, contactDate, "2020-12-18" )
* insert QRItem( Integer, doseNumber, 1 )

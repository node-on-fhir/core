Instance: Example.IMMZ.D17.QuestionnaireResponse.1
InstanceOf: QuestionnaireResponse
Title: "Example QuestionnaireReponse for Report AEFI"
Description: """
Example QuestionnaireReponse for IMMZ.D17.Report AEFI.
"""
Usage: #example
* status = #completed
* authored = "2025-06-25T19:20:20.913Z"
* questionnaire = Canonical(QIMMZD17)
* subject = Reference(IMMZ.C.Patient.2)

* insert QRItem( Boolean, reactionReported, true )
* insert QRItem( Date, reactionDate, "2025-06-25" )
* insert QRItem( Coding, reactionManifestation, IMMZ.D#DE103 "Anaphylaxis" )
* insert QRItem( Coding, typeOfReaction, IMMZ.D#DE109 "Life threatening" )
* insert QRItem( String, otherImportantMedicalEvent, "Other event details" )
* insert QRItem( Coding, reactionOutcome, IMMZ.D#DE120 "Not recovered" )

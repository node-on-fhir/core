Instance:     QIMMZD7
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.D7.Counsel client"
Description:  "Questionnaire for IMMZ.D7.Counsel client"
Usage: #definition

* version = "2025"
* status = #draft
* subjectType = #Patient
* language = #en
* contained[+] = IMMZ.D.DE86

* insert Question(clientEducationAndCounsellingOnImmunization, Client education and counselling on immunization, choice, false, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE86)
  * code[+] = IMMZ.D#DE86
  * code[+] = $ICD11#QA1Y "Contact with health services for other specified counselling"

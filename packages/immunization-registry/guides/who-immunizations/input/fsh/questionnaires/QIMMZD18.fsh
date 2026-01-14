Instance:     QIMMZD18
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.D18.Determine time for next visit"
Description:  "Questionnaire for IMMZ.D18.Determine time for next visit"
Usage: #definition

* version = "2025"
* status = #draft
* subjectType = #Patient
* language = #en

* insert Question(dateTimeOfFollowUpAppointment, Date/time of follow-up appointment, dateTime, false, false)
* item[=]
  * code[+] = IMMZ.D#DE185
  * code[+] = $SCT#185353001 "Appointment date (finding)"
* insert Question(recommendedFollowUpDate, Recommended follow-up date, date, false, false)
* item[=]
  * code[+] = IMMZ.D#DE186
  * code[+] = $LNC#39289-4 "Code LongName: Follow-up (referred to) provider/specialist, appointment date CPHS"
  * code[+] = $SCT#410671006 "Date (attribute)"

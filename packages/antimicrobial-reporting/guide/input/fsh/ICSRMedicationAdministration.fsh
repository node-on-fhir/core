Profile: ICSRMedicationAdministration
Parent: MedicationAdministration
Id: icsr-medicationadministration
Title: "ICSR MedicationAdministration"
Description: "The common fields needed for either a transfusion or vaccination drug administration."

* status MS
* subject MS
* subject only Reference(ICSRPatient)
* reasonCode MS
* effective[x] MS
* reasonCode MS
* medication[x] MS
* dosage MS
* dosage.text MS
* dosage.dose MS
* dosage.route MS

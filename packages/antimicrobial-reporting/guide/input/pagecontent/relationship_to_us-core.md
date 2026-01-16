<p>We have tried to have the FHIR profiles conform to the HL7 FHIR US Core Implementation Guide where applicable.  Below is a summary of the differences between the profiles defined in this guide and the US-Core profiles:</p>

<h3>Differences from IG-defined Profiles to US-Core</h3>
<ul>
<li>Patient: Added militaryStatus extension and made telecom Must Support</li>
<li>Practitioner: Added mustSupport to: telecom, address</li>
<li>PractitionerRole: Map from the US Core Provider Role (NUCC) value set to ICSR codes</li>
<li>Organization:
	<ul>
		<li>Added DepartmentName extension</li>
		<li>Added mustSupport to: type, contact</li>
		<li>Made mandatory: type, contact, address</li>
		<li>Restricted telecom to 1 phone, 1 fax, and/or 1 email</li>
	</ul>
</li>
<li>RelatedPerson: Not in US-Core</li>
<li>MedicationAdministration: Not in US-Core</li>
<li>Medication: US-Core Medication profile is not referenced because it mandates RxNorm and we need to supply NDC codes for medication</li>
<li>Immunization:
	<ul>
		<li>Added ageAtVaccination extension</li>
		<li>Added mustSupport to: manufacturer, location, lotNumber, expirationDate, site, route, doseQuantity</li>
	</ul>
</li>
<li>Procedure: 
	<ul>
		<li>Added extension for BiologicallyDerivedProduct to usedReference</li>
		<li>Added extension for quantity of used item</li>
	</ul>
</li>
<li>BiologicallyDerivedProduct: Not in US-Core</li>
<li>Vital Signs: Used without change for Weight, Height, LastMenstrualPeriod, AgeGroup</li>
<li>AdverseEvent: Not in US-Core</li>
</ul>

Well, yeah!  Let's start by using the /import/ui-fhir/condition directory and 

When creating a new FHIR resource in this directory:

- Use the /import/ui-fhir/condition as gold standard template.
- Use camelCase for the directory name; and ProperCase for the file names.
- Make sure to include a {Resource}Page and {Resources}Table 
- Create a schema in /imports/lib/schemas/SimpleSchemas
- Add dehydrate/flatten methods in /imports/lib/FhirDehydrator
- Add conditional routes in App.jsx
- Attach the {Resources}Table to the Meteor.Tables object.
- Add a collection count in PatientSidebar.jsx 

## JsonSchema Refactor 

We want to abstract and refactor these schemas, so they pick up the HL7 base schemas (provided in JsonSchema format).  We need to create *one* file that programatically generates all the schemas (in SimpleSchema format, which we've proved can work in both server/client with the data cursors).  Once done, we may also look into adjusting SimpleSchema to attach JsonSchema directly.  

-[] Copy R5 JsonSchemas into repo.
-[] Copy R4 JsonSchemas into repo.

-[] Scan schema directory 
-[] Build array of schemas configs objects for each schema.
-[] Add url paths and other necessary configs. 

-[] For each schema config, do the following:

-[] Copy the Basic template 
-[] Inject resource name into the template, replacing 'Basic'
-[] Add schema via JsonToSimpleSchema parser

-[] Add schemas to exports.  May need to scan schema directory again
-[] 


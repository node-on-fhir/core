# ANTIGEN

- [ ] Add valueset for the antigen from IMMZ.Z to IMMZConcepts
- [ ] Copy and update from another activitydefinition for the create medicationrequest activity.  `input/fsh/activitydefintions/IMMZD2DTANTIGENMR.fsh`

## For each decision/schedule table:

### TABLEDESC

- [ ] In `tools/node` run: `node processDTInput.js ../../input/L2/IMMZ\ DAK_decision-support\ logic.xlsx ANTIGEN ROWOFFSET ROWS(X-Y) COLUMNS(X-Y) D2DT`  (Use processDTCheck to make sure rows, cols, and offset are correct.)
  - [ ] **If first time**: move cql files to `input/cql`, move fsh files to `input/fsh/libraries`.  **If not first time**: Review cql files to add new expressions to `IMMZD2DTANTIGENElements.cql` and `IMMZD2DTANTIGENEncounterElements.cql`
  - [ ] Review expressions for generic ones that are across antigens and copy those to `IMMZElements.cql` or `IMMZEncounterElements.cql` and reference these from the ANTIGEN CQL.  Remove @decision comment from IMMZElements and IMMZEncounterElements.
  - [ ] Create code for expressions based on the pseudocode
- [ ] In `tools/node` run: `node processDTOutput.js ../../input/L2/IMMZ\ DAK_decision-support\ logic.xlsx ANTIGEN ROWOFFSET ROWS(X-Y) COLUMNS(X-Y) D2DT TABLEID` (use single if only one table)
  - [ ] Create test directory: `input/tests/plandefinition/IMMZD2DTANTIGENTABLEIDLogic`
  - [ ] move `output/examples.yaml` to `input/tests/plandefinition/IMMZD2DTANTIGENTABLEIDLogic`
    - [ ] Update examples to fill out missing content based on the table
    - [ ] Run script from this directory: `node ../../../../tools/node/makeExample.js examples.yaml`
  - [ ] Move `output/cql/IMMZD2DTANTIGENTABLEIDLogic.cql` to `input/cql` 
    - [ ] Run the Logic CQL file and ensure the Test Validation expression succeeds.
  - [ ] Move `output/libraries/IMMZD2DTANTIGENTABLEIDLogic.fsh` to `input/fsh/libraries`
  - [ ] Replace list of concepts in `input/fsh/codesystem/IMMZ.D2.DT.Inputs.fsh` from `codesystem/IMMZ.D2.DT.Inputs.fsh`
  - [ ] Replace list of concepts in `input/fsh/codesystem/IMMZ.D2.DT.Outputs.fsh` from `codesystem/IMMZ.D2.DT.Outputs.fsh`
  - [ ] move `output/valuesets/IMMZ.D2.DT.ANTIGEN.TABLEID.fsh` to `input/fsh/valuesets/IMMZ.D2.DT.ANTIGEN.TABLEID.fsh`
  - [ ] move `output/plandefinitions/IMMZD2DTANTIGENTABLEID.fsh` to `input/fsh/plandefinitions`
    - [ ] Copy and add rule for each medicationrequest that needs to be created based on the expressions from the logic file when an immunization is due.
- [ ] In `tools/node` run: `node processDTSchedule.js ../../input/L2/IMMZ\ DAK_decision-support\ logic.xlsx ANTIGEN ROWOFFSET ROWS(X-Y) COLUMNS(X-Y) D18S TABLEID` (use single if only one table)
  - [ ] Move `output/plandefinitions/IMMZD18SANTIGENTABLEID.fsh` to `input/fsh/plandefinitions`
  - [ ] Make a symlink from `input/tests/plandefinition/IMMZD2DTANTIGENTABLEIDLogic` to `input/tests/plandefinition/IMMZD18SANTIGENTABLEIDLogic`
  - [ ] Move `output/libraries/IMMZD18SANTIGENTABLEIDLogic.fsh` to `input/fsh/libraries`
  - [ ] Move `output/cql/IMMZD18SANTIGENTABLEIDLogic.cql` to `input/cql`
    - [ ] Create code for expressions as needed based on the pseudocode
    - [ ] Set patient ids and expected outcomes in the Test Validation expression based on the examples created for the decision table.
    - [ ] Run the Logic CQL file and ensure the Test Validation expression succeeds.

## For contraindication table:

- [ ] In `tools/node` run: `node processDTInput.js ../../input/L2/IMMZ\ DAK_decision-support\ logic.xlsx ANTIGEN ROWOFFSET ROWS(X-Y) COLUMNS(X-Y) D5DT` 
  - [ ] move cql files to `input/cql`, move fsh files to `input/fsh/libraries`
  - [ ] Make sure expressions exists in Elements and EncounterElements CQL files
  - [ ] If needed, Create code for expressions based on the pseudocode
- [ ] In `tools/node` run: `node processDTOutput.js ../../input/L2/IMMZ\ DAK_decision-support\ logic.xlsx ANTIGEN ROWOFFSET ROWS(X-Y) COLUMNS(X-Y) D5DT CI`
  - [ ] Create test directory: `input/tests/plandefinition/IMMZD5DTANTIGENCILogic`
  - [ ] move `output/examples.yaml` to `input/tests/plandefinition/IMMZD5DTANTIGENCILogic`
    - [ ] Update examples to fill out missing content based on the table
    - [ ] Run script from this directory: `node ../../../../tools/node/makeExample.js examples.yaml`
  - [ ] Move `output/cql/IMMZD2DTANTIGENCILogic.cql` to `input/cql`
    - [ ] Run the Logic CQL file and ensure the Test Validation expression succeeds.
  - [ ] Move `output/libraries/IMMZD2DTANTIGENCILogic.fsh` to `input/fsh/libraries`
  - [ ] Replace list of concepts in `input/fsh/codesystem/IMMZ.D5.DT.Inputs.fsh` from `codesystem/IMMZ.D5.DT.Inputs.fsh`
  - [ ] Replace list of concepts in `input/fsh/codesystem/IMMZ.D5.DT.Outputs.fsh` from `codesystem/IMMZ.D5.DT.Outputs.fsh`
  - [ ] move `output/valuesets/IMMZ.D5.DT.ANTIGEN.CI.fsh` to `input/fsh/valuesets/IMMZ.D5.DT.ANTIGEN.CI.fsh`
  - [ ] move `output/plandefinitions/IMMZD2DTANTIGENCI.fsh` to `input/fsh/plandefinitions`
    - [ ] Copy and add rule for each medicationrequest that needs to be set to do not perform based on the expressions from the logic file when an immunization is contraindicted.
  - [ ] Copy and update from another activitydefinition for the update medicationrequest activity.  `input/fsh/activitydefintions/IMMZD5DTANTIGEN.fsh`
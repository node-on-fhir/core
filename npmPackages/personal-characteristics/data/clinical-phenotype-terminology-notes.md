# Clinical Phenotype Terminology Draft

Generated: 2026-04-12

This package contains:
- `ClinicalPhenotypeLocalCS`: local fallback terminology for phenotype concepts missing or inadequately covered in standard terminologies.
- `ClinicalPhenotypeObservationCodesVS`: for `Observation.code`, combining selected SNOMED CT codes plus all local phenotype concepts.
- `ClinicalPhenotypeQuestionnaireCodesVS`: for `Questionnaire.item.code`, combining selected LOINC codes plus all local phenotype concepts.

## Counts
- Local CodeSystem concepts: 92
- Included SNOMED CT concepts in observation value set: 6
- Included LOINC concepts in questionnaire value set: 38

## Notes
- The local CodeSystem is intentionally broad enough to cover qualitative phenotype traits, operational/aerospace metrics, and performance measures that were not reliably mapped in the phenotype catalog.
- The observation value set favors SNOMED CT when an observable/finding concept was identified.
- The questionnaire value set favors LOINC when a question or measurement term was identified.
- All local concepts are included in both value sets so the same trait can be used either as a prompted question or a recorded observation when needed.

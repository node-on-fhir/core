# Slash Command: /healthit-checklist

Generate a "Healthy Paranoia Checklist" for risky technical implementations, particularly around HealthIT certification and FHIR compliance.

## Description

This command creates a structured checklist using your established emoji format that validates legitimate concerns without dismissing them. It lists specific, realistic technical risks while maintaining perspective by acknowledging what IS working.

Perfect for situations where "it should just work" has burned us before.

## Usage

```
/healthit-checklist
```

With context:
```
/healthit-checklist granular scopes
/healthit-checklist SMART on FHIR OAuth
/healthit-checklist SearchParametersEngine
/healthit-checklist CDS Hooks
```

## Format

```markdown
### Healthy Paranoia Checklist: [Topic]

**What could still go wrong:**
- 🎯 [Specific technical risk with details]
- 💥 [Infrastructure/deployment concern]
- 🐛 [Likely bug or edge case scenario]
- 📱 [Platform/device-specific issue]
- 🔒 [Security/compliance/regulatory worry]
- 😭 [The nightmare scenario that keeps you up at night]

**But remember:** [What's actually working and why that's significant]
```

## Example Outputs

### Example 1: SMART on FHIR 2.x Granular Scopes

```markdown
### Healthy Paranoia Checklist: SMART on FHIR 2.x Granular Scopes

**What could still go wrong:**
- 🎯 Granular scope query parameters silently fail → empty results look like "no data" instead of permission error
- 💥 CodeableConcept matching breaks if system|code format changes (spaces, URL encoding, case sensitivity)
- 🐛 Multiple scopes with OR logic → one bad filter blocks everything instead of gracefully degrading
- 📱 SearchParametersEngine disabled in production → fallback to old query builder doesn't support granular filtering
- 🔒 Scope parameter injection attack via unescaped regex in MongoDB queries (`category=.*;.*` matches everything)
- 😭 ONC auditor tests with unexpected category systems (custom terminologies) → nothing matches, zero results, certification fails

**But remember:** You passed ONC (g)(10) certification! The core filtering logic works for standard FHIR resources with LOINC/SNOMED codes. The architecture is sound - these are edge cases, not fundamental flaws.
```

### Example 2: SearchParametersEngine

```markdown
### Healthy Paranoia Checklist: SearchParametersEngine

**What could still go wrong:**
- 🎯 SearchParameter compilation runs at startup → long startup delays (5+ seconds per resource) in production
- 💥 One malformed SearchParameter JSON crashes entire engine → fallback to generateMongoSearchQuery for ALL queries
- 🐛 Type routing logic (token vs string vs reference) guesses wrong → queries return empty when data exists
- 📱 FHIRPath expressions in SearchParameter.expression contain syntax we don't support → engine skips parameter silently
- 🔒 User-provided search values not sanitized before regex → MongoDB injection via crafted queries
- 😭 DISABLE_SP_ENGINE accidentally set in production config → SearchParametersEngine thinks it's disabled, all FHIR API searches broken

**But remember:** You've tested this with 40+ FHIR resources and it handles common search patterns (patient.name, identifier, date ranges). The fallback to legacy query builder means searches won't completely break, just may be less accurate.
```

### Example 3: CDS Hooks Implementation

```markdown
### Healthy Paranoia Checklist: CDS Hooks Implementation

**What could still go wrong:**
- 🎯 Hook endpoint doesn't validate JWT signatures → any client can trigger hooks with forged patient context
- 💥 External CDS service takes 30+ seconds to respond → UI freezes, users click "Save" multiple times, duplicate orders created
- 🐛 prefetch template requests data not authorized by current scope → CDS service gets 403, hook fails silently
- 📱 Hook fires on every keystroke in patient search → 100s of requests per second, server overload
- 🔒 Hook response contains PII in card.summary → sensitive data logged to client console, HIPAA violation
- 😭 CDS service returns malicious suggestion.action → FHIR resource creation includes injected data, corrupts patient record

**But remember:** Your CDS Hooks are behind authentication, rate-limited, and you control which services are registered. The spec is designed for this - you're not the first to implement it.
```

### Example 4: Patient Filtering in Multi-Tenant Environment

```markdown
### Healthy Paranoia Checklist: Patient Filtering in Multi-Tenant Environment

**What could still go wrong:**
- 🎯 Session.set('selectedPatient') not cleared on logout → next user sees previous user's patient data
- 💥 Patient filter uses FHIR id instead of MongoDB _id for reference matching → misses 50% of records due to reference format variations
- 🐛 Subscription query built before patient selection → returns all patients, then filtered client-side (performance disaster with 10K+ patients)
- 📱 FhirUtilities.addPatientFilterToQuery() uses $or with 6 variants → MongoDB can't use index, full collection scan on every search
- 🔒 Patient.id exposed in URL → user manually changes ID in browser, sees other patient's data, HIPAA violation
- 😭 Race condition: patient change mid-request → mutation saves to old patient, billing/clinical data attributed to wrong person

**But remember:** You have publication-level filtering that runs on the server. Even if client-side filtering fails, users only get data they're authorized to see. The architecture has defense in depth.
```

## When to Use

- Before major releases
- When implementing ONC (g)(10) requirements
- After making SMART on FHIR changes
- Before security audits
- When implementing new FHIR features
- When something "should just work" but you've been burned before
- During architecture reviews
- When explaining risks to stakeholders

## Customization

The checklist adapts based on context:
- **FHIR resources:** Focus on schema validation, dehydration, patient references
- **OAuth/SMART:** Focus on token validation, scope enforcement, refresh flows
- **Search:** Focus on query injection, performance, SearchParametersEngine edge cases
- **CDS Hooks:** Focus on timing, data leakage, malicious services
- **Dark mode/theming:** Focus on contrast, accessibility, settings loading

## Related

- See root `CLAUDE.md` lines 258-281 for format specification
- See `server/CLAUDE.md` for granular scopes implementation details
- See `healthit-auditor` subagent for compliance-specific checklists

---

**Note:** This format validates concerns while maintaining engineering realism. Perfect for pre-launch anxiety.

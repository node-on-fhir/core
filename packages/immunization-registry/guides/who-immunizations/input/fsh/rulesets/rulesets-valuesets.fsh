RuleSet: AddWithExpandCanonical( codesystem, code, display ) 
* {codesystem}{code} "{display}" 
* ^expansion.contains[+].system = Canonical({codesystem})
* ^expansion.contains[=].code = {code}
* ^expansion.contains[=].display = "{display}"

RuleSet: AddWithExpand( codesystem, code, display )
* {codesystem}{code} "{display}"
* ^expansion.contains[+].system = {codesystem}
* ^expansion.contains[=].code = {code}
* ^expansion.contains[=].display = "{display}"
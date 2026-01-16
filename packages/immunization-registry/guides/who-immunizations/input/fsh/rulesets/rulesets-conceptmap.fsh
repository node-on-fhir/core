RuleSet: ElementMap(source, target, equivalence)
* element[+]
  * code = #{source}
  * target[+]
    * code = #{target}
    * equivalence = #{equivalence}

RuleSet: ElementMapComment(source, target, equivalence, comment)
* insert ElementMap({source}, {target}, {equivalence})
* element[=].target[=].comment = "{comment}"

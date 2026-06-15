### Bundle
<table class="grid" style="width: 100%">
	<thead>
		<tr>
			<th>Parameter</th>
			<th>Type</th>
			<th>Conf.</th>
			<th>Description</th>
			<th>Example</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><a href="{{site.data.fhir.path}}bundle.html#search"></a></td>
			<td><a href="{{site.data.fhir.path}}search.html#token">token</a></td>
			<td><strong>SHOULD</strong></td>
			<td>Search by FHIR resource ID</td>
			<td><code class="highlighter-rouge">GET [base]/Bundle?_id=[id]</code></td>
		</tr>
		<tr>
			<td><a href="{{site.data.fhir.path}}bundle.html#search">composition</a></td>
			<td><a href="{{site.data.fhir.path}}search.html#reference">reference</a></td>
			<td><strong>SHOULD</strong></td>
			<td>Search by reference to a composition</td>
			<td><code class="highlighter-rouge">GET [base]/Bundle?composition=[reference]</code></td>
		</tr>
  		<tr>
			<td><a href="{{site.data.fhir.path}}bundle.html#search">identifier</a></td>
			<td><a href="{{site.data.fhir.path}}search.html#token">token</a></td>
			<td><strong>SHOULD</strong></td>
			<td>Search by business identifier</td>
			<td><code class="highlighter-rouge">GET [base]/Bundle?identifier=[token]</code></td>
		</tr>
		<tr>
			<td><a href="{{site.data.fhir.path}}bundle.html#search">timestamp</a></td>
			<td><a href="{{site.data.fhir.path}}search.html#date">date</a></td>
			<td><strong>SHOULD</strong></td>
			<td>Search by a date in time</td>
			<td><code class="highlighter-rouge">GET [base]/Bundle?timestamp=[date]</code></td>
		</tr>
		<tr>
			<td><a href="{{site.data.fhir.path}}bundle.html#search">type</a></td>
			<td><a href="{{site.data.fhir.path}}search.html#token">token</a></td>
			<td><strong>SHOULD</strong></td>
			<td>Search by type code</td>
			<td><code class="highlighter-rouge">GET [base]/Bundle?type=[system]|[code]</code></td>
		</tr>
	</tbody>
</table>
<p>&nbsp;</p>

### Patient
<p>
	We strongly recommend using the $match operation in performing a system-to-system query to ensure that the right patient is selected. The Patient.search parameters below may be generally used for subsequent queries once the patient is selected.
	Search parameter requirements for Patient under this IG match those for <a href="https://hl7.org/fhir/us/core/STU4/StructureDefinition-us-core-patient.html#mandatory-search-parameters">US Core Patient search requirements</a>
</p>
<p>&nbsp;</p>

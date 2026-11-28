# Notice

NodeOnFHIR (Honeycomb) is licensed under the GNU Affero General Public License,
version 3, with an Additional Permission for Independent Extensions. Qualifying
independently developed packages and extensions may be combined with the
NodeOnFHIR core without becoming subject to AGPL-3.0 solely because of that
combination. See [LICENSE-EXCEPTION.md](LICENSE-EXCEPTION.md) for the full terms
and limitations, and [LICENSE.md](LICENSE.md) for the AGPL-3.0 text.

This file records how the Additional Permission is applied to this repository.
It is not part of the permission's terms.

## Copyright holders

The Additional Permission is granted by the copyright holders of the Covered
Core, including Abigail Watson and The MITRE Corporation.

Portions ©2025 The MITRE Corporation. Approved for Public Release; Distribution
Unlimited. Public Release Case Number 25-0219. The MITRE Corporation has
reviewed the Additional Permission and raised no concerns with it.

## What the Covered Core is

The Covered Core is every file in this repository that is licensed under
AGPL-3.0: all files except those inside a directory that carries its own
license terms. In particular, the following are outside the Covered Core and
keep their own licenses:

- `npmPackages/*` workflow packages (each under the license declared in its own `package.json`)
- `core/*` packages (Apache-2.0)
- `libraries/*` (third-party and vendored code under its own license)
- third-party dependencies installed into `node_modules/`

## The published extension interfaces

The interfaces through which an Independent Extension interacts with the
Covered Core are documented in [extensions/API.md](extensions/API.md): the
workflow package entry points (`client.js`, `server.js`, `workflow.json`), the
`WorkflowRegistry`, the component-override slots, and the `EXTRA_WORKFLOWS`
loading mechanism. The server method, publication, REST and FHIR API surfaces
are supported interfaces as well.

## From when it applies

The Additional Permission applies to distributions of this repository that
include `LICENSE-EXCEPTION.md`, from the commit that adds it onward. It does
not amend earlier distributions.

## Contributions

Contributions to the Covered Core are accepted under AGPL-3.0 together with
this Additional Permission. See [CONTRIBUTING.md](CONTRIBUTING.md).

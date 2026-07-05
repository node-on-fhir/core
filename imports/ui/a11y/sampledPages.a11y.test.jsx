// imports/ui/a11y/sampledPages.a11y.test.jsx
// CI gate (Task 6): axe over the shared a11y primitives so structural WCAG
// gains can't regress silently. Keep to jsdom-renderable trees — full Meteor
// pages stay in Nightwatch.
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SkipLink } from './SkipLink';
import { LiveRegionProvider } from './LiveRegionProvider';
import { ClickableTableRow } from '../../ui-tables/ClickableTableRow';

describe('a11y CI gate — sampled primitives', function () {
  it('SkipLink has no axe violations', async function () {
    const { container } = render(
      <div>
        <SkipLink />
        <main id="mainAppRouter">content</main>
      </div>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('LiveRegionProvider tree has no axe violations', async function () {
    const { container } = render(
      <LiveRegionProvider>
        <button>ok</button>
      </LiveRegionProvider>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ClickableTableRow table has no axe violations', async function () {
    const { container } = render(
      <table>
        <tbody>
          <ClickableTableRow onOpen={function () {}}>
            <td>x</td>
          </ClickableTableRow>
        </tbody>
      </table>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

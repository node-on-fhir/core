// imports/ui/a11y/SkipLink.a11y.test.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('renders an anchor with text "Skip to main content"', () => {
    const { getByText } = render(<SkipLink />);
    expect(getByText('Skip to main content')).toBeTruthy();
  });

  it('href points to #mainAppRouter', () => {
    const { getByText } = render(<SkipLink />);
    const anchor = getByText('Skip to main content');
    expect(anchor.getAttribute('href')).toBe('#mainAppRouter');
  });

  it('has className a11y-skip-link (CSS wiring evidence)', () => {
    const { getByText } = render(<SkipLink />);
    const anchor = getByText('Skip to main content');
    expect(anchor.className).toBe('a11y-skip-link');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <SkipLink />
        <main id="mainAppRouter"><p>Main content</p></main>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

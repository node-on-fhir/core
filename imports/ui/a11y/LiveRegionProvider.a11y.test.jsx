// imports/ui/a11y/LiveRegionProvider.a11y.test.jsx
import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import { LiveRegionProvider, useAnnounce } from './LiveRegionProvider';

// Helper: a child component that calls announce() on mount
function Announcer({ message, politeness }) {
  const announce = useAnnounce();
  useEffect(function () {
    announce(message, politeness);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

describe('LiveRegionProvider', () => {
  let rafSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    // Make requestAnimationFrame synchronous so setter fires immediately in tests.
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(function (cb) {
      cb();
      return 0;
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
    jest.useRealTimers();
  });

  it('renders a role="status" aria-live="polite" node', () => {
    const { container } = render(
      <LiveRegionProvider>
        <div />
      </LiveRegionProvider>
    );
    const statusNode = container.querySelector('[role="status"]');
    expect(statusNode).not.toBeNull();
    expect(statusNode.getAttribute('aria-live')).toBe('polite');
    expect(statusNode.getAttribute('aria-atomic')).toBe('true');
  });

  it('renders a role="alert" aria-live="assertive" node', () => {
    const { container } = render(
      <LiveRegionProvider>
        <div />
      </LiveRegionProvider>
    );
    const alertNode = container.querySelector('[role="alert"]');
    expect(alertNode).not.toBeNull();
    expect(alertNode.getAttribute('aria-live')).toBe('assertive');
    expect(alertNode.getAttribute('aria-atomic')).toBe('true');
  });

  it('polite region shows message after announce("Saved")', () => {
    const { container } = render(
      <LiveRegionProvider>
        <Announcer message="Saved" />
      </LiveRegionProvider>
    );
    // rAF is synchronous; state update flushes inside render's act() wrapper.
    const statusNode = container.querySelector('[role="status"]');
    expect(statusNode.textContent).toBe('Saved');
  });

  it('assertive region shows message after announce("Error occurred", "assertive")', () => {
    const { container } = render(
      <LiveRegionProvider>
        <Announcer message="Error occurred" politeness="assertive" />
      </LiveRegionProvider>
    );
    const alertNode = container.querySelector('[role="alert"]');
    expect(alertNode.textContent).toBe('Error occurred');
  });

  it('clears message after 4 seconds', () => {
    const { container } = render(
      <LiveRegionProvider>
        <Announcer message="Saved" />
      </LiveRegionProvider>
    );

    const statusNode = container.querySelector('[role="status"]');
    expect(statusNode.textContent).toBe('Saved');

    // Advance past the 4 000 ms clear timer
    act(() => {
      jest.advanceTimersByTime(4001);
    });

    expect(statusNode.textContent).toBe('');
  });

  it('live regions are visually hidden (position absolute, 1×1)', () => {
    const { container } = render(
      <LiveRegionProvider>
        <div />
      </LiveRegionProvider>
    );
    const statusNode = container.querySelector('[role="status"]');
    expect(statusNode.style.position).toBe('absolute');
    expect(statusNode.style.width).toBe('1px');
    expect(statusNode.style.height).toBe('1px');
  });

  it('has no axe violations', async () => {
    // Restore real timers for axe (it uses async operations internally).
    rafSpy.mockRestore();
    jest.useRealTimers();

    const { container } = render(
      <LiveRegionProvider>
        <main>
          <p>App content</p>
        </main>
      </LiveRegionProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('useAnnounce returns a function', () => {
    function Checker() {
      const announce = useAnnounce();
      expect(typeof announce).toBe('function');
      return null;
    }
    render(
      <LiveRegionProvider>
        <Checker />
      </LiveRegionProvider>
    );
  });

  it('polite and assertive regions clear independently after 4 seconds', () => {
    function DualAnnouncer() {
      const announce = useAnnounce();
      useEffect(function () {
        announce('Saved'); // Polite
        announce('Error', 'assertive'); // Assertive
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
      return null;
    }

    const { container } = render(
      <LiveRegionProvider>
        <DualAnnouncer />
      </LiveRegionProvider>
    );

    const statusNode = container.querySelector('[role="status"]');
    const alertNode = container.querySelector('[role="alert"]');

    // Both messages should be visible immediately
    expect(statusNode.textContent).toBe('Saved');
    expect(alertNode.textContent).toBe('Error');

    // Advance past the 4000 ms clear timer
    act(() => {
      jest.advanceTimersByTime(4001);
    });

    // Both regions should be cleared
    expect(statusNode.textContent).toBe('');
    expect(alertNode.textContent).toBe('');
  });
});

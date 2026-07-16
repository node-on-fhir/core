// imports/ui/a11y/RouteAnnouncer.a11y.test.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import { RouteAnnouncer, deriveTitle } from './RouteAnnouncer';

// Opt in to the React Router v7 behaviors so the deprecation warnings
// don't spam the jest output (they were console.warn noise, not failures)
const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

// --- deriveTitle unit tests ---

describe('deriveTitle()', () => {
  it('returns "Home" for root path', () => {
    expect(deriveTitle('/')).toBe('Home');
  });

  it('title-cases the first path segment', () => {
    expect(deriveTitle('/patients')).toBe('Patients');
  });

  it('replaces hyphens with spaces and title-cases', () => {
    expect(deriveTitle('/care-plans')).toBe('Care plans');
  });

  it('ignores subsequent segments', () => {
    expect(deriveTitle('/observations/abc-123')).toBe('Observations');
  });

  it('handles empty string gracefully', () => {
    expect(deriveTitle('')).toBe('Home');
  });
});

// --- RouteAnnouncer integration tests ---

describe('RouteAnnouncer integration', () => {
  beforeEach(() => {
    document.title = '';
    document.documentElement.removeAttribute('lang');
  });

  it('sets document.documentElement.lang to "en" on mount', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={routerFuture}>
        <div id="mainAppRouter" />
        <RouteAnnouncer />
      </MemoryRouter>
    );
    expect(document.documentElement.lang).toBe('en');
  });

  it('sets document.title to "Home · Honeycomb FHIR" for root path', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={routerFuture}>
        <div id="mainAppRouter" />
        <RouteAnnouncer />
      </MemoryRouter>
    );
    expect(document.title).toContain('Home');
    expect(document.title).toContain('Honeycomb FHIR');
  });

  it('sets document.title to "Patients · Honeycomb FHIR" for /patients', () => {
    render(
      <MemoryRouter initialEntries={['/patients']} future={routerFuture}>
        <div id="mainAppRouter" />
        <RouteAnnouncer />
      </MemoryRouter>
    );
    expect(document.title).toContain('Patients');
    expect(document.title).toContain('Honeycomb FHIR');
  });

  it('calls announce when provided', () => {
    const announce = jest.fn();
    render(
      <MemoryRouter initialEntries={['/patients']} future={routerFuture}>
        <div id="mainAppRouter" />
        <RouteAnnouncer announce={announce} />
      </MemoryRouter>
    );
    expect(announce).toHaveBeenCalledWith('Navigated to Patients');
  });

  it('does not throw when announce is not provided', () => {
    expect(() => {
      render(
        <MemoryRouter initialEntries={['/patients']} future={routerFuture}>
          <div id="mainAppRouter" />
          <RouteAnnouncer />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('renders nothing visible (null return)', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']} future={routerFuture}>
        <RouteAnnouncer />
      </MemoryRouter>
    );
    // RouteAnnouncer itself renders nothing; container has no children from it
    expect(container.querySelector('[data-testid]')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']} future={routerFuture}>
        <main id="mainAppRouter">
          <RouteAnnouncer />
        </main>
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

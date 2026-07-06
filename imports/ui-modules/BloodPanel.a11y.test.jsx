import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { BloodPanelView } from './BloodPanel';

const rows = [
  { analyte: 'Ferritin', value: 150, unit: 'ng/mL',
    resolved: { unit: 'ng/mL', bandProfile: 'low-normal-high',
      normal: { low: { value: 24 }, high: { value: 307 } }, bands: [],
      matched: { source: 'ABIM', version: '2024.1', by: ['sex'], layer: 'base' }, skipped: [] } },
  { analyte: 'PSA', value: 3.2, unit: 'ng/mL',
    resolved: { unit: 'ng/mL', bandProfile: 'informational', normal: null, bands: [],
      matched: { source: 'ABIM', version: '2024.1', by: [], layer: 'base' }, skipped: [] } }
];

test('renders a row per analyte and is accessible', async () => {
  const { container } = render(<BloodPanelView rows={rows} />);
  expect(screen.getByText('Ferritin')).toBeInTheDocument();
  expect(screen.getByText('PSA')).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

test('degrades safely with no rows', () => {
  expect(() => render(<BloodPanelView rows={[]} />)).not.toThrow();
});

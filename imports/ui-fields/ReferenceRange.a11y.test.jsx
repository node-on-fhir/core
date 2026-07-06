// imports/ui-fields/ReferenceRange.a11y.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import ReferenceRange from './ReferenceRange';

test('renders value within a two-sided range and is accessible', async () => {
  const { container } = render(
    <ReferenceRange value={150} unit="ng/mL" normal={{ low: { value: 24 }, high: { value: 307 } }}
      bands={[]} bandProfile="low-normal-high" />
  );
  expect(screen.getByText(/150/)).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

test('qualitative profile renders a status chip, not a gauge', () => {
  render(<ReferenceRange value="Negative" bandProfile="qualitative" normal={null} bands={[]} />);
  expect(screen.getByText(/Negative/)).toBeInTheDocument();
});

test('informational profile shows value with no range', () => {
  render(<ReferenceRange value={3.2} unit="ng/mL" bandProfile="informational" normal={null} bands={[]} />);
  expect(screen.getByText(/3.2/)).toBeInTheDocument();
});

test('degrades safely on missing props', () => {
  expect(() => render(<ReferenceRange />)).not.toThrow();
});

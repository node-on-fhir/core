import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { InstrumentCard, InstrumentGrid } from './InstrumentCard';
import { RangeBar } from './RangeBar';
import { InstrumentChip } from './InstrumentChip';
import { ProportionBar } from './ProportionBar';

test('InstrumentCard renders kicker/title/meta/action and is accessible', async () => {
  const { container } = render(
    <InstrumentGrid>
      <InstrumentCard
        kicker="DiagnosticReport · 2019-05-28"
        kickerRight="Quest · API"
        title="Hormone panel"
        meta={<span>3 analytes</span>}
        action={{ label: 'expand rows', onClick: function () {} }}
      >
        <RangeBar value={12.4} low={1.9} high={12.0} />
        <RangeBar value={5.1} low={3.5} high={12.5} unit="mIU/mL" boundLabel="high" />
        <InstrumentChip label="Tdap" suffix="2019" />
        <InstrumentChip label="COVID booster due" variant="due" />
        <ProportionBar segments={[{ label: 'Neutrophils', value: 61 }, { label: 'Lymphocytes', value: 29 }]} />
      </InstrumentCard>
    </InstrumentGrid>
  );
  expect(screen.getByText('Hormone panel')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'expand rows' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Value 12.4, high/ })).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

test('RangeBar degrades to a spacer with nothing plottable', () => {
  expect(() => render(<RangeBar />)).not.toThrow();
});

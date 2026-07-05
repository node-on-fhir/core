// imports/ui-tables/ClickableTableRow.a11y.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ClickableTableRow } from './ClickableTableRow';

function renderRow(onOpen) {
  return render(
    <table>
      <tbody>
        <ClickableTableRow onOpen={onOpen}>
          <td>Cell content</td>
        </ClickableTableRow>
      </tbody>
    </table>
  );
}

describe('ClickableTableRow', function () {
  it('is keyboard-focusable with role=button', function () {
    renderRow(function () {});
    const row = screen.getByRole('button');
    expect(row).toHaveAttribute('tabindex', '0');
  });

  it('fires onOpen on Enter', function () {
    const onOpen = jest.fn();
    renderRow(onOpen);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('fires onOpen on Space (and prevents default scroll)', function () {
    const onOpen = jest.fn();
    renderRow(onOpen);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('does not fire onOpen on other keys', function () {
    const onOpen = jest.fn();
    renderRow(onOpen);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('fires onOpen on click', function () {
    const onOpen = jest.fn();
    renderRow(onOpen);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async function () {
    const { container } = renderRow(function () {});
    expect(await axe(container)).toHaveNoViolations();
  });
});

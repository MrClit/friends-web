import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceCell } from './AttendanceCell';

const onCommit = vi.fn();

const renderCell = (adults = 2, children = 3) =>
  render(
    <AttendanceCell
      adults={adults}
      children={children}
      adultsLabel="adults"
      childrenLabel="children"
      onCommit={onCommit}
    />,
  );

const adultsInput = () => screen.getByLabelText('adults');
const childrenInput = () => screen.getByLabelText('children');

describe('AttendanceCell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the stored counts', () => {
    renderCell();

    expect(adultsInput()).toHaveValue(2);
    expect(childrenInput()).toHaveValue(3);
  });

  // Each commit is a request: typing "12" must not send a 1 on the way to the 2.
  it('does not commit while typing', () => {
    renderCell();

    fireEvent.change(adultsInput(), { target: { value: '1' } });
    fireEvent.change(adultsInput(), { target: { value: '12' } });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits on blur', () => {
    renderCell();

    fireEvent.change(adultsInput(), { target: { value: '4' } });
    fireEvent.blur(adultsInput());

    expect(onCommit).toHaveBeenCalledWith({ adults: 4, children: 3 });
  });

  it('commits on Enter', () => {
    renderCell();

    fireEvent.change(childrenInput(), { target: { value: '5' } });
    fireEvent.keyDown(childrenInput(), { key: 'Enter' });
    fireEvent.blur(childrenInput());

    expect(onCommit).toHaveBeenCalledWith({ adults: 2, children: 5 });
  });

  it('treats an emptied field as nobody', () => {
    renderCell();

    fireEvent.change(adultsInput(), { target: { value: '' } });
    fireEvent.blur(adultsInput());

    expect(onCommit).toHaveBeenCalledWith({ adults: 0, children: 3 });
    expect(adultsInput()).toHaveValue(0);
  });

  it('does not commit when the value did not change', () => {
    renderCell();

    fireEvent.focus(adultsInput());
    fireEvent.blur(adultsInput());

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('clamps a negative to zero', () => {
    renderCell();

    fireEvent.change(adultsInput(), { target: { value: '-4' } });
    fireEvent.blur(adultsInput());

    expect(onCommit).toHaveBeenCalledWith({ adults: 0, children: 3 });
  });

  it('follows a value changed from outside while it is not being edited', () => {
    const { rerender } = renderCell(2, 3);

    rerender(
      <AttendanceCell adults={7} children={3} adultsLabel="adults" childrenLabel="children" onCommit={onCommit} />,
    );

    expect(adultsInput()).toHaveValue(7);
  });
});

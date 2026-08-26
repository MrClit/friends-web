import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShoppingAddForm } from './ShoppingAddForm';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const onAdd = vi.fn();

const renderForm = () => {
  render(<ShoppingAddForm onAdd={onAdd} />);
  return {
    input: screen.getByRole('textbox', { name: 'addForm.label' }),
    submit: screen.getByRole('button', { name: 'addForm.submit' }),
  };
};

describe('ShoppingAddForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds the trimmed name', () => {
    const { input, submit } = renderForm();

    fireEvent.change(input, { target: { value: '  2 cajas de cerveza  ' } });
    fireEvent.click(submit);

    expect(onAdd).toHaveBeenCalledWith('2 cajas de cerveza');
  });

  it('clears the field and keeps the focus, so items can be chained', () => {
    const { input, submit } = renderForm();

    fireEvent.change(input, { target: { value: 'Pan' } });
    fireEvent.click(submit);

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  // Disabling an input on iOS dismisses the keyboard, which would break chaining items.
  it('never disables the field', () => {
    const { input, submit } = renderForm();

    fireEvent.change(input, { target: { value: 'Pan' } });
    fireEvent.click(submit);

    expect(input).not.toBeDisabled();
  });

  it('ignores an empty or whitespace-only submit', () => {
    const { input, submit } = renderForm();

    fireEvent.click(submit);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submit);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('caps the field at the backend maximum length', () => {
    const { input } = renderForm();

    expect(input).toHaveAttribute('maxlength', '120');
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '../FormInput';

describe('FormInput', () => {
  it('renders with label', () => {
    render(<FormInput label="Test Label" />);
    expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(<FormInput label="Test Label" required />);
    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass('text-near-black');
  });

  it('displays error message', () => {
    render(<FormInput label="Test Label" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('displays helper text', () => {
    render(<FormInput label="Test Label" helperText="Please enter your name" />);
    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
  });

  it('handles user input', () => {
    const handleChange = jest.fn();
    render(<FormInput label="Test Label" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<FormInput label="Test" variant="default" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-white');
    
    rerender(<FormInput label="Test" variant="filled" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-near-black');
    
    rerender(<FormInput label="Test" variant="outlined" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-transparent');
  });

  it('applies size classes', () => {
    const { rerender } = render(<FormInput label="Test" size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-10');
    
    rerender(<FormInput label="Test" size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-12');
    
    rerender(<FormInput label="Test" size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-14');
  });

  it('forwards ref to input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<FormInput label="Test" ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.tagName).toBe('INPUT');
  });
});
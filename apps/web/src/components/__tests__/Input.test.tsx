import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

// Input component test (TDD - component doesn't exist yet)
describe('Input', () => {
  it('should render input with label', () => {
    render(<Input label="Email" name="email" />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = jest.fn();
    render(<Input label="Email" name="email" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test@example.com');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test@example.com');
  });

  it('should support different input types', () => {
    const { rerender } = render(<Input label="Password" name="password" type="password" />);
    
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    
    rerender(<Input label="Email" name="email" type="email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    
    rerender(<Input label="Number" name="number" type="number" />);
    expect(screen.getByLabelText('Number')).toHaveAttribute('type', 'number');
  });

  it('should display error message', () => {
    render(<Input label="Email" name="email" error="Invalid email address" />);
    
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('should support placeholder', () => {
    render(<Input label="Email" name="email" placeholder="Enter your email" />);
    
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('should support disabled state', () => {
    render(<Input label="Email" name="email" disabled />);
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should support required field', () => {
    render(<Input label="Email" name="email" required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('required');
  });

  it('should support helper text', () => {
    render(<Input label="Email" name="email" helperText="We'll never share your email" />);
    
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it('should handle blur events', async () => {
    const handleBlur = jest.fn();
    render(<Input label="Email" name="email" onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab();
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should support custom className', () => {
    render(<Input label="Email" name="email" className="custom-input" />);
    
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });
});
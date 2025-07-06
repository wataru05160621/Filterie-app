import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RegisterPage from '../register/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API calls
jest.mock('@/lib/api', () => ({
  register: jest.fn(),
}));

import { register } from '@/lib/api';

describe('Register Page', () => {
  const mockPush = jest.fn();
  const mockRegister = register as jest.MockedFunction<typeof register>;

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('should render registration form', () => {
    render(<RegisterPage />);
    
    expect(screen.getByRole('heading', { name: /アカウント作成/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^パスワード$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード（確認）/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登録/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /登録/i });
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/名前を入力してください/i)).toBeInTheDocument();
    expect(await screen.findByText(/メールアドレスを入力してください/i)).toBeInTheDocument();
    expect(await screen.findByText(/パスワードを入力してください/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<RegisterPage />);
    
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab();
    
    expect(await screen.findByText(/有効なメールアドレスを入力してください/i)).toBeInTheDocument();
  });

  it('should validate password strength', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    await userEvent.type(passwordInput, 'weak');
    await userEvent.tab();
    
    expect(await screen.findByText(/パスワードは8文字以上で、大文字・小文字・数字を含む必要があります/i)).toBeInTheDocument();
  });

  it('should validate password confirmation match', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    const confirmInput = screen.getByLabelText(/パスワード（確認）/i);
    
    await userEvent.type(passwordInput, 'StrongPass123!');
    await userEvent.type(confirmInput, 'DifferentPass123!');
    await userEvent.tab();
    
    expect(await screen.findByText(/パスワードが一致しません/i)).toBeInTheDocument();
  });

  it('should submit registration form with valid data', async () => {
    mockRegister.mockResolvedValueOnce({
      access_token: 'token',
      refresh_token: 'refresh',
      user: { id: '1', email: 'new@example.com', name: 'New User' },
    });

    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/名前/i);
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    const confirmInput = screen.getByLabelText(/パスワード（確認）/i);
    const submitButton = screen.getByRole('button', { name: /登録/i });
    
    await userEvent.type(nameInput, 'New User');
    await userEvent.type(emailInput, 'new@example.com');
    await userEvent.type(passwordInput, 'StrongPass123!');
    await userEvent.type(confirmInput, 'StrongPass123!');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'StrongPass123!',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error for duplicate email', async () => {
    mockRegister.mockRejectedValueOnce({ 
      response: { data: { message: 'Email already exists' } } 
    });

    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/名前/i);
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    const confirmInput = screen.getByLabelText(/パスワード（確認）/i);
    const submitButton = screen.getByRole('button', { name: /登録/i });
    
    await userEvent.type(nameInput, 'New User');
    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'StrongPass123!');
    await userEvent.type(confirmInput, 'StrongPass123!');
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/このメールアドレスは既に登録されています/i)).toBeInTheDocument();
  });

  it('should show loading state during submission', async () => {
    mockRegister.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/名前/i);
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    const confirmInput = screen.getByLabelText(/パスワード（確認）/i);
    const submitButton = screen.getByRole('button', { name: /登録/i });
    
    await userEvent.type(nameInput, 'New User');
    await userEvent.type(emailInput, 'new@example.com');
    await userEvent.type(passwordInput, 'StrongPass123!');
    await userEvent.type(confirmInput, 'StrongPass123!');
    await userEvent.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/登録中.../i)).toBeInTheDocument();
  });

  it('should have link to login page', () => {
    render(<RegisterPage />);
    
    const loginLink = screen.getByRole('link', { name: /既にアカウントをお持ちの方/i });
    expect(loginLink).toHaveAttribute('href', '/auth/login');
  });

  it('should accept terms and conditions', async () => {
    render(<RegisterPage />);
    
    const termsCheckbox = screen.getByRole('checkbox', { name: /利用規約に同意/i });
    expect(termsCheckbox).toBeInTheDocument();
    expect(termsCheckbox).not.toBeChecked();
    
    const submitButton = screen.getByRole('button', { name: /登録/i });
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/利用規約に同意してください/i)).toBeInTheDocument();
  });

  it('should show password strength indicator', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    
    // Weak password
    await userEvent.type(passwordInput, 'weak');
    expect(screen.getByText(/弱い/i)).toBeInTheDocument();
    
    // Medium password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'Medium123');
    expect(screen.getByText(/中/i)).toBeInTheDocument();
    
    // Strong password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'StrongPass123!');
    expect(screen.getByText(/強い/i)).toBeInTheDocument();
  });
});
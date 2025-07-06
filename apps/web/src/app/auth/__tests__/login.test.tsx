import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '../login/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock API calls
jest.mock('@/lib/api', () => ({
  login: jest.fn(),
}));

import { login } from '@/lib/api';

describe('Login Page', () => {
  const mockPush = jest.fn();
  const mockLogin = login as jest.MockedFunction<typeof login>;

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: /ログイン/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/有効なメールアドレスを入力してください/i)).toBeInTheDocument();
  });

  it('should validate password length', async () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    
    await userEvent.type(passwordInput, '123');
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/パスワードは8文字以上必要です/i)).toBeInTheDocument();
  });

  it('should submit login form with valid data', async () => {
    mockLogin.mockResolvedValueOnce({
      access_token: 'token',
      refresh_token: 'refresh',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/メールアドレスまたはパスワードが正しくありません/i)).toBeInTheDocument();
  });

  it('should show loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/ログイン中.../i)).toBeInTheDocument();
  });

  it('should have link to registration page', () => {
    render(<LoginPage />);
    
    const registerLink = screen.getByRole('link', { name: /アカウントを作成/i });
    expect(registerLink).toHaveAttribute('href', '/auth/register');
  });

  it('should have link to password reset', () => {
    render(<LoginPage />);
    
    const resetLink = screen.getByRole('link', { name: /パスワードを忘れた方/i });
    expect(resetLink).toHaveAttribute('href', '/auth/reset-password');
  });

  it('should redirect if already authenticated', async () => {
    // Mock authenticated state
    jest.mock('@/hooks/useAuth', () => ({
      useAuth: () => ({ isAuthenticated: true }),
    }));

    render(<LoginPage />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
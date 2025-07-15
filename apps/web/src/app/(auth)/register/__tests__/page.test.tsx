import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { useRouter } from 'next/navigation';
import RegisterPage from '../page';
import { REGISTER_MUTATION } from '../mutations';
import { AuthProvider } from '@/providers/auth-provider';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

// Wrapper component for tests
const TestWrapper = ({ children, mocks = [] }: { children: React.ReactNode; mocks?: any[] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MockedProvider>
);

describe('RegisterPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
  });

  it('should render registration form', () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    expect(screen.getByLabelText('名前')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: '登録' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('名前は必須です')).toBeInTheDocument();
      expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument();
      expect(screen.getByText('パスワードは必須です')).toBeInTheDocument();
    });
  });

  it('should show error for invalid email format', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText('名前');
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: '登録' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
    });
  });

  it('should show error for short password', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, '12345');
    
    const submitButton = screen.getByRole('button', { name: '登録' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('パスワードは8文字以上である必要があります')).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    
    const submitButton = screen.getByRole('button', { name: '登録' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    });
  });

  it('should successfully register user', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: REGISTER_MUTATION,
          variables: {
            input: {
              name: 'Test User',
              email: 'test@example.com',
              password: 'password123',
            },
          },
        },
        result: {
          data: {
            register: {
              user: {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
              },
              accessToken: 'fake-jwt-token',
            },
          },
        },
      },
    ];

    render(
      <TestWrapper mocks={mocks}>
        <RegisterPage />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText('名前');
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: '登録' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error message when email already exists', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: REGISTER_MUTATION,
          variables: {
            input: {
              name: 'Test User',
              email: 'existing@example.com',
              password: 'password123',
            },
          },
        },
        error: new Error('このメールアドレスは既に登録されています'),
      },
    ];

    render(
      <TestWrapper mocks={mocks}>
        <RegisterPage />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText('名前');
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: '登録' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('このメールアドレスは既に登録されています')).toBeInTheDocument();
    });
  });

  it('should have link to login page', () => {
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const loginLink = screen.getByText('ログインはこちら');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText('パスワード');
    const toggleButton = screen.getByTestId('toggle-password');

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});